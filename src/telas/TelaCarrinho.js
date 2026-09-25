import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import cores from "../tema/cores";
import { useCarrinho } from "../contexto/ContextoCarrinho";

export default function TelaCarrinho({ navigation }) {
  const { itens, alterarQuantidade, removerDoCarrinho, total } = useCarrinho();

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={estilos.voltar}>←</Text>
        </TouchableOpacity>
        <Text style={estilos.titulo}>Meu Carrinho</Text>
        <View style={{ width: 24 }} />
      </View>

      {itens.length === 0 ? (
        <View style={estilos.vazioBox}>
          <Text style={estilos.vazioTexto}>Seu carrinho está vazio.</Text>
          <TouchableOpacity style={estilos.botaoSecundario} onPress={() => navigation.navigate("Principal")}>
            <Text style={estilos.botaoSecundarioTexto}>Ver catálogo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={itens}
            keyExtractor={(item) => item.produto.id}
            contentContainerStyle={estilos.lista}
            renderItem={({ item }) => (
              <View style={estilos.item}>
                <View style={estilos.itemImagem} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={estilos.itemNome}>{item.produto.nome}</Text>
                  <Text style={estilos.itemPreco}>R$ {item.produto.preco.toFixed(2)}</Text>
                </View>
                <View style={estilos.qtdBox}>
                  <TouchableOpacity
                    style={estilos.qtdBotao}
                    onPress={() => alterarQuantidade(item.produto.id, -1)}
                  >
                    <Text style={estilos.qtdBotaoTexto}>−</Text>
                  </TouchableOpacity>
                  <Text style={estilos.qtdTexto}>{item.quantidade}</Text>
                  <TouchableOpacity
                    style={estilos.qtdBotao}
                    onPress={() => alterarQuantidade(item.produto.id, 1)}
                  >
                    <Text style={estilos.qtdBotaoTexto}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removerDoCarrinho(item.produto.id)}>
                  <Text style={estilos.remover}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={estilos.resumo}>
            <View style={estilos.resumoLinha}>
              <Text style={estilos.resumoLabel}>Total</Text>
              <Text style={estilos.resumoValor}>R$ {total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={estilos.botaoPrimario}
              onPress={() => navigation.navigate("Pagamento")}
            >
              <Text style={estilos.botaoPrimarioTexto}>ESCOLHER ENTREGA E PAGAR</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  titulo: { fontSize: 18, fontWeight: "bold", color: cores.texto },
  vazioBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  vazioTexto: { color: cores.textoClaro, marginBottom: 16 },
  lista: { paddingHorizontal: 20, paddingBottom: 12 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  itemImagem: { width: 48, height: 48, borderRadius: 6, backgroundColor: "#E0E0E0" },
  itemNome: { fontSize: 13, fontWeight: "bold", color: cores.texto },
  itemPreco: { fontSize: 12, color: cores.primaria, marginTop: 2 },
  qtdBox: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  qtdBotao: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: "center",
    justifyContent: "center",
  },
  qtdBotaoTexto: { fontSize: 14, color: cores.texto },
  qtdTexto: { marginHorizontal: 8, fontSize: 13, color: cores.texto },
  remover: { fontSize: 16, marginLeft: 4 },
  resumo: {
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  resumoLabel: { fontSize: 15, color: cores.texto },
  resumoValor: { fontSize: 18, fontWeight: "bold", color: cores.primaria },
  botaoPrimario: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  botaoPrimarioTexto: { color: cores.branco, fontWeight: "bold", fontSize: 14 },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  botaoSecundarioTexto: { color: cores.primaria, fontWeight: "bold" },
});
