// Testes de INTEGRAÇÃO: rotas HTTP + banco SQLite real (em memória).
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");
const { abrirBanco } = require("../../src/banco");
const { criarApp } = require("../../src/app");

let app, pasta;
beforeEach(() => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "frutevida-"));
  app = criarApp(abrirBanco(":memory:"), { pastaExportacao: pasta });
});

describe("CRUD de produtos", () => {
  test("lista o catálogo inicial", async () => {
    const res = await request(app).get("/produtos").expect(200);
    expect(res.body.produtos).toHaveLength(10);
    expect(res.body.sincronizado_em).toBeDefined();
  });

  test("cria, lê, atualiza e exclui um produto", async () => {
    const criado = await request(app).post("/produtos").send({ nome: "Manga", preco: "9,90", categoria: "Frutas" }).expect(201);
    const id = criado.body.id;
    await request(app).get(`/produtos/${id}`).expect(200);
    const editado = await request(app).put(`/produtos/${id}`).send({ preco: 11 }).expect(200);
    expect(editado.body).toMatchObject({ nome: "Manga", preco: 11 });
    await request(app).delete(`/produtos/${id}`).expect(204);
    await request(app).get(`/produtos/${id}`).expect(404);
  });

  test("rejeita produto inválido com 400", async () => {
    const res = await request(app).post("/produtos").send({ nome: "", preco: -1 }).expect(400);
    expect(res.body.erro).toBeTruthy();
  });

  test("sincronização incremental devolve alterações e exclusões", async () => {
    const { body } = await request(app).get("/produtos");
    const marco = body.sincronizado_em;
    await new Promise((r) => setTimeout(r, 5));
    await request(app).put("/produtos/1").send({ preco: 8.5 });
    await request(app).delete("/produtos/2");

    const res = await request(app).get("/produtos").query({ desde: marco }).expect(200);
    const porId = Object.fromEntries(res.body.produtos.map((p) => [p.id, p]));
    expect(Object.keys(porId).sort()).toEqual(["1", "2"]);
    expect(porId[1].preco).toBe(8.5);
    expect(porId[2].ativo).toBe(false);
  });
});

describe("usuários", () => {
  const ana = { nome: "Ana", email: "Ana@Teste.com", senha: "123456" };
  test("cadastro, e-mail duplicado e login", async () => {
    const criado = await request(app).post("/usuarios").send(ana).expect(201);
    expect(criado.body.senha).toBeUndefined();
    await request(app).post("/usuarios").send(ana).expect(409);
    await request(app).post("/login").send({ email: "ana@teste.com", senha: "123456" }).expect(200);
    await request(app).post("/login").send({ email: "ana@teste.com", senha: "errada" }).expect(401);
  });
});

describe("pedidos", () => {
  async function criarUsuario() {
    return (await request(app).post("/usuarios").send({ nome: "Bia", email: "bia@t.com", senha: "123456" })).body;
  }

  test("cria pedido com total do servidor, agenda entrega e baixa estoque", async () => {
    const u = await criarUsuario();
    const antes = (await request(app).get("/produtos/1")).body.estoque;
    const res = await request(app).post("/pedidos").send({
      usuario_id: u.id, horario: "10h–12h", forma_pagamento: "Pix",
      itens: [{ produto_id: 1, quantidade: 2 }, { produto_id: 7, quantidade: 1 }],
    }).expect(201);
    expect(res.body.valor_total).toBe(27.8);
    expect(res.body.agendamento).toMatchObject({ horario_inicio: "10:00", horario_fim: "12:00" });
    expect(res.body.pagamento.forma_pagamento).toBe("Pix");
    expect((await request(app).get("/produtos/1")).body.estoque).toBe(antes - 2);
  });

  test("reenvio com mesmo id_local não duplica o pedido", async () => {
    const u = await criarUsuario();
    const corpo = { usuario_id: u.id, horario: "08h–10h", forma_pagamento: "Pix", id_local: "abc-1", itens: [{ produto_id: 1, quantidade: 1 }] };
    const a = await request(app).post("/pedidos").send(corpo).expect(201);
    const b = await request(app).post("/pedidos").send(corpo).expect(200);
    expect(b.body.id).toBe(a.body.id);
    expect((await request(app).get("/pedidos")).body).toHaveLength(1);
  });

  test("recusa forma de pagamento inválida", async () => {
    const u = await criarUsuario();
    await request(app).post("/pedidos").send({ usuario_id: u.id, horario: "08h–10h", forma_pagamento: "Cheque", itens: [{ produto_id: 1, quantidade: 1 }] }).expect(400);
  });
});

describe("exportação JSON", () => {
  test("gera arquivo com resumo, sem dados pessoais", async () => {
    await request(app).post("/usuarios").send({ nome: "Ana", email: "ana@t.com", senha: "123456" });
    const res = await request(app).post("/exportar").expect(201);
    expect(res.body.resumo.total_produtos).toBe(10);
    expect(res.body.clientes[0]).toEqual({ id: 1, criado_em: expect.any(String) });
    const arquivo = JSON.parse(fs.readFileSync(path.join(pasta, "dados_frut_e_vida.json"), "utf8"));
    expect(arquivo.app).toBe("Frut & Vida");
  });
});