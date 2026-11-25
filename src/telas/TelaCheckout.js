import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import cores from "../tema/cores";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import { useUsuario } from "../contexto/ContextoUsuario";
import { useProdutos } from "../contexto/ContextoProdutos";
import Cabecalho from "../componentes/Cabecalho";
import Etapas from "../componentes/Etapas";
import FormEndereco, { ENDERECO_VAZIO, errosEndereco } from "../componentes/FormEndereco";
import ResumoValores from "../componentes/ResumoValores";
import Botao from "../componentes/Botao";
import Icone from "../componentes/Icone";
import { api } from "../servicos/api";
import { enviarPedido, gerarIdLocal } from "../servicos/sincronizacao";
import { montarItensPedido } from "../utils/carrinho";
import { formatarPreco } from "../utils/validacoes";
import { TIPOS_ENTREGA, FRETE_GRATIS_A_PARTIR_DE } from "../utils/regrasPedido";
import { mascararCep } from "../utils/mascaras";

const NOMES_ETAPAS = ["Endereço", "Entrega", "Pagamento"];
const JANELAS = [
  { faixa: "08h–10h", inicio: 8 },
  { faixa: "10h–12h", inicio: 10 },
  { faixa: "14h–16h", inicio: 14 },
  { faixa: "16h–18h", inicio: 16 },
];
const FORMAS_PAGAMENTO = [
  { nome: "Mercado Pago", descricao: "Pix, cartão ou saldo. Pague agora pelo app.", icone: "card-outline", online: true },
  { nome: "Pix", descricao: "Pague na entrega pelo QR Code do entregador.", icone: "qr-code-outline" },
  { nome: "Cartão de crédito", descricao: "Na entrega, na maquininha.", icone: "card-outline" },
  { nome: "Cartão de débito", descricao: "Na entrega, na maquininha.", icone: "wallet-outline" },
];

// Data local no formato AAAA-MM-DD (hoje + n dias).
function dataLocal(diasAFrente) {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TelaCheckout({ navigation }) {
  const { itens, quantidadeTotal, resumo, cupom, limparCarrinho } = useCarrinho();
  const { usuario, salvarEndereco } = useUsuario();
  const { sincronizar, atualizarPendentes } = useProdutos();

  const [etapa, setEtapa] = useState(0);
  const [endereco, setEndereco] = useState({ ...ENDERECO_VAZIO, ...(usuario?.endereco || {}), cep: mascararCep(usuario?.endereco?.cep || "") });
  const [tentouEndereco, setTentouEndereco] = useState(false);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);

  const horaAgora = new Date().getHours();
  const janelasHoje = JANELAS.filter((j) => j.inicio > horaAgora);
  const [tipoEntrega, setTipoEntrega] = useState("padrao");
  const [dia, setDia] = useState(janelasHoje.length ? 0 : 1);
  const [janela, setJanela] = useState((janelasHoje[0] || JANELAS[0]).faixa);

  const [forma, setForma] = useState(FORMAS_PAGAMENTO[0].nome);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [pedidoAguardando, setPedidoAguardando] = useState(null);

  const valores = resumo(tipoEntrega);
  const erros = tentouEndereco ? errosEndereco(endereco) : {};
  const janelasDoDia = dia === 0 ? janelasHoje : JANELAS;

  function voltar() {
    if (pedidoAguardando) {
      navigation.goBack();
      return;
    }
    if (etapa > 0) setEtapa(etapa - 1);
    else navigation.goBack();
  }

  async function confirmarEndereco() {
    setTentouEndereco(true);
    if (Object.keys(errosEndereco(endereco)).length) return;
    setSalvandoEndereco(true);
    try {
      await salvarEndereco(endereco); // fica salvo para as próximas compras
    } catch (erro) {
      if (!erro.semConexao) {
        Alert.alert("Endereço", erro.message);
        setSalvandoEndereco(false);
        return;
      }
    }
    setSalvandoEndereco(false);
    setEtapa(1);
  }

  function escolherDia(novoDia) {
    setDia(novoDia);
    const lista = novoDia === 0 ? janelasHoje : JANELAS;
    if (!lista.some((j) => j.faixa === janela)) setJanela(lista[0]?.faixa);
  }

  function montarCorpo() {
    return {
      usuario_id: usuario.id,
      itens: montarItensPedido(itens),
      tipo_entrega: tipoEntrega,
      horario: tipoEntrega === "padrao" ? janela : undefined,
      data_entrega: tipoEntrega === "padrao" ? dataLocal(dia) : dataLocal(0),
      forma_pagamento: forma,
      cupom: valores.cupom || undefined,
      endereco: { ...endereco, cep: endereco.cep.replace(/\D/g, "") },
    };
  }

  function concluir(pedido) {
    sincronizar(); // atualiza o estoque no catálogo
    limparCarrinho();
    navigation.reset([{ nome: "Inicio" }, { nome: "PedidoConfirmado", params: { pedido } }]);
  }

  async function finalizar() {
    if (forma === "Mercado Pago") await pagarComMercadoPago();
    else await pagarNaEntrega();
  }

  // Pagamento na entrega: funciona até sem internet (o pedido entra na fila do celular).
  async function pagarNaEntrega() {
    setEnviando(true);
    try {
      const { pendente, pedido } = await enviarPedido(montarCorpo());
      if (pendente) {
        await atualizarPendentes();
        limparCarrinho();
        Alert.alert(
          "Pedido salvo no celular",
          "Você está sem conexão. O pedido será enviado automaticamente assim que a internet voltar."
        );
        navigation.reset([{ nome: "Inicio" }]);
      } else {
        concluir(pedido);
      }
    } catch (erro) {
      Alert.alert("Não foi possível concluir o pedido", erro.message);
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
      Alert.alert(
        "Mercado Pago",
        erro.semConexao ? "O pagamento pelo Mercado Pago precisa de internet. Verifique sua conexão." : erro.message
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
        concluir(pedido);
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
          "Se você já pagou, aguarde alguns segundos e toque em verificar de novo. Pix pode levar alguns instantes."
        );
      }
    } catch (erro) {
      Alert.alert("Não foi possível verificar o pagamento", erro.message);
    } finally {
      setVerificando(false);
    }
  }

  const resumoEntrega = tipoEntrega === "expressa"
    ? "Expressa, chega em até 2 horas"
    : `${dia === 0 ? "Hoje" : "Amanhã"}, das ${janela.replace("–", " às ")}`;

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho titulo="Finalizar compra" onVoltar={voltar} />
      <Etapas etapas={NOMES_ETAPAS} atual={etapa} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
          {etapa === 0 && (
            <View style={s.cartao}>
              <Text style={s.cartaoTitulo}>Endereço de entrega</Text>
              <FormEndereco endereco={endereco} onChange={setEndereco} erros={erros} />
              <Botao titulo="Salvar e continuar" onPress={confirmarEndereco} carregando={salvandoEndereco} />
            </View>
          )}

          {etapa === 1 && (
            <>
              <View style={s.cartao}>
                <Text style={s.cartaoTitulo}>Forma de entrega</Text>
                {Object.entries(TIPOS_ENTREGA).map(([id, tipo]) => {
                  const ativo = tipoEntrega === id;
                  const preco = resumo(id).frete;
                  return (
                    <TouchableOpacity key={id} style={[s.opcao, ativo && s.opcaoAtiva]} onPress={() => setTipoEntrega(id)}>
                      <View style={[s.radio, ativo && s.radioAtivo]}>{ativo && <View style={s.radioMiolo} />}</View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.opcaoTitulo}>{tipo.nome}</Text>
                        <Text style={s.opcaoDescricao}>{tipo.descricao}</Text>
                      </View>
                      <Text style={[s.opcaoPreco, preco === 0 && { color: cores.primaria }]}>
                        {preco === 0 ? "Grátis" : formatarPreco(preco)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {tipoEntrega === "padrao" && valores.frete > 0 && (
                  <Text style={s.dica}>Entrega padrão grátis a partir de {formatarPreco(FRETE_GRATIS_A_PARTIR_DE)} em produtos.</Text>
                )}
              </View>

              {tipoEntrega === "padrao" && (
                <View style={s.cartao}>
                  <Text style={s.cartaoTitulo}>Dia e horário</Text>
                  <View style={s.chips}>
                    {janelasHoje.length > 0 && <Chip rotulo="Hoje" ativo={dia === 0} onPress={() => escolherDia(0)} />}
                    <Chip rotulo="Amanhã" ativo={dia === 1} onPress={() => escolherDia(1)} />
                  </View>
                  <View style={[s.chips, { marginTop: 12 }]}>
                    {janelasDoDia.map((j) => (
                      <Chip key={j.faixa} rotulo={j.faixa} ativo={janela === j.faixa} onPress={() => setJanela(j.faixa)} />
                    ))}
                  </View>
                </View>
              )}

              <View style={s.botoesLinha}>
                <Botao titulo="Voltar" variante="secundario" onPress={() => setEtapa(0)} estilo={{ flex: 1 }} />
                <Botao titulo="Continuar" onPress={() => setEtapa(2)} estilo={{ flex: 1.4 }} />
              </View>
            </>
          )}

          {etapa === 2 && (
            <>
              {pedidoAguardando && (
                <View style={s.aguardando}>
                  <Text style={s.aguardandoTitulo}>Pedido {pedidoAguardando.codigo} aguardando pagamento</Text>
                  <Text style={s.aguardandoTexto}>Conclua o pagamento na página do Mercado Pago e depois toque em "Já paguei".</Text>
                  <View style={s.botoesLinha}>
                    <Botao titulo="Abrir Mercado Pago" variante="secundario" onPress={() => abrirCheckout(pedidoAguardando)} estilo={{ flex: 1 }} />
                    <Botao titulo="Já paguei" onPress={() => verificarPagamento(pedidoAguardando.id)} carregando={verificando} estilo={{ flex: 1 }} />
                  </View>
                </View>
              )}

              <View style={s.cartao}>
                <Text style={s.cartaoTitulo}>Forma de pagamento</Text>
                {FORMAS_PAGAMENTO.map((f) => {
                  const ativo = forma === f.nome;
                  return (
                    <TouchableOpacity
                      key={f.nome}
                      style={[s.opcao, ativo && s.opcaoAtiva]}
                      onPress={() => setForma(f.nome)}
                      disabled={!!pedidoAguardando}
                    >
                      <Icone nome={f.icone} tamanho={22} cor={ativo ? cores.primaria : cores.textoClaro} estilo={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.opcaoTitulo}>{f.nome}</Text>
                        <Text style={s.opcaoDescricao}>{f.descricao}</Text>
                      </View>
                      {f.online && (
                        <View style={s.seloOnline}><Text style={s.seloOnlineTexto}>Online</Text></View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.cartao}>
                <Text style={s.cartaoTitulo}>Resumo do pedido</Text>
                <LinhaInfo icone="location-outline" texto={`${endereco.rua}, ${endereco.numero}${endereco.complemento ? ` (${endereco.complemento})` : ""} - ${endereco.bairro}`} onEditar={() => setEtapa(0)} />
                <LinhaInfo icone="time-outline" texto={resumoEntrega} onEditar={() => setEtapa(1)} />
                <View style={s.divisor} />
                <ResumoValores resumo={valores} quantidade={quantidadeTotal} />
                {cupom && !valores.cupom ? <Text style={s.aviso}>O cupom {cupom} não vale para este pedido.</Text> : null}
              </View>

              {!pedidoAguardando && (
                <Botao
                  titulo={forma === "Mercado Pago" ? `Pagar ${formatarPreco(valores.total)} com Mercado Pago` : `Confirmar pedido de ${formatarPreco(valores.total)}`}
                  variante="escuro"
                  onPress={finalizar}
                  carregando={enviando}
                  desabilitado={itens.length === 0}
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({ rotulo, ativo, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, ativo && s.chipAtivo]} onPress={onPress}>
      <Text style={[s.chipTexto, ativo && { color: cores.branco }]}>{rotulo}</Text>
    </TouchableOpacity>
  );
}

function LinhaInfo({ icone, texto, onEditar }) {
  return (
    <View style={s.infoLinha}>
      <Icone nome={icone} tamanho={18} cor={cores.primaria} />
      <Text style={s.infoTexto}>{texto}</Text>
      <TouchableOpacity onPress={onEditar}><Text style={s.editar}>Alterar</Text></TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16, paddingBottom: 40 },
  cartao: { backgroundColor: cores.superficie, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: cores.borda, marginBottom: 14 },
  cartaoTitulo: { fontSize: 17, fontWeight: "800", color: cores.texto, marginBottom: 14 },
  opcao: {
    flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: cores.borda,
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  opcaoAtiva: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: cores.borda,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  radioAtivo: { borderColor: cores.primaria },
  radioMiolo: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.primaria },
  opcaoTitulo: { fontSize: 15, fontWeight: "800", color: cores.texto },
  opcaoDescricao: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
  opcaoPreco: { fontSize: 15, fontWeight: "800", color: cores.texto },
  dica: { fontSize: 12, color: cores.textoClaro },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 40, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: cores.borda,
    alignItems: "center", justifyContent: "center",
  },
  chipAtivo: { backgroundColor: cores.primariaEscura, borderColor: cores.primariaEscura },
  chipTexto: { fontSize: 14, fontWeight: "700", color: cores.texto },
  botoesLinha: { flexDirection: "row", gap: 12, marginTop: 4 },
  seloOnline: { backgroundColor: cores.secundaria, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  seloOnlineTexto: { color: cores.branco, fontSize: 11, fontWeight: "800" },
  infoLinha: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  infoTexto: { flex: 1, fontSize: 13, color: cores.texto, lineHeight: 18 },
  editar: { fontSize: 13, fontWeight: "800", color: cores.primaria },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: 8 },
  aviso: { fontSize: 12, color: cores.perigo, marginTop: 8 },
  aguardando: {
    backgroundColor: cores.destaque, borderWidth: 1, borderColor: "#F1DFAE", borderRadius: 16,
    padding: 14, marginBottom: 14,
  },
  aguardandoTitulo: { fontSize: 15, fontWeight: "800", color: cores.texto },
  aguardandoTexto: { fontSize: 13, color: "#6B5418", marginTop: 4, marginBottom: 12 },
});
