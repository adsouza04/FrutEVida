import React from "react";
import { View, Text, StyleSheet } from "react-native";
import cores from "../tema/cores";
import Icone from "./Icone";
import Botao from "./Botao";

export default function EstadoVazio({ icone, titulo, texto, acao, onAcao }) {
  return (
    <View style={s.caixa}>
      <View style={s.circulo}>
        <Icone nome={icone} tamanho={34} cor={cores.primaria} />
      </View>
      <Text style={s.titulo}>{titulo}</Text>
      {texto ? <Text style={s.texto}>{texto}</Text> : null}
      {acao ? <Botao titulo={acao} onPress={onAcao} estilo={{ marginTop: 20, alignSelf: "stretch" }} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  caixa: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 48 },
  circulo: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: cores.primariaClara,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  titulo: { fontSize: 18, fontWeight: "800", color: cores.texto, textAlign: "center" },
  texto: { fontSize: 14, color: cores.textoClaro, textAlign: "center", marginTop: 6, lineHeight: 20 },
});
