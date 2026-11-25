import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import cores from "../tema/cores";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import Cabecalho from "../componentes/Cabecalho";
import ImagemProduto from "../componentes/ImagemProduto";
import { formatarPreco } from "../utils/validacoes";

export default function TelaCarrinho({ navigation }) {
  const { itens, alterarQuantidade, removerDoCarrinho, limparCarrinho, total, quantidadeTotal } = useCarrinho();

  function confirmarLimpar() {
    Alert.alert("Esvaziar carrinho", "Remover todos os itens do carrinho?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Esvaziar", style: "destructive", onPress: limparCarrinho },
    ]);
  }

  function aumentar(item) {
    if (item.produto.estoque !== undefined && item.quantidade >= item.produto.estoque) {
      Alert.alert("Estoque esgotado", `Temos só ${item.produto.estoque} unidade(s) de ${item.produto.nome}.`);
      return;
    }
    alterarQuantidade(item.produto.id, 1);
  }

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho
        titulo="Meu carrinho"
        subtitulo={itens.length ? `${quantidadeTotal} ${quantidadeTotal === 1 ? "item" : "itens"}` : null}
        onVoltar={() => navigation.goBack()}
        direita={
          itens.length ? (
            <TouchableOpacity onPress={confirmarLimpar}>
              <Text style={s.limpar}>Limpar</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {itens.length === 0 ? (
        <View style={s.vazioBox}>
          <Text style={s.vazioEmoji}>🧺</Text>
          <Text style={s.vazioTitulo}>Seu carrinho está vazio</Text>
          <Text style={s.vazioTexto}>Escolha frutas, verduras e sucos no catálogo para montar seu pedido.</Text>
          <TouchableOpacity style={s.botaoPrimario} onPress={() => navigation.navigate("Principal")}>
            <Text style={s.botaoPrimarioTexto}>Ver catálogo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={itens}
            keyExtractor={(item) => String(item.produto.id)}
            contentContainerStyle={s.lista}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <View style={s.item}>
                <ImagemProduto produto={item.produto} estilo={s.itemImagem} tamanhoEmoji={30} />

                <View style={s.itemInfo}>
                  <Text style={s.itemNome} numberOfLines={1}>{item.produto.nome}</Text>
                  <Text style={s.itemUnidade}>
                    {formatarPreco(item.produto.preco)} / {item.produto.unidade || "un."}
                  </Text>

                  <View style={s.itemRodape}>
                    <View style={s.qtdBox}>
                      <TouchableOpacity
                        style={s.qtdBotao}
                        onPress={() => alterarQuantidade(item.produto.id, -1)}
                        accessibilityLabel="Diminuir quantidade"
                      >
                        <Text style={s.qtdBotaoTexto}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.qtdTexto}>{item.quantidade}</Text>
                      <TouchableOpacity
                        style={s.qtdBotao}
                        onPress={() => aumentar(item)}
                        accessibilityLabel="Aumentar quantidade"
                      >
                        <Text style={s.qtdBotaoTexto}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.subtotal}>{formatarPreco(item.produto.preco * item.quantidade)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.remover}
                  onPress={() => removerDoCarrinho(item.produto.id)}
                  accessibilityLabel={`Remover ${item.produto.nome}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.removerTexto}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={s.resumo}>
            <View style={s.resumoLinha}>
              <Text style={s.resumoLabel}>Subtotal</Text>
              <Text style={s.resumoValor}>{formatarPreco(total)}</Text>
            </View>
            <View style={s.resumoLinha}>
              <Text style={s.resumoLabel}>Entrega</Text>
              <Text style={[s.resumoValor, { color: cores.primaria }]}>Grátis</Text>
            </View>
            <View style={[s.resumoLinha, s.resumoTotalLinha]}>
              <Text style={s.resumoTotalLabel}>Total</Text>
              <Text style={s.resumoTotalValor}>{formatarPreco(total)}</Text>
            </View>
            <TouchableOpacity style={s.botaoPrimario} onPress={() => navigation.navigate("Pagamento")}>
              <Text style={s.botaoPrimarioTexto}>Escolher entrega e pagar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  limpar: { color: cores.perigo, fontWeight: "700", fontSize: 13 },

  vazioBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 },
  vazioEmoji: { fontSize: 56, marginBottom: 12 },
  vazioTitulo: { fontSize: 18, fontWeight: "800", color: cores.texto },
  vazioTexto: { color: cores.textoClaro, textAlign: "center", marginTop: 6, marginBottom: 20, lineHeight: 20 },

  lista: { paddingHorizontal: 16, paddingBottom: 16 },
  item: {
    flexDirection: "row", backgroundColor: cores.superficie, borderRadius: 16, padding: 10,
    borderWidth: 1, borderColor: cores.borda,
  },
  itemImagem: { width: 76, height: 76, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  itemNome: { fontSize: 15, fontWeight: "800", color: cores.texto, paddingRight: 20 },
  itemUnidade: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
  itemRodape: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  qtdBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: cores.fundo,
    borderRadius: 10, borderWidth: 1, borderColor: cores.borda,
  },
  qtdBotao: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  qtdBotaoTexto: { fontSize: 18, color: cores.primaria, fontWeight: "700" },
  qtdTexto: { minWidth: 22, textAlign: "center", fontSize: 14, fontWeight: "800", color: cores.texto },
  subtotal: { fontSize: 15, fontWeight: "900", color: cores.primariaEscura },
  remover: { position: "absolute", top: 10, right: 12 },
  removerTexto: { fontSize: 14, color: cores.textoClaro },

  resumo: {
    backgroundColor: cores.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderTopWidth: 1, borderColor: cores.borda,
  },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  resumoLabel: { fontSize: 14, color: cores.textoClaro },
  resumoValor: { fontSize: 14, color: cores.texto, fontWeight: "600" },
  resumoTotalLinha: { borderTopWidth: 1, borderTopColor: cores.borda, paddingTop: 12, marginTop: 4, marginBottom: 16 },
  resumoTotalLabel: { fontSize: 16, fontWeight: "800", color: cores.texto },
  resumoTotalValor: { fontSize: 20, fontWeight: "900", color: cores.primariaEscura },

  botaoPrimario: {
    backgroundColor: cores.primaria, borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 28, alignItems: "center", alignSelf: "stretch",
  },
  botaoPrimarioTexto: { color: cores.branco, fontWeight: "800", fontSize: 15 },
});
