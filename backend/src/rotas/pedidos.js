const express = require("express");
const { calcularPedido, interpretarHorario, FORMAS_PAGAMENTO } = require("../regras");
const mp = require("../mercadopago");

function buscarPedidoCompleto(db, id) {
  const pedido = db.prepare("SELECT * FROM pedidos WHERE id = ?").get(id);
  if (!pedido) return null;
  pedido.itens = db.prepare(`
    SELECT i.produto_id, p.nome, p.categoria, i.quantidade, i.preco_unitario, i.subtotal
    FROM itens_pedido i JOIN produtos p ON p.id = i.produto_id WHERE i.pedido_id = ?
  `).all(id);
  pedido.agendamento = db.prepare("SELECT data_entrega, horario_inicio, horario_fim, status FROM agendamentos WHERE pedido_id = ?").get(id) || null;
  pedido.pagamento = db.prepare(`
    SELECT forma_pagamento, valor, status, data_pagamento, link_pagamento, mp_pagamento_id
    FROM pagamentos WHERE pedido_id = ?
  `).get(id) || null;
  pedido.origem_offline = Boolean(pedido.origem_offline);
  return pedido;
}

// Cancela o pedido e devolve os itens ao estoque (usado quando o pagamento é recusado).
function cancelarPedido(db, pedidoId, statusPagamento = "recusado") {
  db.transaction(() => {
    const pedido = db.prepare("SELECT status FROM pedidos WHERE id = ?").get(pedidoId);
    if (!pedido || pedido.status === "cancelado") return;
    const agora = new Date().toISOString();
    const itens = db.prepare("SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = ?").all(pedidoId);
    const devolver = db.prepare("UPDATE produtos SET estoque = estoque + ?, atualizado_em = ? WHERE id = ?");
    for (const i of itens) devolver.run(i.quantidade, agora, i.produto_id);
    db.prepare("UPDATE pedidos SET status = 'cancelado' WHERE id = ?").run(pedidoId);
    db.prepare("UPDATE pagamentos SET status = ? WHERE pedido_id = ?").run(statusPagamento, pedidoId);
  })();
}

module.exports = function rotasPedidos(db) {
  const r = express.Router();

  r.post("/", async (req, res) => {
    const { usuario_id, itens, horario, forma_pagamento, data_entrega, id_local, origem_offline } = req.body || {};

    // Idempotência: se o app reenviar um pedido que já chegou (ex.: caiu a conexão
    // antes da resposta), devolvemos o mesmo pedido em vez de duplicar.
    if (id_local) {
      const existente = db.prepare("SELECT id FROM pedidos WHERE id_local = ?").get(String(id_local));
      if (existente) return res.status(200).json(buscarPedidoCompleto(db, existente.id));
    }

    if (!db.prepare("SELECT id FROM usuarios WHERE id = ?").get(usuario_id)) {
      return res.status(400).json({ erro: "Usuário inválido. Faça login novamente." });
    }
    const faixa = interpretarHorario(horario);
    if (!faixa) return res.status(400).json({ erro: "Horário de entrega inválido." });
    if (!FORMAS_PAGAMENTO.includes(forma_pagamento)) {
      return res.status(400).json({ erro: "Forma de pagamento inválida." });
    }

    const viaMercadoPago = forma_pagamento === mp.FORMA_MERCADO_PAGO;
    if (viaMercadoPago && !mp.configurado()) {
      return res.status(503).json({
        erro: "Pagamento pelo Mercado Pago indisponível: configure o MP_ACCESS_TOKEN no arquivo backend/.env.",
      });
    }

    const ids = (Array.isArray(itens) ? itens : []).map((i) => i.produto_id);
    const produtos = ids.length
      ? db.prepare(`SELECT * FROM produtos WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids)
      : [];
    const porId = Object.fromEntries(produtos.map((p) => [p.id, p]));
    const calculo = calcularPedido(itens, porId);
    if (!calculo.valido) return res.status(400).json({ erro: calculo.erros.join(" "), erros: calculo.erros });

    const agora = new Date().toISOString();
    const dataEntrega = data_entrega || agora.slice(0, 10);

    const pedidoId = db.transaction(() => {
      const { lastInsertRowid } = db.prepare(`
        INSERT INTO pedidos (usuario_id, data_pedido, valor_total, status, origem_offline, id_local)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(usuario_id, agora, calculo.total, viaMercadoPago ? "aguardando_pagamento" : "confirmado",
        origem_offline ? 1 : 0, id_local ? String(id_local) : null);

      const inserirItem = db.prepare(`
        INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)
      `);
      // O estoque é reservado já na criação; se o pagamento for recusado, ele volta.
      const baixarEstoque = db.prepare("UPDATE produtos SET estoque = estoque - ?, atualizado_em = ? WHERE id = ?");
      for (const i of calculo.itens) {
        inserirItem.run(lastInsertRowid, i.produto_id, i.quantidade, i.preco_unitario, i.subtotal);
        baixarEstoque.run(i.quantidade, agora, i.produto_id);
      }
      db.prepare(`INSERT INTO agendamentos (pedido_id, data_entrega, horario_inicio, horario_fim, status) VALUES (?, ?, ?, ?, 'agendado')`)
        .run(lastInsertRowid, dataEntrega, faixa.inicio, faixa.fim);
      db.prepare(`INSERT INTO pagamentos (pedido_id, forma_pagamento, valor, status, data_pagamento) VALUES (?, ?, ?, ?, ?)`)
        .run(lastInsertRowid, forma_pagamento, calculo.total,
          viaMercadoPago ? "pendente" : "aprovado", viaMercadoPago ? null : agora);
      return lastInsertRowid;
    })();

    if (viaMercadoPago) {
      const referencia = mp.gerarReferencia(pedidoId);
      const itensComNome = calculo.itens.map((i) => ({ ...i, nome: porId[i.produto_id].nome }));
      try {
        const preferencia = await mp.criarPreferencia(mp.montarPreferencia({ referencia, itens: itensComNome }));
        db.prepare(`
          UPDATE pagamentos SET mp_referencia = ?, mp_preferencia_id = ?, link_pagamento = ? WHERE pedido_id = ?
        `).run(referencia, preferencia.id, preferencia.init_point, pedidoId);
      } catch (erro) {
        cancelarPedido(db, pedidoId, "erro");
        return res.status(502).json({ erro: `Não foi possível iniciar o pagamento no Mercado Pago: ${erro.message}` });
      }
    }

    res.status(201).json(buscarPedidoCompleto(db, pedidoId));
  });

  // O app chama esta rota quando o cliente volta da página do Mercado Pago.
  // O servidor pergunta ao Mercado Pago como está o pagamento e atualiza o pedido.
  r.post("/:id/verificar-pagamento", async (req, res) => {
    const pedido = buscarPedidoCompleto(db, req.params.id);
    if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado." });
    if (pedido.pagamento?.forma_pagamento !== mp.FORMA_MERCADO_PAGO) return res.json(pedido);
    if (!mp.configurado()) return res.status(503).json({ erro: "Mercado Pago não configurado no servidor." });

    const { mp_referencia } = db.prepare("SELECT mp_referencia FROM pagamentos WHERE pedido_id = ?").get(pedido.id);
    let pagamento;
    try {
      pagamento = await mp.buscarUltimoPagamento(mp_referencia);
    } catch (erro) {
      return res.status(502).json({ erro: `Não foi possível consultar o Mercado Pago: ${erro.message}` });
    }
    if (!pagamento) return res.json(pedido); // o cliente ainda não pagou

    const situacao = mp.traduzirStatus(pagamento.status);
    if (situacao === "aprovado" && pedido.status === "aguardando_pagamento") {
      db.transaction(() => {
        db.prepare("UPDATE pagamentos SET status = 'aprovado', mp_pagamento_id = ?, data_pagamento = ? WHERE pedido_id = ?")
          .run(String(pagamento.id), pagamento.date_approved || new Date().toISOString(), pedido.id);
        db.prepare("UPDATE pedidos SET status = 'confirmado' WHERE id = ?").run(pedido.id);
      })();
    } else if (situacao === "recusado" || situacao === "estornado") {
      db.prepare("UPDATE pagamentos SET mp_pagamento_id = ? WHERE pedido_id = ?").run(String(pagamento.id), pedido.id);
      cancelarPedido(db, pedido.id, situacao);
    } else {
      db.prepare("UPDATE pagamentos SET mp_pagamento_id = ? WHERE pedido_id = ?").run(String(pagamento.id), pedido.id);
    }
    res.json(buscarPedidoCompleto(db, pedido.id));
  });

  r.get("/", (req, res) => {
    const { usuario_id } = req.query;
    const linhas = usuario_id
      ? db.prepare("SELECT id FROM pedidos WHERE usuario_id = ? ORDER BY id DESC").all(usuario_id)
      : db.prepare("SELECT id FROM pedidos ORDER BY id DESC").all();
    res.json(linhas.map((l) => buscarPedidoCompleto(db, l.id)));
  });

  r.get("/:id", (req, res) => {
    const pedido = buscarPedidoCompleto(db, req.params.id);
    if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado." });
    res.json(pedido);
  });

  return r;
};

module.exports.buscarPedidoCompleto = buscarPedidoCompleto;