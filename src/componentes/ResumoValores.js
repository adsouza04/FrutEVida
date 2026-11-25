import React from "react";
import { View, Text, StyleSheet } from "react-native";
import cores from "../tema/cores";
import { formatarPreco } from "../utils/validacoes";

export default function ResumoValores({ resumo, quantidade, freteTexto }) {
  return (
    <View>
      {quantidade !== undefined && <Linha rotulo="Itens" valor={String(quantidade)} />}
      <Linha rotulo="Subtotal" valor={formatarPreco(resumo.subtotal)} />
      <Linha
        rotulo="Frete"
        valor={freteTexto || (resumo.frete === 0 ? "Grátis" : formatarPreco(resumo.frete))}
        destaque={!freteTexto && resumo.frete === 0}
      />
      <Linha
        rotulo={resumo.cupom ? `Desconto (${resumo.cupom})` : "Desconto"}
        valor={resumo.desconto > 0 ? `- ${formatarPreco(resumo.desconto)}` : formatarPreco(0)}
        destaque={resumo.desconto > 0}
      />
      <View style={s.totalLinha}>
        <Text style={s.totalRotulo}>Total</Text>
        <Text style={s.totalValor}>{formatarPreco(resumo.total)}</Text>
      </View>
    </View>
  );
}

function Linha({ rotulo, valor, destaque }) {
  return (
    <View style={s.linha}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Text style={[s.valor, destaque && { color: cores.primaria, fontWeight: "800" }]}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rotulo: { fontSize: 14, color: cores.textoClaro },
  valor: { fontSize: 14, color: cores.texto, fontWeight: "600" },
  totalLinha: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: cores.borda, paddingTop: 12, marginTop: 4,
  },
  totalRotulo: { fontSize: 16, fontWeight: "800", color: cores.texto },
  totalValor: { fontSize: 20, fontWeight: "900", color: cores.primariaEscura },
});
