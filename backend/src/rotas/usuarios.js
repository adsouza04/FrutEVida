const express = require("express");
const {
  validarEmail, validarCpf, somenteDigitos, gerarHashSenha, verificarSenha, validarEndereco, lerEndereco,
} = require("../regras");

const SENHA_MINIMA = 8;

// Nunca devolve a senha; o endereço sai como objeto.
function formatarUsuario({ senha, ...u }) {
  return { ...u, endereco: lerEndereco(u.endereco) };
}

module.exports = function rotasUsuarios(db) {
  const r = express.Router();

  r.post("/usuarios", (req, res) => {
    const { nome = "", email = "", cpf = "", telefone = "", senha = "" } = req.body || {};
    if (!nome.trim() || !email.trim() || !senha) {
      return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
    }
    if (!validarEmail(email)) return res.status(400).json({ erro: "E-mail inválido." });
    if (!validarCpf(cpf)) return res.status(400).json({ erro: "CPF inválido." });
    if (senha.length < SENHA_MINIMA) {
      return res.status(400).json({ erro: `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.` });
    }
    const telefoneDigitos = somenteDigitos(telefone);
    if (telefoneDigitos && (telefoneDigitos.length < 10 || telefoneDigitos.length > 11)) {
      return res.status(400).json({ erro: "Telefone inválido." });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const cpfDigitos = somenteDigitos(cpf);
    if (db.prepare("SELECT id FROM usuarios WHERE email = ?").get(emailNormalizado)) {
      return res.status(409).json({ erro: "Já existe uma conta com este e-mail." });
    }
    if (db.prepare("SELECT id FROM usuarios WHERE cpf = ?").get(cpfDigitos)) {
      return res.status(409).json({ erro: "Já existe uma conta com este CPF." });
    }

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO usuarios (nome, email, cpf, telefone, senha, criado_em)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nome.trim(), emailNormalizado, cpfDigitos, telefoneDigitos, gerarHashSenha(senha), new Date().toISOString());

    res.status(201).json(formatarUsuario(db.prepare("SELECT * FROM usuarios WHERE id = ?").get(lastInsertRowid)));
  });

  r.post("/login", (req, res) => {
    const { email = "", senha = "" } = req.body || {};
    const u = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email.trim().toLowerCase());
    if (!u || !verificarSenha(senha, u.senha)) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
    res.json(formatarUsuario(u));
  });

  // Endereço de entrega salvo (preenchido no checkout ou no perfil).
  r.put("/usuarios/:id/endereco", (req, res) => {
    const u = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(req.params.id);
    if (!u) return res.status(404).json({ erro: "Usuário não encontrado." });
    const { valido, erros, endereco } = validarEndereco(req.body || {});
    if (!valido) return res.status(400).json({ erro: erros.join(" "), erros });
    db.prepare("UPDATE usuarios SET cep = ?, endereco = ? WHERE id = ?")
      .run(endereco.cep, JSON.stringify(endereco), u.id);
    res.json(formatarUsuario(db.prepare("SELECT * FROM usuarios WHERE id = ?").get(u.id)));
  });

  // Favoritos do cliente
  r.get("/usuarios/:id/favoritos", (req, res) => {
    const linhas = db.prepare("SELECT produto_id FROM favoritos WHERE usuario_id = ? ORDER BY criado_em DESC")
      .all(req.params.id);
    res.json(linhas.map((l) => l.produto_id));
  });

  r.post("/usuarios/:id/favoritos", (req, res) => {
    const produtoId = Number(req.body?.produto_id);
    if (!db.prepare("SELECT id FROM usuarios WHERE id = ?").get(req.params.id)) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    if (!db.prepare("SELECT id FROM produtos WHERE id = ?").get(produtoId)) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }
    db.prepare("INSERT OR IGNORE INTO favoritos (usuario_id, produto_id, criado_em) VALUES (?, ?, ?)")
      .run(req.params.id, produtoId, new Date().toISOString());
    res.status(201).json({ produto_id: produtoId });
  });

  r.delete("/usuarios/:id/favoritos/:produtoId", (req, res) => {
    db.prepare("DELETE FROM favoritos WHERE usuario_id = ? AND produto_id = ?").run(req.params.id, req.params.produtoId);
    res.status(204).end();
  });

  return r;
};
