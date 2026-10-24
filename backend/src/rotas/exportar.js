// Item 2.2 — gera os dados em formato JSON para o dashboard (Análise de Dados e Estatística).
const fs = require("fs");
const path = require("path");
const express = require("express");
const { buscarPedidoCompleto } = require("./pedidos");

function montarExportacao(db) {
  const produtos = db.prepare("SELECT id, nome, categoria, unidade, preco, estoque, ativo FROM produtos ORDER BY id").all()
    .map((p) => ({ ...p, ativo: Boolean(p.ativo) }));
  // Dados pessoais ficam de fora: o dashboard só precisa de id e data de cadastro.
  const clientes = db.prepare("SELECT id, criado_em FROM usuarios ORDER BY id").all();
  const pedidos = db.prepare("SELECT id FROM pedidos ORDER BY id").all().map((l) => buscarPedidoCompleto(db, l.id));
  const faturamento = pedidos.reduce((s, p) => s + p.valor_total, 0);

  return {
    app: "Frut & Vida",
    gerado_em: new Date().toISOString(),
    resumo: {
      total_produtos: produtos.filter((p) => p.ativo).length,
      total_clientes: clientes.length,
      total_pedidos: pedidos.length,
      faturamento_total: Math.round(faturamento * 100) / 100,
      ticket_medio: pedidos.length ? Math.round((faturamento / pedidos.length) * 100) / 100 : 0,
    },
    produtos,
    clientes,
    pedidos,
  };
}

module.exports = function rotasExportar(db, pastaExportacao) {
  const r = express.Router();

  r.get("/", (req, res) => res.json(montarExportacao(db)));

  // Chamado pelo botão "Gerar JSON" do app: salva o arquivo no servidor e devolve o conteúdo.
  r.post("/", (req, res) => {
    const dados = montarExportacao(db);
    fs.mkdirSync(pastaExportacao, { recursive: true });
    const arquivo = path.join(pastaExportacao, "dados_frut_e_vida.json");
    fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), "utf8");
    res.status(201).json({ arquivo: path.basename(arquivo), ...dados });
  });

  return r;
};

module.exports.montarExportacao = montarExportacao;