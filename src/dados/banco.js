
import * as SQLite from "expo-sqlite";

let promessaBanco = null;


export function abrirBanco() {
  if (!promessaBanco) promessaBanco = criarTabelas();
  return promessaBanco;
}

export const inicializarBanco = abrirBanco;

async function criarTabelas() {
  const db = await SQLite.openDatabaseAsync("frut_e_vida.db");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS produtos_cache (
      id TEXT PRIMARY KEY NOT NULL,
      dados TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pedidos_pendentes (
      id_local TEXT PRIMARY KEY NOT NULL,
      corpo TEXT NOT NULL,
      criado_em TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      chave TEXT PRIMARY KEY NOT NULL,
      valor TEXT
    );
  `);
  return db;
}

// ---------- Produtos ----------
export async function lerProdutosCache() {
  const db = await inicializarBanco();
  const linhas = await db.getAllAsync("SELECT dados FROM produtos_cache");
  return linhas.map((l) => JSON.parse(l.dados)).sort((a, b) => Number(a.id) - Number(b.id));
}


export async function aplicarProdutosNoCache(produtos, { substituirTudo = false } = {}) {
  const db = await inicializarBanco();
  await db.withTransactionAsync(async () => {
    if (substituirTudo) await db.runAsync("DELETE FROM produtos_cache");
    for (const p of produtos) {
      if (p.ativo === false) {
        await db.runAsync("DELETE FROM produtos_cache WHERE id = ?", [String(p.id)]);
      } else {
        await db.runAsync("INSERT OR REPLACE INTO produtos_cache (id, dados) VALUES (?, ?)", [String(p.id), JSON.stringify(p)]);
      }
    }
  });
}


export async function enfileirarPedido(corpo) {
  const db = await inicializarBanco();
  await db.runAsync("INSERT OR REPLACE INTO pedidos_pendentes (id_local, corpo, criado_em) VALUES (?, ?, ?)",
    [corpo.id_local, JSON.stringify(corpo), new Date().toISOString()]);
}

export async function listarPedidosPendentes() {
  const db = await inicializarBanco();
  const linhas = await db.getAllAsync("SELECT corpo FROM pedidos_pendentes ORDER BY criado_em");
  return linhas.map((l) => JSON.parse(l.corpo));
}

export async function removerPedidoPendente(idLocal) {
  const db = await inicializarBanco();
  await db.runAsync("DELETE FROM pedidos_pendentes WHERE id_local = ?", [idLocal]);
}

export async function lerMeta(chave) {
  const db = await inicializarBanco();
  const linha = await db.getFirstAsync("SELECT valor FROM meta WHERE chave = ?", [chave]);
  return linha ? linha.valor : null;
}

export async function gravarMeta(chave, valor) {
  const db = await inicializarBanco();
  await db.runAsync("INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)", [chave, valor]);
}