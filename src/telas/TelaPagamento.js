import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import cores from "../tema/cores";
import { useCarrinho } from "../contexto/ContextoCarrinho";

const HORARIOS = ["08h–10h", "10h–12h", "14h–16h", "16h–18h"];
const FORMAS_PAGAMENTO = ["Pix", "Cartão de crédito", "Cartão de débito"];

export default function TelaPagamento({ navigation }) {
  const { total, limparCarrinho } = useCarrinho();
  const [horarioSelecionado, setHorarioSelecionado] = useState(HORARIOS[0]);
  const [formaSelecionada, setFormaSelecionada] = useState(FORMAS_PAGAMENTO[0]);

  function handlePagar() {
    alert(
      `Pedido confirmado!\nHorário: ${horarioSelecionado}\nPagamento: ${formaSelecionada}\nTotal: R$ ${total.toFixed(2)}`
    );
    limparCarrinho();
    navigation.navigate("Principal");
  }

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={estilos.voltar}>←</Text>
        </TouchableOpacity>
        <Text style={estilos.titulo}>Entrega e Pagamento</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Text style={estilos.secaoTitulo}>Horário de entrega</Text>
        <View style={estilos.opcoesLinha}>
          {HORARIOS.map((horario) => {
            const ativo = horario === horarioSelecionado;
            return (
              <TouchableOpacity
                key={horario}
                style={[estilos.opcao, ativo && estilos.opcaoAtiva]}
                onPress={() => setHorarioSelecionado(horario)}
              >
                <Text style={[estilos.opcaoTexto, ativo && estilos.opcaoTextoAtivo]}>
                  {horario}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={estilos.secaoTitulo}>Forma de pagamento (Mercado Pago)</Text>
        <View style={{ gap: 10 }}>
          {FORMAS_PAGAMENTO.map((forma) => {
            const ativo = forma === formaSelecionada;
            return (
              <TouchableOpacity
                key={forma}
                style={[estilos.formaPagamento, ativo && estilos.formaPagamentoAtiva]}
                onPress={() => setFormaSelecionada(forma)}
              >
                <View style={[estilos.radio, ativo && estilos.radioAtivo]} />
                <Text style={estilos.formaPagamentoTexto}>{forma}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={estilos.resumoBox}>
          <Text style={estilos.secaoTitulo}>Resumo do pedido</Text>
          <View style={estilos.resumoLinha}>
            <Text style={estilos.resumoLabel}>Total dos produtos</Text>
            <Text style={estilos.resumoValor}>R$ {total.toFixed(2)}</Text>
          </View>
          <View style={estilos.resumoLinha}>
            <Text style={estilos.resumoLabel}>Taxa de entrega</Text>
            <Text style={estilos.resumoValor}>R$ 0,00</Text>
          </View>
          <View style={[estilos.resumoLinha, { marginTop: 6 }]}>
            <Text style={estilos.resumoLabelTotal}>Total a pagar</Text>
            <Text style={estilos.resumoValorTotal}>R$ {total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={estilos.botaoPrimario} onPress={handlePagar}>
          <Text style={estilos.botaoPrimarioTexto}>CONFIRMAR E PAGAR</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  voltar: { fontSize: 20, color: cores.texto },
  titulo: { fontSize: 16, fontWeight: "bold", color: cores.texto },
  conteudo: { paddingHorizontal: 20, paddingBottom: 40 },
  secaoTitulo: { fontSize: 14, fontWeight: "bold", color: cores.texto, marginTop: 16, marginBottom: 10 },
  opcoesLinha: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  opcao: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  opcaoAtiva: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  opcaoTexto: { color: cores.texto, fontSize: 13 },
  opcaoTextoAtivo: { color: cores.branco, fontWeight: "bold" },
  formaPagamento: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  formaPagamentoAtiva: { borderColor: cores.primaria, backgroundColor: cores.primariaClara },
  formaPagamentoTexto: { fontSize: 13, color: cores.texto },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: cores.borda,
    marginRight: 10,
  },
  radioAtivo: { borderColor: cores.primaria, backgroundColor: cores.primaria },
  resumoBox: { marginTop: 8 },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  resumoLabel: { color: cores.textoClaro, fontSize: 13 },
  resumoValor: { color: cores.texto, fontSize: 13 },
  resumoLabelTotal: { color: cores.texto, fontSize: 15, fontWeight: "bold" },
  resumoValorTotal: { color: cores.primaria, fontSize: 17, fontWeight: "bold" },
  botaoPrimario: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
  },
  botaoPrimarioTexto: { color: cores.branco, fontWeight: "bold", fontSize: 14 },
});
