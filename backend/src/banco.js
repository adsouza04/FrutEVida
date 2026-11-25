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
  adicionarColunasSeFaltarem(db, "usuarios", { perfil: "TEXT NOT NULL DEFAULT 'cliente'", cpf: "TEXT" });
  adicionarColunasSeFaltarem(db, "produtos", { imagem: "TEXT", preco_antigo: "REAL" });
  adicionarColunasSeFaltarem(db, "pedidos", {
    subtotal: "REAL",
    frete: "REAL NOT NULL DEFAULT 0",
    desconto: "REAL NOT NULL DEFAULT 0",
    cupom: "TEXT",
    tipo_entrega: "TEXT NOT NULL DEFAULT 'padrao'",
    endereco_entrega: "TEXT",
  });
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
      INSERT INTO produtos (nome, descricao, categoria, unidade, emoji, imagem, destaque, preco, preco_antigo, estoque, atualizado_em)
      VALUES (@nome, @descricao, @categoria, @unidade, @emoji, @imagem, @destaque, @preco, @preco_antigo, @estoque, @atualizado_em)
    `);
    db.transaction(() => {
      for (const p of produtosIniciais) inserir.run({ ...p, atualizado_em: agora });
    })();
  } else {
    atualizarCatalogo(db);
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

// Bancos criados com o catálogo antigo (10 produtos): renomeia os que mudaram de nome,
// liga as fotos, completa as descrições e adiciona os produtos que faltam.
// Preço e estoque alterados pelo administrador são mantidos.
const NOMES_ANTIGOS = { "Tempero Verde": "Cheiro-verde", "Suco Detox": "Suco Detox Verde", "Uva Thompson": "Uva Vitória" };
// Descrições do catálogo que foram corrigidas: só troca se o admin não tiver editado o texto.
const DESCRICOES_ANTIGAS = {
  "Uva Vitória": "Uva verde sem sementes, doce e crocante.",
  Mandioca: "Descascada e pronta para cozinhar ou fritar.",
};

function atualizarCatalogo(db) {
  const agora = new Date().toISOString();
  const buscar = db.prepare("SELECT * FROM produtos WHERE nome = ?");
  const renomear = db.prepare("UPDATE produtos SET nome = ?, atualizado_em = ? WHERE nome = ?");
  const completar = db.prepare(`
    UPDATE produtos SET imagem = @imagem, descricao = COALESCE(descricao, @descricao), atualizado_em = @agora
    WHERE id = @id
  `);
  const inserir = db.prepare(`
    INSERT INTO produtos (nome, descricao, categoria, unidade, emoji, imagem, destaque, preco, preco_antigo, estoque, atualizado_em)
    VALUES (@nome, @descricao, @categoria, @unidade, @emoji, @imagem, @destaque, @preco, @preco_antigo, @estoque, @atualizado_em)
  `);

  db.transaction(() => {
    for (const [antigo, novo] of Object.entries(NOMES_ANTIGOS)) {
      if (!buscar.get(novo)) renomear.run(novo, agora, antigo);
    }
    for (const p of produtosIniciais) {
      const atual = buscar.get(p.nome);
      if (!atual) {
        inserir.run({ ...p, atualizado_em: agora });
        continue;
      }
      // Só troca a foto se ela ainda for uma foto do catálogo (não um link colocado pelo admin).
      const fotoDoCatalogo = !atual.imagem || atual.imagem.startsWith("/imagens/");
      const precisaFoto = fotoDoCatalogo && atual.imagem !== p.imagem;
      const descricaoDesatualizada = DESCRICOES_ANTIGAS[p.nome] && atual.descricao === DESCRICOES_ANTIGAS[p.nome];
      if (descricaoDesatualizada) {
        db.prepare("UPDATE produtos SET descricao = ?, atualizado_em = ? WHERE id = ?").run(p.descricao, agora, atual.id);
      }
      if (precisaFoto || !atual.descricao) {
        completar.run({ id: atual.id, imagem: fotoDoCatalogo ? p.imagem : atual.imagem, descricao: p.descricao, agora });
      }
    }
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