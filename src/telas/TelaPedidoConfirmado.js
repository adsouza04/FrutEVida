import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import Botao from "../componentes/Botao";
import Icone from "../componentes/Icone";
import { formatarPreco } from "../utils/validacoes";
import { textoEntrega } from "../utils/pedidos";

export default function TelaPedidoConfirmado({ navigation, route }) {
  const pedido = route?.params?.pedido;
  if (!pedido) return null;

  const qtdItens = pedido.itens.reduce((s, i) => s + i.quantidade, 0);
  const end = pedido.endereco_entrega;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.conteudo}>
        <View style={s.circulo}>
          <Icone nome="checkmark" tamanho={52} cor={cores.branco} />
        </View>
        <Text style={s.titulo}>Pedido confirmado!</Text>
        <Text style={s.codigo}>{pedido.codigo}</Text>
        <Text style={s.texto}>Já estamos separando seus produtos. Você pode acompanhar cada etapa até a entrega.</Text>

        <View style={s.cartao}>
          <Linha rotulo="Itens" valor={`${qtdItens} ${qtdItens === 1 ? "produto" : "produtos"}`} />
          <Linha rotulo="Subtotal" valor={formatarPreco(pedido.subtotal)} />
          <Linha rotulo="Frete" valor={pedido.frete ? formatarPreco(pedido.frete) : "Grátis"} />
          {pedido.desconto > 0 && <Linha rotulo={`Desconto (${pedido.cupom})`} valor={`- ${formatarPreco(pedido.desconto)}`} />}
          <Linha rotulo="Total pago" valor={formatarPreco(pedido.valor_total)} forte />
          <View style={s.divisor} />
          <Linha rotulo="Pagamento" valor={pedido.pagamento?.forma_pagamento} />
          <Linha rotulo="Entrega" valor={textoEntrega(pedido).replace(/^(Entrega|Expressa) /, "")} />
          {end && <Linha rotulo="Endereço" valor={`${end.rua}, ${end.numero} - ${end.bairro}`} />}
        </View>

        <Botao
          titulo="Rastrear pedido"
          icone="navigate-outline"
          variante="escuro"
          onPress={() => navigation.reset([{ nome: "Pedidos" }, { nome: "Rastreamento", params: { pedidoId: pedido.id } }])}
        />
        <Botao
          titulo="Continuar comprando"
          variante="secundario"
          onPress={() => navigation.reset([{ nome: "Inicio" }])}
          estilo={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Linha({ rotulo, valor, forte }) {
  return (
    <View style={s.linha}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <Text style={[s.valor, forte && s.valorForte]} numberOfLines={2}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  circulo: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: cores.primaria, alignSelf: "center",
    alignItems: "center", justifyContent: "center",
  },
  titulo: { fontSize: 26, fontWeight: "800", color: cores.texto, textAlign: "center", marginTop: 18 },
  codigo: { fontSize: 15, fontWeight: "800", color: cores.primaria, textAlign: "center", marginTop: 4 },
  texto: { fontSize: 14, color: cores.textoClaro, textAlign: "center", marginTop: 8, lineHeight: 20, paddingHorizontal: 12 },
  cartao: {
    backgroundColor: cores.superficie, borderRadius: 18, padding: 16, borderWidth: 1,
    borderColor: cores.borda, marginTop: 22, marginBottom: 20,
  },
  linha: { flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 9 },
  rotulo: { fontSize: 14, color: cores.textoClaro },
  valor: { flex: 1, fontSize: 14, color: cores.texto, fontWeight: "600", textAlign: "right" },
  valorForte: { fontSize: 17, fontWeight: "900", color: cores.primariaEscura },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: 8 },
});
