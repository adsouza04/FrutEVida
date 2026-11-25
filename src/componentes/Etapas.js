import React from "react";
import { View, Text, StyleSheet } from "react-native";
import cores from "../tema/cores";
import Icone from "./Icone";

// Indicador das etapas do checkout: concluídas, atual e próximas.
export default function Etapas({ etapas, atual }) {
  return (
    <View style={s.linha}>
      {etapas.map((nome, i) => {
        const feita = i < atual;
        const ativa = i === atual;
        return (
          <React.Fragment key={nome}>
            <View style={s.item}>
              <View style={[s.bolinha, (feita || ativa) && s.bolinhaAtiva]}>
                {feita ? (
                  <Icone nome="checkmark" tamanho={14} cor={cores.branco} />
                ) : (
                  <Text style={[s.numero, ativa && { color: cores.branco }]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[s.rotulo, (feita || ativa) && s.rotuloAtivo]}>{nome}</Text>
            </View>
            {i < etapas.length - 1 && <View style={[s.trilho, feita && { backgroundColor: cores.primaria }]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, marginBottom: 16 },
  item: { alignItems: "center", width: 76 },
  bolinha: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: cores.borda,
    backgroundColor: cores.superficie, alignItems: "center", justifyContent: "center",
  },
  bolinhaAtiva: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  numero: { fontSize: 13, fontWeight: "800", color: cores.textoClaro },
  rotulo: { fontSize: 12, color: cores.textoClaro, marginTop: 6 },
  rotuloAtivo: { color: cores.texto, fontWeight: "800" },
  trilho: { flex: 1, height: 2, backgroundColor: cores.borda, marginTop: 13 },
});
