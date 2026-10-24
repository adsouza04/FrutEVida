import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import cores from "../tema/cores";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import { useUsuario } from "../contexto/ContextoUsuario";
import { useProdutos } from "../contexto/ContextoProdutos";
import { api } from "../servicos/api";
import { enviarPedido, gerarIdLocal } from "../servicos/sincronizacao";
import { montarItensPedido } from "../utils/carrinho";
import { formatarPreco } from "../utils/validacoes";

const HORARIOS = ["08h–10h", "10h–12h", "14h–16h", "16h–18h"];
const FORMAS_PAGAMENTO = [
  { nome: "Mercado Pago", descricao: "Pix, cartão ou boleto · pague agora", online: true },
  { nome: "Pix", descricao: "Na entrega" },
  { nome: "Cartão de crédito", descricao: "Na entrega (maquininha)" },
  { nome: "Cartão de débito", descricao: "Na entrega (maquininha)" },
];

export default function TelaPagamento({ navigation }) {
  const { itens, total, limparCarrinho } = useCarrinho();
  const { usuario } = useUsuario();
  const { sincronizar, atualizarPendentes } = useProdutos();
  const [horarioSelecionado, setHorarioSelecionado] = useState(HORARIOS[0]);
  const [formaSelecionada, setFormaSelecionada] = useState(FORMAS_PAGAMENTO[0].nome);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  // Pedido criado no servidor que ainda espera o pagamento no Mercado Pago.
  const [pedidoAguardando, setPedidoAguardando] = useState(null);

  function montarCorpo() {
    return {
      usuario_id: usuario.id,
      itens: montarItensPedido(itens),
      horario: horarioSelecionado,
      forma_pagamento: formaSelecionada,
    };
  }

  function finalizar(pedido) {
    Alert.alert(
      "Pedido confirmado!",
      `Pedido nº ${pedido.id}\nHorário: ${horarioSelecionado}\nPagamento: ${pedido.pagamento.forma_pagamento}\nTotal: ${formatarPreco(pedido.valor_total)}`
    );
    sincronizar(); // atualiza o estoque no catálogo
    limparCarrinho();
    setPedidoAguardando(null);
    navigation.navigate("Principal");
  }

  async function handlePagar() {
    if (!usuario) {
      alert("Faça login para finalizar o pedido.");
      return;
    }
    if (formaSelecionada === "Mercado Pago") {
      await pagarComMercadoPago();
    } else {
      await pagarNaEntrega();
    }
  }

  // Pagamento na entrega: funciona até sem internet (o pedido entra na fila).
  async function pagarNaEntrega() {
    setEnviando(true);
    try {
      const { pendente, pedido } = await enviarPedido(montarCorpo());
      if (pendente) {
        await atualizarPendentes();
        alert("Você está sem conexão. O pedido foi salvo no celular e será enviado automaticamente na próxima sincronização.");
        limparCarrinho();
        navigation.navigate("Principal");
      } else {
        finalizar(pedido);
      }
    } catch (erro) {
      alert("Não foi possível concluir o pedido: " + erro.message);
    } finally {
      setEnviando(false);
    }
  }

  // Pagamento online: o servidor cria o pedido e o link do Mercado Pago.
  async function pagarComMercadoPago() {
    setEnviando(true);
    try {
      const pedido = await api.criarPedido({ ...montarCorpo(), id_local: gerarIdLocal() });
      setPedidoAguardando(pedido);
      await abrirCheckout(pedido);
    } catch (erro) {
      alert(
        erro.semConexao
          ? "O pagamento pelo Mercado Pago precisa de internet. Verifique sua conexão."
          : erro.message
      );
    } finally {
      setEnviando(false);
    }
  }

  async function abrirCheckout(pedido) {
    // Abre a página oficial do Mercado Pago. No iPhone, a função espera o cliente fechar a página.
    await WebBrowser.openBrowserAsync(pedido.pagamento.link_pagamento);
    await verificarPagamento(pedido.id, { silencioso: true });
  }

  async function verificarPagamento(pedidoId, { silencioso = false } = {}) {
    setVerificando(true);
    try {
      const pedido = await api.verificarPagamento(pedidoId);
      if (pedido.status === "confirmado") {
        finalizar(pedido);
      } else if (pedido.status === "cancelado") {
        setPedidoAguardando(null);
        sincronizar();
        Alert.alert(
          "Pagamento recusado",
          "O Mercado Pago não aprovou o pagamento e o pedido foi cancelado. Seus itens continuam no carrinho: tente de novo ou escolha outra forma de pagamento."
        );
      } else if (!silencioso) {
        Alert.alert(
          "Pagamento ainda não confirmado",
          "Se você já pagou, aguarde alguns segundos e toque em verificar de novo. Pix e boleto podem demorar um pouco."
        );
      }
    } catch (erro) {
      alert("Não foi possível verificar o pagamento: " + erro.message);
    } finally {
      setVerificando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={estilos.voltar}>←</Text>
        </TouchableOpacity>
        <Text style={estilos.titulo}>Entrega e Pagamento</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo}>
        {pedidoAguardando && (
          <View style={estilos.aguardandoBox}>
            <Text style={estilos.aguardandoTitulo}>
              Pedido nº {pedidoAguardando.id} aguardando pagamento
            </Text>
            <Text style={estilos.aguardandoTexto}>
              Conclua o pagamento na página do Mercado Pago e depois toque em "Já paguei".
            </Text>
            <View style={estilos.aguardandoBotoes}>
              <TouchableOpacity
                style={estilos.botaoSecundario}
                onPress={() => abrirCheckout(pedidoAguardando)}
              >
                <Text style={estilos.botaoSecundarioTexto}>Abrir Mercado Pago</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botaoVerificar}
                onPress={() => verificarPagamento(pedidoAguardando.id)}
                disabled={verificando}
              >
                {verificando ? (
                  <ActivityIndicator color={cores.branco} />
                ) : (
                  <Text style={estilos.botaoVerificarTexto}>Já paguei</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={estilos.secaoTitulo}>Horário de entrega</Text>
        <View style={estilos.opcoesLinha}>
          {HORARIOS.map((horario) => {
            const ativo = horario === horarioSelecionado;
            return (
              <TouchableOpacity
                key={horario}
                style={[estilos.opcao, ativo && estilos.opcaoAtiva]}
                onPress={() => setHorarioSelecionado(horario)}
                disabled={!!pedidoAguardando}
              >
                <Text style={[estilos.opcaoTexto, ativo && estilos.opcaoTextoAtivo]}>
                  {horario}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={estilos.secaoTitulo}>Forma de pagamento</Text>
        <View style={{ gap: 10 }}>
          {FORMAS_PAGAMENTO.map((forma) => {
            const ativo = forma.nome === formaSelecionada;
            return (
              <TouchableOpacity
                key={forma.nome}
                style={[estilos.formaPagamento, ativo && estilos.formaPagamentoAtiva]}
                onPress={() => setFormaSelecionada(forma.nome)}
                disabled={!!pedidoAguardando}
              >
                <View style={[estilos.radio, ativo && estilos.radioAtivo]} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.formaPagamentoTexto}>{forma.nome}</Text>
                  <Text style={estilos.formaPagamentoDescricao}>{forma.descricao}</Text>
                </View>
                {forma.online && <Text style={estilos.seloOnline}>ONLINE</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={estilos.resumoBox}>
          <Text style={estilos.secaoTitulo}>Resumo do pedido</Text>
          <View style={estilos.resumoLinha}>
            <Text style={estilos.resumoLabel}>Total dos produtos</Text>
            <Text style={estilos.resumoValor}>{formatarPreco(total)}</Text>
          </View>
          <View style={estilos.resumoLinha}>
            <Text style={estilos.resumoLabel}>Taxa de entrega</Text>
            <Text style={estilos.resumoValor}>R$ 0,00</Text>
          </View>
          <View style={[estilos.resumoLinha, { marginTop: 6 }]}>
            <Text style={estilos.resumoLabelTotal}>Total a pagar</Text>
            <Text style={estilos.resumoValorTotal}>{formatarPreco(total)}</Text>
          </View>
        </View>

        {!pedidoAguardando && (
          <TouchableOpacity
            style={[estilos.botaoPrimario, enviando && { opacity: 0.7 }]}
            onPress={handlePagar}
            disabled={enviando || itens.length === 0}
          >
            {enviando ? (
              <ActivityIndicator color={cores.branco} />
            ) : (
              <Text style={estilos.botaoPrimarioTexto}>
                {formaSelecionada === "Mercado Pago" ? "PAGAR COM MERCADO PAGO" : "CONFIRMAR PEDIDO"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  voltar: { fontSize: 20, color: cores.texto },
  titulo: { fontSize: 16, fontWeight: "bold", color: cores.texto },
  conteudo: { paddingHorizontal: 20, paddingBottom: 40 },
  secaoTitulo: { fontSize: 14, fontWeight: "bold", color: cores.texto, marginTop: 16, marginBottom: 10 },
  opcoesLinha: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  opcao: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  opcaoAtiva: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  opcaoTexto: { color: cores.texto, fontSize: 13 },
  opcaoTextoAtivo: { color: cores.branco, fontWeight: "bold" },
  formaPagamento: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  formaPagamentoAtiva: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  formaPagamentoTexto: { fontSize: 13, color: cores.texto, fontWeight: "600" },
  formaPagamentoDescricao: { fontSize: 11, color: cores.textoClaro, marginTop: 2 },
  seloOnline: {
    fontSize: 9,
    fontWeight: "900",
    color: cores.branco,
    backgroundColor: cores.secundaria,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: cores.borda,
    marginRight: 10,
  },
  radioAtivo: { borderColor: cores.primaria, backgroundColor: cores.primaria },
  resumoBox: { marginTop: 8 },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  resumoLabel: { color: cores.textoClaro, fontSize: 13 },
  resumoValor: { color: cores.texto, fontSize: 13 },
  resumoLabelTotal: { color: cores.texto, fontSize: 15, fontWeight: "bold" },
  resumoValorTotal: { color: cores.primaria, fontSize: 17, fontWeight: "bold" },
  botaoPrimario: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
  },
  botaoPrimarioTexto: { color: cores.branco, fontWeight: "bold", fontSize: 14 },
  aguardandoBox: {
    backgroundColor: cores.primariaClara,
    borderWidth: 1,
    borderColor: cores.primaria,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  aguardandoTitulo: { fontSize: 14, fontWeight: "bold", color: cores.texto },
  aguardandoTexto: { fontSize: 12, color: cores.textoClaro, marginTop: 4 },
  aguardandoBotoes: { flexDirection: "row", gap: 10, marginTop: 12 },
  botaoSecundario: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  botaoSecundarioTexto: { color: cores.primaria, fontWeight: "bold", fontSize: 13 },
  botaoVerificar: {
    flex: 1,
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  botaoVerificarTexto: { color: cores.branco, fontWeight: "bold", fontSize: 13 },
});