import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import cores from "../tema/cores";
import { api } from "../servicos/api";
import { useUsuario } from "../contexto/ContextoUsuario";
import Cabecalho from "../componentes/Cabecalho";
import { formatarPreco } from "../utils/validacoes";

// Rótulo e cor de cada situação que o pedido pode ter no servidor.
const SITUACAO = {
  confirmado: { rotulo: "Confirmado", fundo: cores.primariaClara, texto: cores.primariaEscura },
  aguardando_pagamento: { rotulo: "Aguardando pagamento", fundo: cores.destaque, texto: "#6B5418" },
  cancelado: { rotulo: "Cancelado", fundo: "#F9E3E3", texto: cores.perigo },
};

function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function TelaPedidos({ navigation }) {
  const { usuario } = useUsuario();
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

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

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho titulo="Meus pedidos" onVoltar={() => navigation.goBack()} />

      {carregando && pedidos.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={cores.primaria} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={s.lista}
          refreshing={carregando}
          onRefresh={carregar}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={erro ? <Text style={s.erro}>{erro}</Text> : null}
          ListEmptyComponent={
            !erro ? (
              <View style={s.vazioBox}>
                <Text style={s.vazioTitulo}>Você ainda não fez pedidos</Text>
                <Text style={s.vazioTexto}>Quando finalizar uma compra, ela aparece aqui com o horário de entrega.</Text>
                <TouchableOpacity style={s.botao} onPress={() => navigation.navigate("Principal")}>
                  <Text style={s.botaoTexto}>Ir às compras</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const situacao = SITUACAO[item.status] || { rotulo: item.status, fundo: cores.borda, texto: cores.texto };
            const entrega = item.agendamento;
            return (
              <View style={s.card}>
                <View style={s.cardTopo}>
                  <Text style={s.numero}>Pedido nº {item.id}</Text>
                  <View style={[s.situacao, { backgroundColor: situacao.fundo }]}>
                    <Text style={[s.situacaoTexto, { color: situacao.texto }]}>{situacao.rotulo}</Text>
                  </View>
                </View>

                <Text style={s.data}>Feito em {formatarData(item.data_pedido)}</Text>

                <View style={s.itens}>
                  {item.itens.map((i) => (
                    <View key={i.produto_id} style={s.itemLinha}>
                      <Text style={s.itemNome} numberOfLines={1}>{i.quantidade}× {i.nome}</Text>
                      <Text style={s.itemValor}>{formatarPreco(i.subtotal)}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.rodape}>
                  <View style={{ flex: 1 }}>
                    {entrega ? (
                      <Text style={s.entrega}>
                        Entrega {formatarData(entrega.data_entrega)}, {entrega.horario_inicio.slice(0, 2)}h às {entrega.horario_fim.slice(0, 2)}h
                      </Text>
                    ) : null}
                    <Text style={s.pagamento}>{item.pagamento?.forma_pagamento}</Text>
                  </View>
                  <Text style={s.total}>{formatarPreco(item.valor_total)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  lista: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  erro: {
    backgroundColor: cores.destaque, color: "#6B5418", borderRadius: 12, padding: 12,
    marginBottom: 12, fontSize: 13,
  },
  card: { backgroundColor: cores.superficie, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cores.borda },
  cardTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  numero: { fontSize: 16, fontWeight: "800", color: cores.texto },
  situacao: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  situacaoTexto: { fontSize: 11, fontWeight: "800" },
  data: { fontSize: 12, color: cores.textoClaro, marginTop: 4 },
  itens: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: cores.borda, gap: 6 },
  itemLinha: { flexDirection: "row", justifyContent: "space-between" },
  itemNome: { flex: 1, fontSize: 13, color: cores.texto, marginRight: 12 },
  itemValor: { fontSize: 13, color: cores.textoClaro },
  rodape: {
    flexDirection: "row", alignItems: "flex-end", marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: cores.borda,
  },
  entrega: { fontSize: 12, color: cores.texto, fontWeight: "600" },
  pagamento: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
  total: { fontSize: 17, fontWeight: "900", color: cores.primariaEscura },
  vazioBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingTop: 60 },
  vazioTitulo: { fontSize: 17, fontWeight: "800", color: cores.texto },
  vazioTexto: { fontSize: 13, color: cores.textoClaro, textAlign: "center", marginTop: 6, lineHeight: 19 },
  botao: { backgroundColor: cores.primaria, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 20 },
  botaoTexto: { color: cores.branco, fontWeight: "800" },
});
