const express = require("express");
const { validarProduto } = require("../regras");

function formatar(p) {
  return { ...p, destaque: Boolean(p.destaque), ativo: Boolean(p.ativo) };
}

module.exports = function rotasProdutos(db) {
  const r = express.Router();

  r.get("/", (req, res) => {
    const { desde } = req.query;
   
    const sincronizado_em = new Date().toISOString();
    const linhas = desde
      ? db.prepare("SELECT * FROM produtos WHERE atualizado_em > ? ORDER BY id").all(String(desde))
      : db.prepare("SELECT * FROM produtos WHERE ativo = 1 ORDER BY id").all();
    res.json({ produtos: linhas.map(formatar), sincronizado_em });
  });

  r.get("/:id", (req, res) => {
    const p = db.prepare("SELECT * FROM produtos WHERE id = ? AND ativo = 1").get(req.params.id);
    if (!p) return res.status(404).json({ erro: "Produto não encontrado." });
    res.json(formatar(p));
  });

  r.post("/", (req, res) => {
    const { valido, erros, produto } = validarProduto(req.body || {});
    if (!valido) return res.status(400).json({ erro: erros.join(" "), erros });

    const dados = {
      unidade: null, emoji: null, descricao: null, destaque: 0, estoque: 0,
      ...produto,
      atualizado_em: new Date().toISOString(),
    };
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO produtos (nome, descricao, categoria, unidade, emoji, destaque, preco, estoque, atualizado_em)
      VALUES (@nome, @descricao, @categoria, @unidade, @emoji, @destaque, @preco, @estoque, @atualizado_em)
    `).run(dados);
    res.status(201).json(formatar(db.prepare("SELECT * FROM produtos WHERE id = ?").get(lastInsertRowid)));
  });

  r.put("/:id", (req, res) => {
    const atual = db.prepare("SELECT * FROM produtos WHERE id = ? AND ativo = 1").get(req.params.id);
    if (!atual) return res.status(404).json({ erro: "Produto não encontrado." });

    const { valido, erros, produto } = validarProduto(req.body || {}, { parcial: true });
    if (!valido) return res.status(400).json({ erro: erros.join(" "), erros });

    const novo = { ...atual, ...produto, atualizado_em: new Date().toISOString() };
    db.prepare(`
      UPDATE produtos SET nome=@nome, descricao=@descricao, categoria=@categoria, unidade=@unidade,
        emoji=@emoji, destaque=@destaque, preco=@preco, estoque=@estoque, atualizado_em=@atualizado_em
      WHERE id=@id
    `).run(novo);
    res.json(formatar(db.prepare("SELECT * FROM produtos WHERE id = ?").get(atual.id)));
  });

  
  r.delete("/:id", (req, res) => {
    const info = db.prepare("UPDATE produtos SET ativo = 0, atualizado_em = ? WHERE id = ? AND ativo = 1")
      .run(new Date().toISOString(), req.params.id);
    if (info.changes === 0) return res.status(404).json({ erro: "Produto não encontrado." });
    res.status(204).end();
  });

  return r;
};