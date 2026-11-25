import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import cores from "../tema/cores";
import { API_URL } from "../servicos/config";
import { CATEGORIA_ICONE } from "../dados/produtos";
import { resolverImagem } from "../utils/imagens";

// Mostra a foto do produto; se não houver foto (ou ela falhar), mostra o emoji.
export default function ImagemProduto({ produto, estilo, tamanhoEmoji = 40 }) {
  const uri = resolverImagem(produto?.imagem, API_URL);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => setFalhou(false), [uri]);

  return (
    <View style={[s.caixa, estilo]}>
      {uri && !falhou ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFalhou(true)}
          accessibilityLabel={produto?.nome}
        />
      ) : (
        <Text style={{ fontSize: tamanhoEmoji }}>
          {produto?.emoji || CATEGORIA_ICONE[produto?.categoria] || "🌱"}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  caixa: {
    backgroundColor: cores.primariaClara,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
