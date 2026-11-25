import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import cores from "../tema/cores";
import Icone from "./Icone";
import ImagemProduto from "./ImagemProduto";
import { useCarrinho } from "../contexto/ContextoCarrinho";
import { useUsuario } from "../contexto/ContextoUsuario";
import { formatarPreco } from "../utils/validacoes";

export const ESTOQUE_BAIXO = 5;

// Card do produto usado no Início, na Busca e nos Favoritos.
export default function CartaoProduto({ produto, onPress, largura }) {
  const { adicionarAoCarrinho, quantidadeDe } = useCarrinho();
  const { ehFavorito, alternarFavorito } = useUsuario();

  const qtd = quantidadeDe(produto.id);
  const esgotado = produto.estoque !== undefined && produto.estoque <= 0;
  const ultimas = !esgotado && produto.estoque !== undefined && produto.estoque <= ESTOQUE_BAIXO;
  const favorito = ehFavorito(produto.id);
  const desconto = produto.preco_antigo
    ? Math.round((1 - produto.preco / produto.preco_antigo) * 100)
    : 0;

  function adicionar() {
    if (produto.estoque !== undefined && qtd >= produto.estoque) {
      Alert.alert("Estoque esgotado", `Temos só ${produto.estoque} unidade(s) de ${produto.nome} no momento.`);
      return;
    }
    adicionarAoCarrinho(produto);
  }

  async function favoritar() {
    try {
      await alternarFavorito(produto.id);
    } catch {
      Alert.alert("Favoritos", "Não foi possível salvar o favorito. Verifique a conexão.");
    }
  }

  return (
    <TouchableOpacity
      style={[s.card, largura ? { width: largura, flex: 0 } : { maxWidth: "48.5%" }, esgotado && { opacity: 0.55 }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${produto.nome}, ${formatarPreco(produto.preco)}`}
    >
      <ImagemProduto produto={produto} estilo={s.imagem} tamanhoEmoji={54} />

      {desconto > 0 && !esgotado ? (
        <View style={[s.selo, s.seloOferta]}>
          <Text style={[s.seloTexto, { color: cores.branco }]}>-{desconto}%</Text>
        </View>
      ) : esgotado || ultimas ? (
        <View style={[s.selo, esgotado && s.seloEsgotado]}>
          <Text style={[s.seloTexto, esgotado && { color: cores.branco }]}>{esgotado ? "Esgotado" : "Últimas unidades"}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={s.favorito}
        onPress={favoritar}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Icone nome={favorito ? "heart" : "heart-outline"} tamanho={18} cor={favorito ? cores.perigo : cores.texto} />
      </TouchableOpacity>

      <Text style={s.nome} numberOfLines={1}>{produto.nome}</Text>
      <Text style={s.unidade} numberOfLines={1}>{produto.unidade || produto.categoria}</Text>

      <View style={s.rodape}>
        <View style={{ flex: 1 }}>
          {produto.preco_antigo ? <Text style={s.precoAntigo}>{formatarPreco(produto.preco_antigo)}</Text> : null}
          <Text style={s.preco}>{formatarPreco(produto.preco)}</Text>
        </View>
        <TouchableOpacity
          testID={`adicionar-${produto.id}`}
          style={[s.mais, qtd > 0 && s.maisAtivo, esgotado && { backgroundColor: cores.borda }]}
          onPress={adicionar}
          disabled={esgotado}
          accessibilityLabel={`Adicionar ${produto.nome} ao carrinho`}
        >
          {qtd > 0 ? <Text style={s.maisTexto}>{qtd}</Text> : <Icone nome="add" tamanho={20} cor={cores.branco} />}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: cores.superficie, borderRadius: 18, padding: 8,
    marginBottom: 12, borderWidth: 1, borderColor: cores.borda,
  },
  imagem: { height: 120, borderRadius: 13 },
  selo: {
    position: "absolute", left: 14, top: 14, backgroundColor: cores.destaque,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  seloOferta: { backgroundColor: cores.secundaria },
  seloEsgotado: { backgroundColor: cores.perigo },
  seloTexto: { fontSize: 11, color: "#6B5418", fontWeight: "800" },
  favorito: {
    position: "absolute", right: 14, top: 14, width: 32, height: 32, borderRadius: 16,
    backgroundColor: cores.superficie, alignItems: "center", justifyContent: "center",
  },
  nome: { fontSize: 14, fontWeight: "800", color: cores.texto, marginTop: 10, paddingHorizontal: 4 },
  unidade: { fontSize: 12, color: cores.textoClaro, marginTop: 2, paddingHorizontal: 4 },
  rodape: { flexDirection: "row", alignItems: "flex-end", marginTop: 8, paddingLeft: 4 },
  precoAntigo: { fontSize: 11, color: cores.textoClaro, textDecorationLine: "line-through" },
  preco: { fontSize: 15, fontWeight: "900", color: cores.primariaEscura },
  mais: {
    minWidth: 36, height: 36, borderRadius: 12, backgroundColor: cores.primaria,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 8,
  },
  maisAtivo: { backgroundColor: cores.secundaria },
  maisTexto: { fontSize: 16, color: cores.branco, fontWeight: "900" },
});
