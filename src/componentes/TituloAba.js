import React from "react";
import { View, Text, StyleSheet } from "react-native";
import cores from "../tema/cores";

export default function TituloAba({ titulo, subtitulo, direita }) {
  return (
    <View style={s.linha}>
      <View style={{ flex: 1 }}>
        <Text style={s.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {direita}
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  titulo: { fontSize: 26, fontWeight: "800", color: cores.texto, letterSpacing: -0.4 },
  subtitulo: { fontSize: 13, color: cores.textoClaro, marginTop: 2 },
});
