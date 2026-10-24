const express = require("express");
const { validarEmail, gerarHashSenha, verificarSenha } = require("../regras");

function semSenha({ senha, ...u }) {
  return u;
}

module.exports = function rotasUsuarios(db) {
  const r = express.Router();

  r.post("/usuarios", (req, res) => {
    const { nome = "", email = "", telefone = "", cep = "", endereco = "", senha = "" } = req.body || {};
    if (!nome.trim() || !email.trim() || !senha) {
      return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
    }
    if (!validarEmail(email)) return res.status(400).json({ erro: "E-mail inválido." });
    if (senha.length < 6) return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });

    const emailNormalizado = email.trim().toLowerCase();
    if (db.prepare("SELECT id FROM usuarios WHERE email = ?").get(emailNormalizado)) {
      return res.status(409).json({ erro: "Já existe uma conta com este e-mail." });
    }

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO usuarios (nome, email, telefone, cep, endereco, senha, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(nome.trim(), emailNormalizado, telefone.trim(), cep.trim(), endereco.trim(),
      gerarHashSenha(senha), new Date().toISOString());

    res.status(201).json(semSenha(db.prepare("SELECT * FROM usuarios WHERE id = ?").get(lastInsertRowid)));
  });

  r.post("/login", (req, res) => {
    const { email = "", senha = "" } = req.body || {};
    const u = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email.trim().toLowerCase());
    if (!u || !verificarSenha(senha, u.senha)) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
    res.json(semSenha(u));
  });

  return r;
};