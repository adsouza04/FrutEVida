import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import { useUsuario } from "../contexto/ContextoUsuario";
import Cabecalho from "../componentes/Cabecalho";
import FormEndereco, { ENDERECO_VAZIO, errosEndereco } from "../componentes/FormEndereco";
import Botao from "../componentes/Botao";
import { mascararCep } from "../utils/mascaras";

export default function TelaEndereco({ navigation }) {
  const { usuario, salvarEndereco } = useUsuario();
  const [endereco, setEndereco] = useState({
    ...ENDERECO_VAZIO, ...(usuario?.endereco || {}), cep: mascararCep(usuario?.endereco?.cep || ""),
  });
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setTentou(true);
    if (Object.keys(errosEndereco(endereco)).length) return;
    setSalvando(true);
    try {
      await salvarEndereco(endereco);
      Alert.alert("Endereço salvo", "Usaremos este endereço nas suas próximas compras.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Endereço", e.semConexao ? "Sem conexão com o servidor. Tente novamente." : e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho titulo="Endereço de entrega" onVoltar={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
          <View style={s.cartao}>
            <FormEndereco endereco={endereco} onChange={setEndereco} erros={tentou ? errosEndereco(endereco) : {}} />
            <Botao titulo="Salvar endereço" onPress={salvar} carregando={salvando} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16, paddingBottom: 40 },
  cartao: { backgroundColor: cores.superficie, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: cores.borda },
});
