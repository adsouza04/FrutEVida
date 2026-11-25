// Testes UNITÁRIOS: funções puras de regra de negócio do servidor.
const r = require("../../src/regras");

describe("validarEmail", () => {
  test("aceita e-mail válido", () => expect(r.validarEmail("ana@frutevida.com")).toBe(true));
  test.each(["", "ana", "ana@", "ana@site", "a na@site.com"])("rejeita %p", (e) =>
    expect(r.validarEmail(e)).toBe(false));
});

describe("converterPreco", () => {
  test("aceita vírgula e ponto", () => {
    expect(r.converterPreco("7,90")).toBe(7.9);
    expect(r.converterPreco("12.5")).toBe(12.5);
    expect(r.converterPreco(3)).toBe(3);
  });
  test("rejeita texto inválido", () => {
    expect(r.converterPreco("abc")).toBeNaN();
    expect(r.converterPreco("1,234")).toBeNaN();
  });
});

describe("validarProduto", () => {
  const base = { nome: "Manga", preco: "9,90", categoria: "Frutas" };
  test("produto válido é normalizado", () => {
    const { valido, produto } = r.validarProduto(base);
    expect(valido).toBe(true);
    expect(produto).toMatchObject({ nome: "Manga", preco: 9.9, categoria: "Frutas" });
  });
  test("acusa nome, preço e categoria inválidos", () => {
    const { valido, erros } = r.validarProduto({ nome: "M", preco: "0", categoria: "Carnes" });
    expect(valido).toBe(false);
    expect(erros).toHaveLength(3);
  });
  test("modo parcial valida só os campos enviados", () => {
    expect(r.validarProduto({ preco: 5 }, { parcial: true }).valido).toBe(true);
  });
});

describe("interpretarHorario", () => {
  test("converte faixa do app", () => expect(r.interpretarHorario("08h–10h")).toEqual({ inicio: "08:00", fim: "10:00" }));
  test("rejeita faixa invertida ou mal formatada", () => {
    expect(r.interpretarHorario("10h–08h")).toBeNull();
    expect(r.interpretarHorario("manhã")).toBeNull();
  });
});

describe("calcularPedido", () => {
  const produtos = {
    1: { id: 1, nome: "Maçã", preco: 7.9, estoque: 10, ativo: 1 },
    2: { id: 2, nome: "Suco", preco: 12, estoque: 1, ativo: 1 },
    3: { id: 3, nome: "Antigo", preco: 1, estoque: 99, ativo: 0 },
  };
  test("calcula subtotais e total com preço do servidor", () => {
    const c = r.calcularPedido([{ produto_id: 1, quantidade: 3, preco_unitario: 0.01 }, { produto_id: 2, quantidade: 1 }], produtos);
    expect(c.valido).toBe(true);
    expect(c.itens[0].subtotal).toBe(23.7);
    expect(c.total).toBe(35.7);
  });
  test("bloqueia estoque insuficiente, produto inativo e pedido vazio", () => {
    expect(r.calcularPedido([{ produto_id: 2, quantidade: 2 }], produtos).valido).toBe(false);
    expect(r.calcularPedido([{ produto_id: 3, quantidade: 1 }], produtos).valido).toBe(false);
    expect(r.calcularPedido([], produtos).valido).toBe(false);
  });
});

describe("senhas", () => {
  test("hash é verificado e não guarda a senha em texto puro", () => {
    const hash = r.gerarHashSenha("segredo1");
    expect(hash).not.toContain("segredo1");
    expect(r.verificarSenha("segredo1", hash)).toBe(true);
    expect(r.verificarSenha("errada", hash)).toBe(false);
  });
});
describe("regras do pedido compartilhadas com o app", () => {
  test("valida CPF pelos dígitos verificadores", () => {
    expect(r.validarCpf("529.982.247-25")).toBe(true);
    expect(r.validarCpf("529.982.247-24")).toBe(false);
    expect(r.validarCpf("111.111.111-11")).toBe(false);
    expect(r.validarCpf("123")).toBe(false);
  });

  test("frete padrão é grátis a partir de R$ 100; expressa sempre cobra", () => {
    expect(r.calcularFrete(99.9, "padrao")).toBe(7.9);
    expect(r.calcularFrete(100, "padrao")).toBe(0);
    expect(r.calcularFrete(150, "expressa")).toBe(14.9);
    expect(r.calcularFrete(10, "drone")).toBeNull();
  });

  test("cupons de porcentagem, valor fixo e frete grátis", () => {
    expect(r.calcularResumo({ subtotal: 50, cupom: "FRUTA10" })).toMatchObject({ desconto: 5, frete: 7.9, total: 52.9 });
    expect(r.calcularResumo({ subtotal: 40, cupom: "bemvindo5" })).toMatchObject({ desconto: 5, total: 42.9 });
    expect(r.calcularResumo({ subtotal: 20, tipoEntrega: "expressa", cupom: "FRETEGRATIS" })).toMatchObject({ frete: 0, total: 20 });
  });

  test("cupom inválido ou abaixo do mínimo explica o motivo", () => {
    expect(r.validarCupom("XYZ", 50)).toMatchObject({ valido: false, erro: expect.stringMatching(/inválido/) });
    expect(r.validarCupom("BEMVINDO5", 20)).toMatchObject({ valido: false, erro: expect.stringMatching(/a partir de/) });
  });

  test("etapas do pedido seguem a ordem e param na entrega", () => {
    expect(r.proximoStatus("confirmado")).toBe("separando");
    expect(r.proximoStatus("saiu_para_entrega")).toBe("entregue");
    expect(r.proximoStatus("entregue")).toBeNull();
    expect(r.proximoStatus("aguardando_pagamento")).toBeNull();
  });

  test("valida o endereço por campos", () => {
    const ok = r.validarEndereco({ cep: "01310-100", rua: "Av. Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo" });
    expect(ok.valido).toBe(true);
    expect(ok.endereco.cep).toBe("01310100");
    expect(r.validarEndereco({ cep: "123" }).erros.length).toBeGreaterThan(1);
  });

  test("oferta exige preço antigo maior que o atual", () => {
    expect(r.validarProduto({ nome: "Kiwi", preco: 10, categoria: "Frutas", preco_antigo: 12 }).valido).toBe(true);
    expect(r.validarProduto({ nome: "Kiwi", preco: 10, categoria: "Frutas", preco_antigo: 9 }).valido).toBe(false);
  });
});
