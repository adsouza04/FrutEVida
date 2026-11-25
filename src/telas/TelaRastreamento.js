import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";

import cores from "../tema/cores";
import { api } from "../servicos/api";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import { useProdutos } from "../contexto/ContextoProdutos";
import Cabecalho from "../componentes/Cabecalho";
import SeloSituacao from "../componentes/SeloSituacao";
import ImagemProduto from "../componentes/ImagemProduto";
import Botao from "../componentes/Botao";
import Icone from "../componentes/Icone";
import EstadoVazio from "../componentes/EstadoVazio";
import { formatarPreco } from "../utils/validacoes";
import { emAndamento, formatarDataHora, textoEntrega } from "../utils/pedidos";
import { ETAPAS_PEDIDO } from "../utils/regrasPedido";

const ATUALIZAR_A_CADA_MS = 15000;

export default function TelaRastreamento({ navigation, route }) {
  const pedidoId = route?.params?.pedidoId;
  const { adicionarAoCarrinho } = useCarrinho();
  const { produtos } = useProdutos();
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [verificando, setVerificando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setPedido(await api.obterPedido(pedidoId));
      setErro(null);
    } catch (e) {
      setErro(e.semConexao ? "Sem conexão com a loja." : e.message);
    } finally {
      setCarregando(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!pedido || !emAndamento(pedido.status)) return undefined;
    const timer = setInterval(carregar, ATUALIZAR_A_CADA_MS);
    return () => clearInterval(timer);
  }, [pedido, carregar]);

  async function verificarPagamento() {
    setVerificando(true);
    try {
      const atualizado = await api.verificarPagamento(pedido.id);
      setPedido(atualizado);
      if (atualizado.status === "aguardando_pagamento") {
        Alert.alert("Pagamento ainda não confirmado", "Se você já pagou, aguarde alguns segundos e tente de novo.");
      }
    } catch (e) {
      Alert.alert("Pagamento", e.message);
    } finally {
      setVerificando(false);
    }
  }

  function comprarNovamente() {
    let adicionados = 0;
    for (const item of pedido.itens) {
      const produto = produtos.find((p) => String(p.id) === String(item.produto_id));
      if (produto && produto.estoque > 0) {
        adicionarAoCarrinho(produto, Math.min(item.quantidade, produto.estoque));
        adicionados++;
      }
    }
    if (!adicionados) {
      Alert.alert("Comprar novamente", "Os produtos deste pedido estão indisponíveis no momento.");
      return;
    }
    navigation.navigate("Carrinho");
  }

  if (carregando) {
    return (
      <SafeAreaView style={s.container}>
        <Cabecalho titulo="Rastreamento" onVoltar={() => navigation.goBack()} />
        <ActivityIndicator style={{ marginTop: 40 }} color={cores.primaria} />
      </SafeAreaView>
    );
  }

  if (!pedido) {
    return (
      <SafeAreaView style={s.container}>
        <Cabecalho titulo="Rastreamento" onVoltar={() => navigation.goBack()} />
        <EstadoVazio icone="cloud-offline-outline" titulo="Não foi possível abrir o pedido" texto={erro} acao="Tentar de novo" onAcao={carregar} />
      </SafeAreaView>
    );
  }

  const eventos = Object.fromEntries(pedido.rastreamento.map((e) => [e.status, e]));
  const indiceAtual = ETAPAS_PEDIDO.findIndex((e) => e.status === pedido.status);
  const end = pedido.endereco_entrega;

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho titulo="Rastreamento" subtitulo={pedido.codigo} onVoltar={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={s.conteudo}
        refreshControl={<RefreshControl refreshing={false} onRefresh={carregar} tintColor={cores.primaria} />}
      >
        <View style={s.cartao}>
          <View style={s.topo}>
            <Text style={s.codigo}>{pedido.codigo}</Text>
            <SeloSituacao status={pedido.status} />
          </View>
          <Text style={s.entrega}>
            {pedido.status === "entregue"
              ? `Entregue em ${formatarDataHora(eventos.entregue?.data)}`
              : textoEntrega(pedido)}
          </Text>
          <Text style={s.total}>{formatarPreco(pedido.valor_total)}</Text>
        </View>

        {pedido.status === "aguardando_pagamento" && (
          <View style={[s.aviso, s.avisoAtencao]}>
            <Text style={s.avisoTitulo}>Aguardando o pagamento</Text>
            <Text style={s.avisoTexto}>O pedido começa a ser separado assim que o Mercado Pago confirmar o pagamento.</Text>
            <View style={s.botoesLinha}>
              {pedido.pagamento?.link_pagamento ? (
                <Botao
                  titulo="Pagar agora"
                  variante="secundario"
                  onPress={() => WebBrowser.openBrowserAsync(pedido.pagamento.link_pagamento).then(verificarPagamento)}
                  estilo={{ flex: 1 }}
                />
              ) : null}
              <Botao titulo="Já paguei" onPress={verificarPagamento} carregando={verificando} estilo={{ flex: 1 }} />
            </View>
          </View>
        )}

        {pedido.status === "cancelado" && (
          <View style={[s.aviso, s.avisoErro]}>
            <Text style={[s.avisoTitulo, { color: cores.perigo }]}>Pedido cancelado</Text>
            <Text style={s.avisoTexto}>O pagamento não foi aprovado. Nenhum valor foi cobrado e os itens voltaram ao estoque.</Text>
          </View>
        )}

        {pedido.status !== "cancelado" && (
          <View style={s.cartao}>
            <Text style={s.cartaoTitulo}>Acompanhe a entrega</Text>
            {ETAPAS_PEDIDO.map((etapa, i) => {
              const feita = i <= indiceAtual;
              const atual = i === indiceAtual;
              const ultima = i === ETAPAS_PEDIDO.length - 1;
              return (
                <View key={etapa.status} style={s.etapa}>
                  <View style={s.trilhaColuna}>
                    <View style={[s.bolinha, feita && s.bolinhaFeita, atual && s.bolinhaAtual]}>
                      {feita && <Icone nome="checkmark" tamanho={13} cor={cores.branco} />}
                    </View>
                    {!ultima && <View style={[s.trilha, i < indiceAtual && s.trilhaFeita]} />}
                  </View>
                  <View style={[s.etapaTexto, !ultima && { paddingBottom: 20 }]}>
                    <Text style={[s.etapaTitulo, !feita && { color: cores.textoClaro }]}>{etapa.titulo}</Text>
                    <Text style={s.etapaDescricao}>
                      {feita ? `${formatarDataHora(eventos[etapa.status]?.data)}. ${etapa.descricao}` : "Aguardando"}
                    </Text>
                  </View>
                </View>
              );
            })}
            {emAndamento(pedido.status) && pedido.status !== "aguardando_pagamento" && (
              <Text style={s.dica}>Esta tela se atualiza sozinha. Puxe para baixo para atualizar agora.</Text>
            )}
          </View>
        )}

        <View style={s.cartao}>
          <Text style={s.cartaoTitulo}>Itens do pedido</Text>
          {pedido.itens.map((item) => (
            <View key={item.produto_id} style={s.item}>
              <ImagemProduto produto={item} estilo={s.itemImagem} tamanhoEmoji={22} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.itemNome} numberOfLines={1}>{item.nome}</Text>
                <Text style={s.itemQtd}>{item.quantidade} x {formatarPreco(item.preco_unitario)}</Text>
              </View>
              <Text style={s.itemValor}>{formatarPreco(item.subtotal)}</Text>
            </View>
          ))}
          <View style={s.divisor} />
          <Linha rotulo="Subtotal" valor={formatarPreco(pedido.subtotal)} />
          <Linha rotulo="Frete" valor={pedido.frete ? formatarPreco(pedido.frete) : "Grátis"} />
          {pedido.desconto > 0 && <Linha rotulo={`Desconto (${pedido.cupom})`} valor={`- ${formatarPreco(pedido.desconto)}`} />}
          <Linha rotulo="Total" valor={formatarPreco(pedido.valor_total)} forte />
        </View>

        <View style={s.cartao}>
          <Text style={s.cartaoTitulo}>Entrega e pagamento</Text>
          {end && (
            <Info icone="location-outline" texto={`${end.rua}, ${end.numero}${end.complemento ? ` (${end.complemento})` : ""}\n${end.bairro}, ${end.cidade}${end.uf ? ` - ${end.uf}` : ""}`} />
          )}
          <Info icone="time-outline" texto={textoEntrega(pedido)} />
          <Info icone="card-outline" texto={`${pedido.pagamento?.forma_pagamento}${pedido.pagamento?.status === "aprovado" ? ", pagamento aprovado" : ""}`} />
        </View>

        {pedido.status === "entregue" && (
          <Botao titulo="Comprar novamente" icone="refresh" variante="escuro" onPress={comprarNovamente} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Linha({ rotulo, valor, forte }) {
  return (
    <View style={s.linha}>
      <Text style={s.linhaRotulo}>{rotulo}</Text>
      <Text style={[s.linhaValor, forte && { fontSize: 17, fontWeight: "900", color: cores.primariaEscura }]}>{valor}</Text>
    </View>
  );
}

function Info({ icone, texto }) {
  return (
    <View style={s.info}>
      <Icone nome={icone} tamanho={18} cor={cores.primaria} />
      <Text style={s.infoTexto}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16, paddingBottom: 40 },
  cartao: { backgroundColor: cores.superficie, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: cores.borda, marginBottom: 14 },
  cartaoTitulo: { fontSize: 16, fontWeight: "800", color: cores.texto, marginBottom: 14 },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codigo: { fontSize: 18, fontWeight: "900", color: cores.texto },
  entrega: { fontSize: 13, color: cores.textoClaro, marginTop: 6 },
  total: { fontSize: 20, fontWeight: "900", color: cores.primariaEscura, marginTop: 6 },
  aviso: { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  avisoAtencao: { backgroundColor: cores.destaque, borderColor: "#F1DFAE" },
  avisoErro: { backgroundColor: "#F9E3E3", borderColor: "#F0C4C4" },
  avisoTitulo: { fontSize: 15, fontWeight: "800", color: cores.texto },
  avisoTexto: { fontSize: 13, color: cores.texto, marginTop: 4, lineHeight: 18 },
  botoesLinha: { flexDirection: "row", gap: 10, marginTop: 12 },
  etapa: { flexDirection: "row" },
  trilhaColuna: { alignItems: "center", width: 26 },
  bolinha: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: cores.borda,
    backgroundColor: cores.superficie, alignItems: "center", justifyContent: "center",
  },
  bolinhaFeita: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  bolinhaAtual: { transform: [{ scale: 1.15 }] },
  trilha: { flex: 1, width: 2, backgroundColor: cores.borda, marginVertical: 2 },
  trilhaFeita: { backgroundColor: cores.primaria },
  etapaTexto: { flex: 1, marginLeft: 12 },
  etapaTitulo: { fontSize: 15, fontWeight: "800", color: cores.texto },
  etapaDescricao: { fontSize: 12, color: cores.textoClaro, marginTop: 2, lineHeight: 17 },
  dica: { fontSize: 12, color: cores.textoClaro, marginTop: 6 },
  item: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  itemImagem: { width: 44, height: 44, borderRadius: 10 },
  itemNome: { fontSize: 14, fontWeight: "700", color: cores.texto },
  itemQtd: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
  itemValor: { fontSize: 14, fontWeight: "700", color: cores.texto },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: 8 },
  linha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  linhaRotulo: { fontSize: 14, color: cores.textoClaro },
  linhaValor: { fontSize: 14, color: cores.texto, fontWeight: "600" },
  info: { flexDirection: "row", gap: 10, marginBottom: 10 },
  infoTexto: { flex: 1, fontSize: 14, color: cores.texto, lineHeight: 20 },
});
