// Testes UNITÁRIOS das funções do APP (src/utils), que rodam no celular.
const c = require("../../../src/utils/carrinho");
const v = require("../../../src/utils/validacoes");

const maca = { id: "1", nome: "Maçã", preco: 7.9 };
const suco = { id: "7", nome: "Suco", preco: 12 };

describe("carrinho do app", () => {
  test("adiciona item novo e soma quantidade de item repetido", () => {
    let itens = c.adicionarItem([], maca);
    itens = c.adicionarItem(itens, maca);
    expect(itens).toEqual([{ produto: maca, quantidade: 2 }]);
  });
  test("diminuir até zero remove o item", () => {
    const itens = c.alterarQuantidadeItem([{ produto: maca, quantidade: 1 }], "1", -1);
    expect(itens).toEqual([]);
  });
  test("calcula total e quantidade sem erro de arredondamento", () => {
    const itens = [{ produto: maca, quantidade: 3 }, { produto: suco, quantidade: 1 }];
    expect(c.calcularTotal(itens)).toBe(35.7);
    expect(c.contarItens(itens)).toBe(4);
  });
  test("monta o corpo do pedido no formato da API", () => {
    expect(c.montarItensPedido([{ produto: maca, quantidade: 2 }])).toEqual([{ produto_id: 1, quantidade: 2 }]);
  });
});

describe("validações do app", () => {
  test("formata preço em reais", () => expect(v.formatarPreco(7.9)).toBe("R$ 7,90"));
  test("valida CEP com ou sem hífen", () => {
    expect(v.limparCep("01310-100")).toBe("01310100");
    expect(v.cepValido("01310-100")).toBe(true);
    expect(v.cepValido("123")).toBe(false);
  });
  test("valida formulário de cadastro", () => {
    const ok = { nome: "Ana", email: "ana@x.com", telefone: "11999999999", endereco: "Rua A, 1", senha: "123456", confirmarSenha: "123456" };
    expect(v.validarCadastro(ok)).toBeNull();
    expect(v.validarCadastro({ ...ok, confirmarSenha: "000000" })).toBe("As senhas não conferem.");
    expect(v.validarCadastro({ ...ok, email: "ana" })).toBe("Digite um e-mail válido.");
  });
});