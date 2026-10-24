const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const produtosIniciais = require("./produtosIniciais");

const ARQUIVO_ESQUEMA = path.join(__dirname, "..", "..", "database", "frut_e_vida.sql");

// caminho ":memory:" cria um banco temporário (usado nos testes).
function abrirBanco(caminho = path.join(__dirname, "..", "dados", "frut_e_vida.db")) {
  if (caminho !== ":memory:") fs.mkdirSync(path.dirname(caminho), { recursive: true });

  const db = new Database(caminho);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(ARQUIVO_ESQUEMA, "utf8"));

  // Bancos criados antes da integração com o Mercado Pago não têm estas colunas.
  adicionarColunasSeFaltarem(db, "pagamentos", {
    mp_referencia: "TEXT",
    mp_preferencia_id: "TEXT",
    mp_pagamento_id: "TEXT",
    link_pagamento: "TEXT",
  });

  const { total } = db.prepare("SELECT COUNT(*) AS total FROM produtos").get();
  if (total === 0) {
    const agora = new Date().toISOString();
    const inserir = db.prepare(`
      INSERT INTO produtos (nome, categoria, unidade, emoji, destaque, preco, estoque, atualizado_em)
      VALUES (@nome, @categoria, @unidade, @emoji, @destaque, @preco, @estoque, @atualizado_em)
    `);
    db.transaction(() => {
      for (const p of produtosIniciais) inserir.run({ ...p, atualizado_em: agora });
    })();
  }
  return db;
}

function adicionarColunasSeFaltarem(db, tabela, colunas) {
  const existentes = new Set(db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name));
  for (const [nome, tipo] of Object.entries(colunas)) {
    if (!existentes.has(nome)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${nome} ${tipo}`);
  }
}

module.exports = { abrirBanco };