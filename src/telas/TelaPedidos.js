import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { api } from "../servicos/api";
import { useUsuario } from "../contexto/ContextoUsuario";
import TituloAba from "../componentes/TituloAba";
import SeloSituacao from "../componentes/SeloSituacao";
import EstadoVazio from "../componentes/EstadoVazio";
import Icone from "../componentes/Icone";
import { useAlturaAbas } from "../componentes/BarraAbas";
import { formatarPreco } from "../utils/validacoes";
import { emAndamento, progresso, formatarData, textoEntrega } from "../utils/pedidos";
import { ETAPAS_PEDIDO } from "../utils/regrasPedido";

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "andamento", rotulo: "Em andamento" },
  { id: "entregues", rotulo: "Entregues" },
];

export default function TelaPedidos({ navigation }) {
  const { usuario } = useUsuario();
  const alturaAbas = useAlturaAbas();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      setPedidos(await api.listarPedidos(usuario.id));
    } catch (e) {
      setErro(e.semConexao ? "Sem conexão com a loja. Puxe para baixo para tentar de novo." : e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    if (filtro === "andamento") return pedidos.filter((p) => emAndamento(p.status));
    if (filtro === "entregues") return pedidos.filter((p) => p.status === "entregue");
    return pedidos;
  }, [pedidos, filtro]);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <TituloAba titulo="Meus pedidos" />

      {pedidos.length > 0 && (
        <View style={s.filtros}>
          {FILTROS.map((f) => (
            <TouchableOpacity key={f.id} style={[s.chip, filtro === f.id && s.chipAtivo]} onPress={() => setFiltro(f.id)}>
              <Text style={[s.chipTexto, filtro === f.id && { color: cores.branco }]}>{f.rotulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {carregando && pedidos.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={cores.primaria} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={[s.lista, { paddingBottom: alturaAbas + 16 }]}
          refreshing={carregando}
          onRefresh={carregar}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={erro ? <Text style={s.erro}>{erro}</Text> : null}
          ListEmptyComponent={
            erro ? null : pedidos.length === 0 ? (
              <EstadoVazio
                icone="receipt-outline"
                titulo="Nenhum pedido por aqui"
                texto="Quando você finalizar uma compra, ela aparece aqui para você acompanhar a entrega."
                acao="Ir às compras"
                onAcao={() => navigation.navigate("Inicio")}
              />
            ) : (
              <Text style={s.semFiltro}>Nenhum pedido neste filtro.</Text>
            )
          }
          renderItem={({ item }) => <CartaoPedido pedido={item} onPress={() => navigation.navigate("Rastreamento", { pedidoId: item.id })} />}
        />
      )}
    </SafeAreaView>
  );
}

function CartaoPedido({ pedido, onPress }) {
  const qtd = pedido.itens.reduce((s, i) => s + i.quantidade, 0);
  const etapas = progresso(pedido.status);
  const nomes = pedido.itens.map((i) => i.nome).join(", ");

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardTopo}>
        <Text style={s.codigo}>{pedido.codigo}</Text>
        <SeloSituacao status={pedido.status} />
      </View>
      <Text style={s.data}>Feito em {formatarData(pedido.data_pedido)}, {qtd} {qtd === 1 ? "item" : "itens"}</Text>
      <Text style={s.itens} numberOfLines={1}>{nomes}</Text>

      {pedido.status !== "cancelado" && pedido.status !== "aguardando_pagamento" && (
        <View style={s.progresso}>
          {ETAPAS_PEDIDO.map((e, i) => (
            <View key={e.status} style={[s.segmento, i < etapas && s.segmentoFeito]} />
          ))}
        </View>
      )}

      <View style={s.rodape}>
        <View style={{ flex: 1 }}>
          <Text style={s.entrega} numberOfLines={1}>{textoEntrega(pedido)}</Text>
          <Text style={s.total}>{formatarPreco(pedido.valor_total)}</Text>
        </View>
        <View style={s.acompanhar}>
          <Text style={s.acompanharTexto}>{emAndamento(pedido.status) ? "Acompanhar" : "Detalhes"}</Text>
          <Icone nome="chevron-forward" tamanho={16} cor={cores.primaria} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  filtros: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: cores.superficie,
    borderWidth: 1, borderColor: cores.borda, justifyContent: "center",
  },
  chipAtivo: { backgroundColor: cores.primariaEscura, borderColor: cores.primariaEscura },
  chipTexto: { fontSize: 13, fontWeight: "700", color: cores.texto },
  lista: { paddingHorizontal: 16, flexGrow: 1 },
  erro: { backgroundColor: cores.destaque, color: "#6B5418", borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 13 },
  semFiltro: { textAlign: "center", color: cores.textoClaro, marginTop: 30 },
  card: { backgroundColor: cores.superficie, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: cores.borda },
  cardTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codigo: { fontSize: 16, fontWeight: "900", color: cores.texto },
  data: { fontSize: 13, color: cores.textoClaro, marginTop: 6 },
  itens: { fontSize: 13, color: cores.texto, marginTop: 2 },
  progresso: { flexDirection: "row", gap: 4, marginTop: 12 },
  segmento: { flex: 1, height: 5, borderRadius: 3, backgroundColor: cores.borda },
  segmentoFeito: { backgroundColor: cores.primaria },
  rodape: { flexDirection: "row", alignItems: "flex-end", marginTop: 12 },
  entrega: { fontSize: 12, color: cores.textoClaro },
  total: { fontSize: 18, fontWeight: "900", color: cores.primariaEscura, marginTop: 2 },
  acompanhar: { flexDirection: "row", alignItems: "center", gap: 2 },
  acompanharTexto: { fontSize: 14, fontWeight: "800", color: cores.primaria },
});
