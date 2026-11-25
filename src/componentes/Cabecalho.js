import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import cores from "../tema/cores";
import Icone from "./Icone";

export default function Cabecalho({ titulo, subtitulo, onVoltar, direita }) {
  return (
    <View style={s.cabecalho}>
      {onVoltar ? (
        <TouchableOpacity
          style={s.voltar}
          onPress={onVoltar}
          accessibilityLabel="Voltar"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icone nome="chevron-back" tamanho={22} />
        </TouchableOpacity>
      ) : (
        <View style={s.lado} />
      )}

      <View style={s.centro}>
        <Text style={s.titulo} numberOfLines={1}>{titulo}</Text>
        {subtitulo ? <Text style={s.subtitulo} numberOfLines={1}>{subtitulo}</Text> : null}
      </View>

      <View style={s.lado}>{direita}</View>
    </View>
  );
}

const s = StyleSheet.create({
  cabecalho: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  voltar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: cores.superficie,
    borderWidth: 1, borderColor: cores.borda, alignItems: "center", justifyContent: "center",
  },
  lado: { minWidth: 40, alignItems: "flex-end" },
  centro: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  titulo: { fontSize: 17, fontWeight: "800", color: cores.texto },
  subtitulo: { fontSize: 12, color: cores.textoClaro, marginTop: 2 },
});
