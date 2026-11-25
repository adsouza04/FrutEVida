const path = require("path");
const express = require("express");
const cors = require("cors");

const rotasProdutos = require("./rotas/produtos");
const rotasUsuarios = require("./rotas/usuarios");
const rotasPedidos = require("./rotas/pedidos");
const rotasExportar = require("./rotas/exportar");

function criarApp(db, { pastaExportacao = path.join(__dirname, "..", "exportacoes") } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Fotos dos produtos (backend/public/imagens). O app monta a URL completa a partir do endereço da API.
  app.use("/imagens", express.static(path.join(__dirname, "..", "public", "imagens"), { maxAge: "1d" }));

  app.get("/", (req, res) => res.json({ mensagem: "API Frut & Vida funcionando!", horario: new Date().toISOString() }));

  app.use("/produtos", rotasProdutos(db));
  app.use("/", rotasUsuarios(db));
  app.use("/pedidos", rotasPedidos(db));
  app.use("/exportar", rotasExportar(db, pastaExportacao));

  app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));
  app.use((erro, req, res, next) => {
    console.error(erro);
    res.status(500).json({ erro: "Erro interno no servidor." });
  });
  return app;
}

module.exports = { criarApp };