// Testes de INTEGRAÇÃO: rotas HTTP + banco SQLite real (em memória).
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");
const { abrirBanco } = require("../../src/banco");
const { criarApp } = require("../../src/app");

const catalogo = require("../../src/produtosIniciais");

let app, pasta;
// Busca o id de um produto do catálogo pelo nome (os ids dependem da ordem do catálogo).
async function idDe(nome) {
  const { body } = await request(app).get("/produtos");
  return body.produtos.find((p) => p.nome === nome).id;
}
beforeEach(() => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "frutevida-"));
  app = criarApp(abrirBanco(":memory:"), { pastaExportacao: pasta });
});

describe("CRUD de produtos", () => {
  test("lista o catálogo inicial", async () => {
    const res = await request(app).get("/produtos").expect(200);
    expect(res.body.produtos).toHaveLength(catalogo.length);
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
  const ana = { nome: "Ana", email: "Ana@Teste.com", cpf: "100.000.000-19", telefone: "(11) 95819-2716", senha: "12345678" };
  test("cadastro, e-mail duplicado e login", async () => {
    const criado = await request(app).post("/usuarios").send(ana).expect(201);
    expect(criado.body.senha).toBeUndefined();
    expect(criado.body).toMatchObject({ cpf: "10000000019", telefone: "11958192716", endereco: null });
    await request(app).post("/usuarios").send(ana).expect(409);
    await request(app).post("/usuarios").send({ ...ana, email: "outra@teste.com" }).expect(409); // CPF repetido
    await request(app).post("/login").send({ email: "ana@teste.com", senha: "12345678" }).expect(200);
    await request(app).post("/login").send({ email: "ana@teste.com", senha: "errada123" }).expect(401);
  });

  test("recusa CPF inválido, senha curta e telefone incompleto", async () => {
    await request(app).post("/usuarios").send({ ...ana, cpf: "111.111.111-11" }).expect(400);
    await request(app).post("/usuarios").send({ ...ana, senha: "1234567" }).expect(400);
    await request(app).post("/usuarios").send({ ...ana, telefone: "(11) 9581" }).expect(400);
  });

  test("salva o endereço de entrega em campos separados", async () => {
    const u = (await request(app).post("/usuarios").send(ana)).body;
    const endereco = { cep: "04863-360", rua: "Rua Pinha Natal", numero: "116", bairro: "Vila Natal", cidade: "São Paulo", uf: "sp" };
    const res = await request(app).put(`/usuarios/${u.id}/endereco`).send(endereco).expect(200);
    expect(res.body.endereco).toMatchObject({ cep: "04863360", numero: "116", uf: "SP" });
    await request(app).put(`/usuarios/${u.id}/endereco`).send({ ...endereco, numero: "" }).expect(400);
  });

  test("favorita e desfavorita produtos", async () => {
    const u = (await request(app).post("/usuarios").send(ana)).body;
    await request(app).post(`/usuarios/${u.id}/favoritos`).send({ produto_id: 3 }).expect(201);
    await request(app).post(`/usuarios/${u.id}/favoritos`).send({ produto_id: 3 }).expect(201); // sem duplicar
    expect((await request(app).get(`/usuarios/${u.id}/favoritos`)).body).toEqual([3]);
    await request(app).delete(`/usuarios/${u.id}/favoritos/3`).expect(204);
    expect((await request(app).get(`/usuarios/${u.id}/favoritos`)).body).toEqual([]);
  });
});

describe("perfis e imagens", () => {
  test("administrador padrão faz login com perfil admin; cliente novo é perfil cliente", async () => {
    const admin = await request(app).post("/login").send({ email: "admin@frutevida.com", senha: "admin123" }).expect(200);
    expect(admin.body.perfil).toBe("admin");
    const cliente = await request(app).post("/usuarios").send({ nome: "Caio", email: "caio@t.com", cpf: "10000791989", senha: "12345678", perfil: "admin" }).expect(201);
    expect(cliente.body.perfil).toBe("cliente"); // o cadastro público não consegue virar admin
  });

  test("catálogo inicial já vem com o caminho da foto", async () => {
    const res = await request(app).get(`/produtos/${await idDe("Maçã Fuji")}`).expect(200);
    expect(res.body.imagem).toBe("/imagens/maca.jpg");
    expect(res.body.descricao).toBeTruthy();
  });

  test("aceita link de imagem válido e recusa texto qualquer", async () => {
    await request(app).put("/produtos/1").send({ imagem: "https://exemplo.com/maca.jpg" }).expect(200);
    await request(app).put("/produtos/1").send({ imagem: "maca" }).expect(400);
  });
});

describe("pedidos", () => {
  async function criarUsuario() {
    return (await request(app).post("/usuarios").send({ nome: "Bia", email: "bia@t.com", cpf: "10001583816", senha: "12345678" })).body;
  }

  test("cria pedido com total do servidor, agenda entrega e baixa estoque", async () => {
    const u = await criarUsuario();
    const maca = await idDe("Maçã Fuji");
    const suco = await idDe("Suco Detox Verde");
    const antes = (await request(app).get(`/produtos/${maca}`)).body.estoque;
    const res = await request(app).post("/pedidos").send({
      usuario_id: u.id, horario: "10h–12h", forma_pagamento: "Pix",
      itens: [{ produto_id: maca, quantidade: 2 }, { produto_id: suco, quantidade: 1 }],
    }).expect(201);
    // 2 x 7,90 + 12,00 = 27,80 de produtos + 7,90 de frete padrão
    expect(res.body).toMatchObject({ subtotal: 27.8, frete: 7.9, desconto: 0, valor_total: 35.7, codigo: expect.stringMatching(/^FV-\d{6}$/) });
    expect(res.body.agendamento).toMatchObject({ horario_inicio: "10:00", horario_fim: "12:00" });
    expect(res.body.pagamento.forma_pagamento).toBe("Pix");
    expect(res.body.rastreamento.map((e) => e.status)).toEqual(["confirmado"]);
    expect((await request(app).get(`/produtos/${maca}`)).body.estoque).toBe(antes - 2);
  });

  test("aplica cupom, frete grátis acima de R$ 100 e guarda o endereço", async () => {
    const u = await criarUsuario();
    const melancia = await idDe("Melancia");
    const endereco = { cep: "04863360", rua: "Rua Pinha Natal", numero: "116", bairro: "Vila Natal", cidade: "São Paulo", uf: "SP" };
    const res = await request(app).post("/pedidos").send({
      usuario_id: u.id, horario: "14h–16h", forma_pagamento: "Pix", cupom: "fruta10", endereco,
      itens: [{ produto_id: melancia, quantidade: 5 }], // 5 x 24,90 = 124,50
    }).expect(201);
    expect(res.body).toMatchObject({ subtotal: 124.5, frete: 0, desconto: 12.45, valor_total: 112.05, cupom: "FRUTA10" });
    expect(res.body.endereco_entrega).toMatchObject({ bairro: "Vila Natal", numero: "116" });
  });

  test("entrega expressa cobra a taxa e dispensa o horário", async () => {
    const u = await criarUsuario();
    const res = await request(app).post("/pedidos").send({
      usuario_id: u.id, tipo_entrega: "expressa", forma_pagamento: "Pix",
      itens: [{ produto_id: await idDe("Banana Prata"), quantidade: 2 }],
    }).expect(201);
    expect(res.body).toMatchObject({ tipo_entrega: "expressa", frete: 14.9, valor_total: 25.9 });
  });

  test("recusa cupom inválido", async () => {
    const u = await criarUsuario();
    const res = await request(app).post("/pedidos").send({
      usuario_id: u.id, horario: "08h–10h", forma_pagamento: "Pix", cupom: "NAOEXISTE",
      itens: [{ produto_id: 1, quantidade: 1 }],
    }).expect(400);
    expect(res.body.erro).toMatch(/cupom/i);
  });

  test("administrador avança as etapas até a entrega", async () => {
    const u = await criarUsuario();
    const { body: pedido } = await request(app).post("/pedidos").send({
      usuario_id: u.id, horario: "08h–10h", forma_pagamento: "Pix", itens: [{ produto_id: 1, quantidade: 1 }],
    });
    for (const esperado of ["separando", "saiu_para_entrega", "entregue"]) {
      const res = await request(app).post(`/pedidos/${pedido.id}/avancar`).expect(200);
      expect(res.body.status).toBe(esperado);
    }
    await request(app).post(`/pedidos/${pedido.id}/avancar`).expect(409);
    const final = (await request(app).get(`/pedidos/${pedido.id}`)).body;
    expect(final.rastreamento.map((e) => e.status)).toEqual(["confirmado", "separando", "saiu_para_entrega", "entregue"]);
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
    await request(app).post("/usuarios").send({ nome: "Ana", email: "ana@t.com", cpf: "10002375753", senha: "12345678" });
    const res = await request(app).post("/exportar").expect(201);
    expect(res.body.resumo.total_produtos).toBe(catalogo.length);
    expect(res.body.resumo.total_clientes).toBe(1); // o administrador não conta como cliente
    expect(res.body.clientes[0]).toEqual({ id: expect.any(Number), criado_em: expect.any(String) });
    const arquivo = JSON.parse(fs.readFileSync(path.join(pasta, "dados_frut_e_vida.json"), "utf8"));
    expect(arquivo.app).toBe("Frut & Vida");
  });
});