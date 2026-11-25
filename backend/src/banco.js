const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const produtosIniciais = require("./produtosIniciais");
const { gerarHashSenha } = require("./regras");

// Conta de administrador criada automaticamente (troque a senha antes de publicar o app).
const ADMIN_PADRAO = { nome: "Administrador Frut & Vida", email: "admin@frutevida.com", senha: "admin123" };

const ARQUIVO_ESQUEMA = path.join(__dirname, "..", "..", "database", "frut_e_vida.sql");

// caminho ":memory:" cria um banco temporário (usado nos testes).
function abrirBanco(caminho = path.join(__dirname, "..", "dados", "frut_e_vida.db")) {
  if (caminho !== ":memory:") fs.mkdirSync(path.dirname(caminho), { recursive: true });

  const db = new Database(caminho);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(ARQUIVO_ESQUEMA, "utf8"));

  // Bancos criados antes da integração com o Mercado Pago não têm estas colunas.
  adicionarColunasSeFaltarem(db, "usuarios", { perfil: "TEXT NOT NULL DEFAULT 'cliente'" });
  adicionarColunasSeFaltarem(db, "produtos", { imagem: "TEXT" });
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
      INSERT INTO produtos (nome, categoria, unidade, emoji, imagem, destaque, preco, estoque, atualizado_em)
      VALUES (@nome, @categoria, @unidade, @emoji, @imagem, @destaque, @preco, @estoque, @atualizado_em)
    `);
    db.transaction(() => {
      for (const p of produtosIniciais) inserir.run({ imagem: null, ...p, atualizado_em: agora });
    })();
  } else {
    preencherImagensIniciais(db);
  }

  criarAdminSeNaoExistir(db);
  return db;
}

function adicionarColunasSeFaltarem(db, tabela, colunas) {
  const existentes = new Set(db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name));
  for (const [nome, tipo] of Object.entries(colunas)) {
    if (!existentes.has(nome)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${nome} ${tipo}`);
  }
}

// Bancos criados antes das fotos: liga cada produto do catálogo inicial à sua imagem.
function preencherImagensIniciais(db) {
  const atualizar = db.prepare(
    "UPDATE produtos SET imagem = ?, atualizado_em = ? WHERE nome = ? AND (imagem IS NULL OR imagem = '')"
  );
  const agora = new Date().toISOString();
  db.transaction(() => {
    for (const p of produtosIniciais) if (p.imagem) atualizar.run(p.imagem, agora, p.nome);
  })();
}

function criarAdminSeNaoExistir(db) {
  const existe = db.prepare("SELECT id FROM usuarios WHERE perfil = 'admin' LIMIT 1").get();
  if (existe) return;
  db.prepare(`
    INSERT INTO usuarios (nome, email, telefone, cep, endereco, senha, perfil, criado_em)
    VALUES (?, ?, '', '', '', ?, 'admin', ?)
  `).run(ADMIN_PADRAO.nome, ADMIN_PADRAO.email, gerarHashSenha(ADMIN_PADRAO.senha), new Date().toISOString());
}

module.exports = { abrirBanco, ADMIN_PADRAO };