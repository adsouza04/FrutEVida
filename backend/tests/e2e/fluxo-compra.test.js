
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
    nome: "Cliente E2E", email: "e2e@frutevida.com", cpf: "100.039.595-20", telefone: "(11) 3333-4444", senha: "senha123",
  });
  expect(cadastro.status).toBe(201);
  const login = await chamar("POST", "/login", { email: "e2e@frutevida.com", senha: "senha123" });
  expect(login.status).toBe(200);

  // Checkout: o cliente salva o endereço de entrega
  const endereco = { cep: "01310-100", rua: "Avenida Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP" };
  const salvo = await chamar("PUT", `/usuarios/${login.corpo.id}/endereco`, endereco);
  expect(salvo.corpo.endereco.rua).toBe("Avenida Paulista");

  const { corpo: catalogo } = await chamar("GET", "/produtos");
  const banana = catalogo.produtos.find((p) => p.nome === "Banana Prata");
  const pedido = await chamar("POST", "/pedidos", {
    usuario_id: login.corpo.id, tipo_entrega: "padrao", horario: "14h–16h", forma_pagamento: "Cartão de crédito",
    endereco: salvo.corpo.endereco, itens: [{ produto_id: banana.id, quantidade: 3 }],
  });
  expect(pedido.status).toBe(201);
  expect(pedido.corpo).toMatchObject({ subtotal: 16.5, frete: 7.9, valor_total: 24.4, status: "confirmado" });

  // Admin altera o preço; o celular recebe a mudança na sincronização incremental
  await new Promise((r) => setTimeout(r, 5));
  await chamar("PUT", `/produtos/${banana.id}`, { preco: 6 });
  const { corpo: mudancas } = await chamar("GET", `/produtos?desde=${encodeURIComponent(catalogo.sincronizado_em)}`);
  expect(mudancas.produtos.find((p) => p.id === banana.id).preco).toBe(6);

  // Admin avança o pedido até a entrega; o cliente acompanha no rastreamento
  for (let i = 0; i < 3; i++) await chamar("POST", `/pedidos/${pedido.corpo.id}/avancar`);
  const { corpo: historico } = await chamar("GET", `/pedidos?usuario_id=${login.corpo.id}`);
  expect(historico).toHaveLength(1);
  expect(historico[0].status).toBe("entregue");
  expect(historico[0].rastreamento).toHaveLength(4);

  const exportacao = await chamar("POST", "/exportar");
  expect(exportacao.corpo.resumo).toMatchObject({ total_pedidos: 1, faturamento_total: 24.4 });
  expect(exportacao.corpo.pedidos[0]).toMatchObject({ bairro: "Bela Vista", cidade: "São Paulo" });
  expect(exportacao.corpo.pedidos[0].endereco_entrega).toBeUndefined(); // sem rua e número no JSON
});
