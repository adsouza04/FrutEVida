import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import TituloAba from "../componentes/TituloAba";
import ImagemProduto from "../componentes/ImagemProduto";
import SeletorQuantidade from "../componentes/SeletorQuantidade";
import ResumoValores from "../componentes/ResumoValores";
import EstadoVazio from "../componentes/EstadoVazio";
import Botao from "../componentes/Botao";
import Icone from "../componentes/Icone";
import { useAlturaAbas } from "../componentes/BarraAbas";
import { formatarPreco } from "../utils/validacoes";
import { CUPONS, FRETE_GRATIS_A_PARTIR_DE } from "../utils/regrasPedido";

export default function TelaCarrinho({ navigation }) {
  const {
    itens, alterarQuantidade, removerDoCarrinho, limparCarrinho, total, quantidadeTotal,
    cupom, aplicarCupom, removerCupom, resumo,
  } = useCarrinho();
  const alturaAbas = useAlturaAbas();
  const [codigo, setCodigo] = useState("");
  const [erroCupom, setErroCupom] = useState("");

  const valores = resumo("padrao");
  const faltaFreteGratis = FRETE_GRATIS_A_PARTIR_DE - total;
  // Cupom aplicado que deixou de valer (ex.: o subtotal caiu abaixo do mínimo).
  const cupomInvalido = cupom && valores.cupom !== cupom;

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

  function handleAplicar() {
    const erro = aplicarCupom(codigo);
    setErroCupom(erro || "");
    if (!erro) setCodigo("");
  }

  if (itens.length === 0) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <TituloAba titulo="Carrinho" />
        <EstadoVazio
          icone="basket-outline"
          titulo="Seu carrinho está vazio"
          texto="Escolha frutas, verduras e sucos para montar seu pedido."
          acao="Ver produtos"
          onAcao={() => navigation.navigate("Buscar")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <TituloAba
        titulo="Carrinho"
        subtitulo={`${quantidadeTotal} ${quantidadeTotal === 1 ? "item" : "itens"}`}
        direita={
          <TouchableOpacity onPress={confirmarLimpar}>
            <Text style={s.limpar}>Esvaziar</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={[s.conteudo, { paddingBottom: alturaAbas + 20 }]} keyboardShouldPersistTaps="handled">
        {itens.map((item) => (
          <TouchableOpacity
            key={String(item.produto.id)}
            style={s.item}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Produto", { produtoId: item.produto.id })}
          >
            <ImagemProduto produto={item.produto} estilo={s.itemImagem} tamanhoEmoji={30} />
            <View style={s.itemInfo}>
              <Text style={s.itemNome} numberOfLines={1}>{item.produto.nome}</Text>
              <Text style={s.itemUnidade}>{formatarPreco(item.produto.preco)} / {item.produto.unidade || "un."}</Text>
              <View style={s.itemRodape}>
                <SeletorQuantidade
                  valor={item.quantidade}
                  onDiminuir={() => alterarQuantidade(item.produto.id, -1)}
                  onAumentar={() => aumentar(item)}
                />
                <Text style={s.subtotal}>{formatarPreco(item.produto.preco * item.quantidade)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.remover}
              onPress={() => removerDoCarrinho(item.produto.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Remover ${item.produto.nome}`}
            >
              <Icone nome="close" tamanho={18} cor={cores.textoClaro} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {faltaFreteGratis > 0 ? (
          <View style={s.freteAviso}>
            <Icone nome="bicycle-outline" tamanho={20} cor={cores.primaria} />
            <Text style={s.freteTexto}>
              Faltam <Text style={{ fontWeight: "800" }}>{formatarPreco(faltaFreteGratis)}</Text> para ganhar frete grátis na entrega padrão.
            </Text>
          </View>
        ) : (
          <View style={s.freteAviso}>
            <Icone nome="checkmark-circle" tamanho={20} cor={cores.primaria} />
            <Text style={s.freteTexto}>Você ganhou frete grátis na entrega padrão.</Text>
          </View>
        )}

        <View style={s.cartao}>
          {cupom ? (
            <View style={s.cupomAplicado}>
              <Icone nome="pricetag" tamanho={18} cor={cupomInvalido ? cores.perigo : cores.primaria} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.cupomCodigo}>{cupom}</Text>
                <Text style={[s.cupomDescricao, cupomInvalido && { color: cores.perigo }]}>
                  {cupomInvalido ? "Este cupom não vale para o valor atual do carrinho." : CUPONS[cupom]?.descricao}
                </Text>
              </View>
              <TouchableOpacity onPress={removerCupom}>
                <Text style={s.limpar}>Remover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={s.cupomLinha}>
                <TextInput
                  style={[s.cupomInput, erroCupom && { borderColor: cores.perigo }]}
                  placeholder="Cupom de desconto"
                  placeholderTextColor={cores.placeholder}
                  value={codigo}
                  onChangeText={(t) => { setCodigo(t.toUpperCase()); setErroCupom(""); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleAplicar}
                />
                <TouchableOpacity style={[s.cupomBotao, !codigo && { opacity: 0.5 }]} onPress={handleAplicar} disabled={!codigo}>
                  <Text style={s.cupomBotaoTexto}>Aplicar</Text>
                </TouchableOpacity>
              </View>
              {erroCupom ? (
                <Text style={s.cupomErro}>{erroCupom}</Text>
              ) : (
                <Text style={s.cupomDica}>Experimente FRUTA10 (10% off) ou FRETEGRATIS.</Text>
              )}
            </>
          )}

          <View style={s.divisor} />
          <ResumoValores resumo={valores} quantidade={quantidadeTotal} />
          <Text style={s.observacao}>O frete mostrado é da entrega padrão. Você escolhe a forma de entrega no próximo passo.</Text>
        </View>

        <Botao titulo="Finalizar compra" variante="escuro" onPress={() => navigation.navigate("Checkout")} estilo={{ marginTop: 16 }} />
        <TouchableOpacity style={s.continuar} onPress={() => navigation.navigate("Buscar")}>
          <Text style={s.continuarTexto}>Continuar comprando</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16 },
  limpar: { color: cores.perigo, fontWeight: "700", fontSize: 13 },
  item: {
    flexDirection: "row", backgroundColor: cores.superficie, borderRadius: 16, padding: 10,
    borderWidth: 1, borderColor: cores.borda, marginBottom: 10,
  },
  itemImagem: { width: 80, height: 80, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "space-between" },
  itemNome: { fontSize: 15, fontWeight: "800", color: cores.texto, paddingRight: 22 },
  itemUnidade: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
  itemRodape: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  subtotal: { fontSize: 15, fontWeight: "900", color: cores.primariaEscura },
  remover: { position: "absolute", top: 10, right: 10 },
  freteAviso: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: cores.primariaClara,
    borderRadius: 14, padding: 12, marginBottom: 10,
  },
  freteTexto: { flex: 1, fontSize: 13, color: cores.primariaEscura, lineHeight: 18 },
  cartao: { backgroundColor: cores.superficie, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: cores.borda },
  cupomLinha: { flexDirection: "row", gap: 10 },
  cupomInput: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: cores.borda,
    paddingHorizontal: 14, fontSize: 15, color: cores.texto, backgroundColor: cores.fundo,
  },
  cupomBotao: { height: 48, borderRadius: 12, backgroundColor: cores.primaria, paddingHorizontal: 18, justifyContent: "center" },
  cupomBotaoTexto: { color: cores.branco, fontWeight: "800" },
  cupomDica: { fontSize: 12, color: cores.textoClaro, marginTop: 8 },
  cupomErro: { fontSize: 12, color: cores.perigo, marginTop: 8 },
  cupomAplicado: { flexDirection: "row", alignItems: "center" },
  cupomCodigo: { fontSize: 14, fontWeight: "900", color: cores.texto },
  cupomDescricao: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: 14 },
  observacao: { fontSize: 12, color: cores.textoClaro, marginTop: 10, lineHeight: 17 },
  continuar: { alignItems: "center", paddingVertical: 14 },
  continuarTexto: { color: cores.primaria, fontWeight: "800" },
});
