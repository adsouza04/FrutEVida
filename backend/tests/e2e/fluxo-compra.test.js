
const fs = require("fs");
const os = require("os");
const path = require("path");
const { abrirBanco } = require("../../src/banco");
const { criarApp } = require("../../src/app");

let servidor, URL_API, pasta;

beforeAll((pronto) => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "frutevida-e2e-"));
  servidor = criarApp(abrirBanco(path.join(pasta, "e2e.db")), { pastaExportacao: pasta }).listen(0, () => {
    URL_API = `http://127.0.0.1:${servidor.address().port}`;
    pronto();
  });
});
afterAll((pronto) => {
  servidor.closeAllConnections(); // encerra conexões keep-alive do fetch
  servidor.close(() => pronto());
});

async function chamar(metodo, rota, corpo) {
  const res = await fetch(URL_API + rota, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: res.status, corpo: res.status === 204 ? null : await res.json() };
}

test("cliente compra e administrador acompanha", async () => {
  const cadastro = await chamar("POST", "/usuarios", {
    nome: "Cliente E2E", email: "e2e@frutevida.com", senha: "senha123", cep: "01310-100", endereco: "Av. Paulista, 1000",
  });
  expect(cadastro.status).toBe(201);
  const login = await chamar("POST", "/login", { email: "e2e@frutevida.com", senha: "senha123" });
  expect(login.status).toBe(200);

  const { corpo: catalogo } = await chamar("GET", "/produtos");
  const banana = catalogo.produtos.find((p) => p.nome === "Banana Prata");
  const pedido = await chamar("POST", "/pedidos", {
    usuario_id: login.corpo.id, horario: "14h–16h", forma_pagamento: "Cartão de crédito",
    itens: [{ produto_id: banana.id, quantidade: 3 }],
  });
  expect(pedido.status).toBe(201);
  expect(pedido.corpo.valor_total).toBe(16.5);

  // Admin altera o preço; o celular recebe a mudança na sincronização incremental
  await new Promise((r) => setTimeout(r, 5));
  await chamar("PUT", `/produtos/${banana.id}`, { preco: 6 });
  const { corpo: mudancas } = await chamar("GET", `/produtos?desde=${encodeURIComponent(catalogo.sincronizado_em)}`);
  expect(mudancas.produtos.find((p) => p.id === banana.id).preco).toBe(6);

  const { corpo: historico } = await chamar("GET", `/pedidos?usuario_id=${login.corpo.id}`);
  expect(historico).toHaveLength(1);
  const exportacao = await chamar("POST", "/exportar");
  expect(exportacao.corpo.resumo).toMatchObject({ total_pedidos: 1, faturamento_total: 16.5 });
});