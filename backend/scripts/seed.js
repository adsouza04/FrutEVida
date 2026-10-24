// Gera clientes e pedidos de EXEMPLO dos últimos 60 dias para o dashboard.
// Uso: npm run seed   (apaga pedidos/clientes antigos de exemplo e recria)
const { abrirBanco } = require("../src/banco");
const { gerarHashSenha, interpretarHorario, FORMAS_PAGAMENTO } = require("../src/regras");

const db = abrirBanco();

// Gerador pseudoaleatório com semente fixa: o resultado é sempre o mesmo.
let semente = 42;
const aleatorio = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;
const escolher = (lista, pesos) => {
  if (!pesos) return lista[Math.floor(aleatorio() * lista.length)];
  const total = pesos.reduce((a, b) => a + b, 0);
  let r = aleatorio() * total;
  for (let i = 0; i < lista.length; i++) if ((r -= pesos[i]) < 0) return lista[i];
  return lista[lista.length - 1];
};

const NOMES = ["Ana Souza", "Bruno Lima", "Carla Dias", "Diego Rocha", "Elisa Prado", "Felipe Nunes",
  "Gabriela Melo", "Heitor Alves", "Isabela Cruz", "João Pires", "Karina Reis", "Lucas Teixeira",
  "Marina Costa", "Nicolas Ramos", "Olívia Barros", "Paulo Freitas", "Renata Moura", "Sérgio Viana"];
const HORARIOS = ["08h–10h", "10h–12h", "14h–16h", "16h–18h"];

db.transaction(() => {
  db.exec(`
    DELETE FROM pagamentos; DELETE FROM agendamentos; DELETE FROM itens_pedido; DELETE FROM pedidos;
    DELETE FROM usuarios WHERE email LIKE '%@exemplo.frutevida';
  `);

  const hoje = new Date();
  const senha = gerarHashSenha("exemplo123");
  const clientes = NOMES.map((nome, i) => {
    const criado = new Date(hoje.getTime() - (75 - i * 2) * 86400000).toISOString();
    const email = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(" ", ".") + "@exemplo.frutevida";
    return db.prepare("INSERT INTO usuarios (nome, email, telefone, senha, criado_em) VALUES (?, ?, '', ?, ?)")
      .run(nome, email, senha, criado).lastInsertRowid;
  });

  const produtos = db.prepare("SELECT * FROM produtos WHERE ativo = 1").all();
  const pesoCategoria = { Frutas: 5, Legumes: 3, Verduras: 3, Sucos: 2, Temperos: 1 };

  let pedidos = 0;
  for (let d = 59; d >= 0; d--) {
    const dia = new Date(hoje.getTime() - d * 86400000);
    const fimDeSemana = [0, 6].includes(dia.getDay());
    const crescimento = 1 + (59 - d) / 60; // vendas crescendo ao longo do período
    const qtdPedidos = Math.round((fimDeSemana ? 4 : 2) * crescimento * (0.5 + aleatorio()));

    for (let k = 0; k < qtdPedidos; k++) {
      const horario = escolher(HORARIOS, [2, 4, 2, 3]);
      const faixa = interpretarHorario(horario);
      const data = new Date(dia);
      data.setHours(7 + Math.floor(aleatorio() * 14), Math.floor(aleatorio() * 60), 0, 0);

      const itens = new Map();
      const nItens = 1 + Math.floor(aleatorio() * 5);
      for (let n = 0; n < nItens; n++) {
        const p = escolher(produtos, produtos.map((x) => pesoCategoria[x.categoria] || 1));
        itens.set(p.id, { p, q: (itens.get(p.id)?.q || 0) + 1 + Math.floor(aleatorio() * 2) });
      }
      const total = Math.round([...itens.values()].reduce((s, { p, q }) => s + p.preco * q, 0) * 100) / 100;

      const pedidoId = db.prepare("INSERT INTO pedidos (usuario_id, data_pedido, valor_total, status) VALUES (?, ?, ?, 'entregue')")
        .run(escolher(clientes), data.toISOString(), total).lastInsertRowid;
      for (const { p, q } of itens.values()) {
        db.prepare("INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)")
          .run(pedidoId, p.id, q, p.preco, Math.round(p.preco * q * 100) / 100);
      }
      db.prepare("INSERT INTO agendamentos (pedido_id, data_entrega, horario_inicio, horario_fim, status) VALUES (?, ?, ?, ?, 'entregue')")
        .run(pedidoId, data.toISOString().slice(0, 10), faixa.inicio, faixa.fim);
      db.prepare("INSERT INTO pagamentos (pedido_id, forma_pagamento, valor, status, data_pagamento) VALUES (?, ?, ?, 'aprovado', ?)")
        .run(pedidoId, escolher(FORMAS_PAGAMENTO, [5, 3, 2]), total, data.toISOString());
      pedidos++;
    }
  }
  console.log(`Dados de exemplo criados: ${clientes.length} clientes e ${pedidos} pedidos.`);
})();