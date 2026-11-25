import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import cores from "../tema/cores";
import Icone from "./Icone";

export default function SeletorQuantidade({ valor, onDiminuir, onAumentar, grande }) {
  const tam = grande ? 44 : 32;
  return (
    <View style={s.caixa}>
      <TouchableOpacity style={[s.botao, { width: tam, height: tam }]} onPress={onDiminuir} accessibilityLabel="Diminuir quantidade">
        <Icone nome="remove" tamanho={grande ? 22 : 18} cor={cores.primaria} />
      </TouchableOpacity>
      <Text style={[s.valor, grande && { fontSize: 18, minWidth: 34 }]}>{valor}</Text>
      <TouchableOpacity style={[s.botao, { width: tam, height: tam }]} onPress={onAumentar} accessibilityLabel="Aumentar quantidade">
        <Icone nome="add" tamanho={grande ? 22 : 18} cor={cores.primaria} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  caixa: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: cores.fundo,
    borderRadius: 12, borderWidth: 1, borderColor: cores.borda,
  },
  botao: { alignItems: "center", justifyContent: "center" },
  valor: { minWidth: 24, textAlign: "center", fontSize: 15, fontWeight: "800", color: cores.texto },
});
