// Testes do pagamento com Mercado Pago. A API do Mercado Pago é SIMULADA (mock do fetch),
// então estes testes não fazem cobranças nem precisam de internet.
const request = require("supertest");
const { abrirBanco } = require("../../src/banco");
const { criarApp } = require("../../src/app");
const mp = require("../../src/mercadopago");

const TOKEN_ORIGINAL = process.env.MP_ACCESS_TOKEN;
let app, usuario, respostaPagamento;

beforeEach(async () => {
  process.env.MP_ACCESS_TOKEN = "TEST-token-falso";
  respostaPagamento = null;
  jest.spyOn(global, "fetch").mockImplementation(async (url, opcoes) => {
    if (String(url).endsWith("/checkout/preferences")) {
      const corpo = JSON.parse(opcoes.body);
      return Response.json({ id: "pref-123", init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123", recebido: corpo });
    }
    if (String(url).includes("/v1/payments/search")) {
      return Response.json({ results: respostaPagamento ? [respostaPagamento] : [] });
    }
    return new Response("{}", { status: 404 });
  });
  app = criarApp(abrirBanco(":memory:"));
  usuario = (await request(app).post("/usuarios").send({ nome: "Ana", email: "ana@t.com", senha: "123456" })).body;
});

afterEach(() => {
  jest.restoreAllMocks();
  process.env.MP_ACCESS_TOKEN = TOKEN_ORIGINAL;
});

const pedidoMp = () => ({
  usuario_id: usuario.id, horario: "10h–12h", forma_pagamento: "Mercado Pago",
  itens: [{ produto_id: 1, quantidade: 2 }],
});

describe("funções do Mercado Pago (unitário)", () => {
  test("traduz os status do Mercado Pago", () => {
    expect(mp.traduzirStatus("approved")).toBe("aprovado");
    expect(mp.traduzirStatus("rejected")).toBe("recusado");
    expect(mp.traduzirStatus("in_process")).toBe("pendente");
    expect(mp.traduzirStatus("refunded")).toBe("estornado");
  });
  test("monta a preferência com itens em reais", () => {
    const pref = mp.montarPreferencia({ referencia: "ref-1", itens: [{ produto_id: 1, nome: "Maçã", quantidade: 2, preco_unitario: 7.9 }] });
    expect(pref).toMatchObject({ external_reference: "ref-1" });
    expect(pref.items[0]).toEqual({ id: "1", title: "Maçã", quantity: 2, unit_price: 7.9, currency_id: "BRL" });
  });
});

describe("pedido pago pelo Mercado Pago", () => {
  test("cria o pedido aguardando pagamento e devolve o link do checkout", async () => {
    const res = await request(app).post("/pedidos").send(pedidoMp()).expect(201);
    expect(res.body.status).toBe("aguardando_pagamento");
    expect(res.body.pagamento).toMatchObject({ status: "pendente", link_pagamento: expect.stringContaining("pref_id=pref-123") });
  });

  test("pagamento aprovado confirma o pedido", async () => {
    const { body } = await request(app).post("/pedidos").send(pedidoMp());
    respostaPagamento = { id: 999, status: "approved", date_approved: "2026-10-24T20:00:00.000Z" };
    const res = await request(app).post(`/pedidos/${body.id}/verificar-pagamento`).expect(200);
    expect(res.body.status).toBe("confirmado");
    expect(res.body.pagamento).toMatchObject({ status: "aprovado", mp_pagamento_id: "999" });
  });

  test("pagamento recusado cancela o pedido e devolve o estoque", async () => {
    const antes = (await request(app).get("/produtos/1")).body.estoque;
    const { body } = await request(app).post("/pedidos").send(pedidoMp());
    expect((await request(app).get("/produtos/1")).body.estoque).toBe(antes - 2);

    respostaPagamento = { id: 1000, status: "rejected" };
    const res = await request(app).post(`/pedidos/${body.id}/verificar-pagamento`).expect(200);
    expect(res.body.status).toBe("cancelado");
    expect((await request(app).get("/produtos/1")).body.estoque).toBe(antes);
  });

  test("sem pagamento ainda, o pedido continua aguardando", async () => {
    const { body } = await request(app).post("/pedidos").send(pedidoMp());
    const res = await request(app).post(`/pedidos/${body.id}/verificar-pagamento`).expect(200);
    expect(res.body.status).toBe("aguardando_pagamento");
  });

  test("sem token configurado, recusa com 503", async () => {
    delete process.env.MP_ACCESS_TOKEN;
    const res = await request(app).post("/pedidos").send(pedidoMp()).expect(503);
    expect(res.body.erro).toMatch(/MP_ACCESS_TOKEN/);
  });

  test("se o Mercado Pago falhar, o pedido é cancelado e o estoque volta", async () => {
    global.fetch.mockImplementation(async () => Response.json({ message: "invalid access token" }, { status: 401 }));
    const antes = (await request(app).get("/produtos/1")).body.estoque;
    const res = await request(app).post("/pedidos").send(pedidoMp()).expect(502);
    expect(res.body.erro).toMatch(/invalid access token/);
    expect((await request(app).get("/produtos/1")).body.estoque).toBe(antes);
  });
});