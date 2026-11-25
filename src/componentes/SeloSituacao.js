import React from "react";
import { View, Text, StyleSheet } from "react-native";
import cores from "../tema/cores";
import { situacao } from "../utils/pedidos";

const TONS = {
  andamento: { fundo: cores.primariaClara, texto: cores.primariaEscura },
  sucesso: { fundo: "#DFF3E4", texto: "#1E7A3A" },
  atencao: { fundo: cores.destaque, texto: "#6B5418" },
  erro: { fundo: "#F9E3E3", texto: cores.perigo },
};

export default function SeloSituacao({ status }) {
  const sit = situacao(status);
  const tom = TONS[sit.tom];
  return (
    <View style={[s.selo, { backgroundColor: tom.fundo }]}>
      <Text style={[s.texto, { color: tom.texto }]}>{sit.rotulo}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  selo: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  texto: { fontSize: 12, fontWeight: "800" },
});
