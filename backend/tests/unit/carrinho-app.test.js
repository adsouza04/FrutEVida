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
    const ok = {
      nome: "Ana Souza", cpf: "529.982.247-25", email: "ana@x.com", telefone: "(11) 95819-2716",
      senha: "12345678", confirmarSenha: "12345678", aceitouTermos: true,
    };
    expect(v.validarCadastro(ok)).toBeNull();
    expect(v.validarCadastro({ ...ok, confirmarSenha: "00000000" })).toBe("As senhas não conferem.");
    expect(v.validarCadastro({ ...ok, email: "ana" })).toBe("Digite um e-mail válido.");
    expect(v.errosCadastro({ ...ok, senha: "1234567", confirmarSenha: "1234567" })).toEqual({ senha: "A senha deve ter pelo menos 8 caracteres." });
    expect(Object.keys(v.errosCadastro({ ...ok, cpf: "111.111.111-11", telefone: "1199", aceitouTermos: false })))
      .toEqual(["cpf", "telefone", "aceitouTermos"]);
  });
});
describe("imagens dos produtos (src/utils/imagens.js)", () => {
  const { resolverImagem } = require("../../../src/utils/imagens");
  test("caminho do servidor recebe o endereço da API", () => {
    expect(resolverImagem("/imagens/maca.jpg", "http://192.168.0.10:3000/")).toBe("http://192.168.0.10:3000/imagens/maca.jpg");
  });
  test("link completo é usado como está; vazio vira null", () => {
    expect(resolverImagem("https://exemplo.com/a.jpg", "http://x")).toBe("https://exemplo.com/a.jpg");
    expect(resolverImagem("", "http://x")).toBeNull();
    expect(resolverImagem(null, "http://x")).toBeNull();
  });
});

describe("máscaras de CPF, telefone e CEP (src/utils/mascaras.js)", () => {
  const m = require("../../../src/utils/mascaras");
  test("aceitam só números e cortam o excesso", () => {
    expect(m.mascararCpf("529abc98224725999")).toBe("529.982.247-25");
    expect(m.mascararTelefone("11958192716000")).toBe("(11) 95819-2716");
    expect(m.mascararTelefone("1133334444")).toBe("(11) 3333-4444");
    expect(m.mascararCep("048633609")).toBe("04863-360");
  });
  test("formata enquanto digita", () => {
    expect(m.mascararCpf("5299")).toBe("529.9");
    expect(m.mascararTelefone("119")).toBe("(11) 9");
    expect(m.ocultarCpf("52998224725")).toBe("529.***.***-25");
  });
});

describe("carrinho com quantidade", () => {
  test("adiciona várias unidades de uma vez", () => {
    const itens = c.adicionarItem(c.adicionarItem([], maca, 3), maca, 2);
    expect(itens).toEqual([{ produto: maca, quantidade: 5 }]);
  });
});
