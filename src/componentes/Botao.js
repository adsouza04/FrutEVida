import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import cores from "../tema/cores";
import Icone from "./Icone";

export default function Botao({ titulo, onPress, variante = "primario", carregando, desabilitado, icone, estilo }) {
  const v = VARIANTES[variante];
  const inativo = desabilitado || carregando;
  return (
    <TouchableOpacity
      style={[s.botao, v.botao, inativo && { opacity: 0.6 }, estilo]}
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
    >
      {carregando ? (
        <ActivityIndicator color={v.texto.color} />
      ) : (
        <View style={s.conteudo}>
          {icone ? <Icone nome={icone} tamanho={18} cor={v.texto.color} estilo={{ marginRight: 8 }} /> : null}
          <Text style={[s.texto, v.texto]}>{titulo}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const VARIANTES = {
  primario: { botao: { backgroundColor: cores.primaria }, texto: { color: cores.branco } },
  escuro: { botao: { backgroundColor: cores.primariaEscura }, texto: { color: cores.branco } },
  secundario: {
    botao: { backgroundColor: cores.superficie, borderWidth: 1.5, borderColor: cores.primaria },
    texto: { color: cores.primaria },
  },
  perigo: {
    botao: { backgroundColor: cores.superficie, borderWidth: 1.5, borderColor: cores.perigo },
    texto: { color: cores.perigo },
  },
};

const s = StyleSheet.create({
  botao: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  conteudo: { flexDirection: "row", alignItems: "center" },
  texto: { fontSize: 15, fontWeight: "800" },
});
