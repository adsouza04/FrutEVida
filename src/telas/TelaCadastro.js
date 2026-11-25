import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import cores from "../tema/cores";
import Cabecalho from "../componentes/Cabecalho";
import CampoTexto from "../componentes/CampoTexto";
import Botao from "../componentes/Botao";
import Icone from "../componentes/Icone";
import { useUsuario } from "../contexto/ContextoUsuario";
import { errosCadastro, SENHA_MINIMA } from "../utils/validacoes";
import { mascararCpf, mascararTelefone } from "../utils/mascaras";

export default function TelaCadastro({ navigation }) {
  const [dados, setDados] = useState({
    nome: "", cpf: "", email: "", telefone: "", senha: "", confirmarSenha: "", aceitouTermos: false,
  });
  const [tocados, setTocados] = useState({});
  const [enviou, setEnviou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const { cadastrarUsuario } = useUsuario();

  const erros = errosCadastro(dados);
  const erroDe = (campo) => ((enviou || tocados[campo]) ? erros[campo] : null);

  const mudar = (campo, mascara) => (valor) => setDados((d) => ({ ...d, [campo]: mascara ? mascara(valor) : valor }));
  const sair = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));

  async function handleCadastrar() {
    setEnviou(true);
    if (Object.keys(erros).length) return;

    setSalvando(true);
    try {
      await cadastrarUsuario(dados);
      Alert.alert("Conta criada!", "Agora é só entrar com seu e-mail e senha.", [
        { text: "Entrar", onPress: () => navigation.replace("Login") },
      ]);
    } catch (e) {
      Alert.alert("Não foi possível criar a conta", e.semConexao ? "Sem conexão com o servidor. Tente novamente." : e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <Cabecalho titulo="Criar conta" onVoltar={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={s.intro}>Preencha seus dados. O endereço de entrega você informa na hora de finalizar a compra.</Text>

          <View style={s.cartao}>
            <CampoTexto
              rotulo="Nome completo"
              value={dados.nome}
              onChangeText={mudar("nome")}
              onBlur={sair("nome")}
              placeholder="Como está no seu documento"
              autoCapitalize="words"
              erro={erroDe("nome")}
            />
            <CampoTexto
              rotulo="CPF"
              value={dados.cpf}
              onChangeText={mudar("cpf", mascararCpf)}
              onBlur={sair("cpf")}
              placeholder="000.000.000-00"
              keyboardType="number-pad"
              maxLength={14}
              erro={erroDe("cpf")}
            />
            <CampoTexto
              rotulo="E-mail"
              value={dados.email}
              onChangeText={mudar("email")}
              onBlur={sair("email")}
              placeholder="seuemail@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              erro={erroDe("email")}
            />
            <CampoTexto
              rotulo="Telefone"
              value={dados.telefone}
              onChangeText={mudar("telefone", mascararTelefone)}
              onBlur={sair("telefone")}
              placeholder="(11) 90000-0000"
              keyboardType="phone-pad"
              maxLength={15}
              erro={erroDe("telefone")}
            />
            <CampoTexto
              rotulo="Senha"
              value={dados.senha}
              onChangeText={mudar("senha")}
              onBlur={sair("senha")}
              senha
              placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
              autoCapitalize="none"
              erro={erroDe("senha")}
              ajuda={dados.senha && !erros.senha ? "Senha com tamanho adequado." : null}
            />
            <CampoTexto
              rotulo="Confirmar senha"
              value={dados.confirmarSenha}
              onChangeText={mudar("confirmarSenha")}
              onBlur={sair("confirmarSenha")}
              senha
              placeholder="Repita a senha"
              autoCapitalize="none"
              erro={erroDe("confirmarSenha")}
            />

            <TouchableOpacity
              style={s.termos}
              onPress={() => setDados((d) => ({ ...d, aceitouTermos: !d.aceitouTermos }))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: dados.aceitouTermos }}
            >
              <View style={[s.check, dados.aceitouTermos && s.checkAtivo]}>
                {dados.aceitouTermos && <Icone nome="checkmark" tamanho={16} cor={cores.branco} />}
              </View>
              <Text style={s.termosTexto}>Aceito os termos de uso e a política de privacidade</Text>
            </TouchableOpacity>
            {enviou && erros.aceitouTermos ? <Text style={s.erro}>{erros.aceitouTermos}</Text> : null}

            <Botao titulo="Criar conta" onPress={handleCadastrar} carregando={salvando} estilo={{ marginTop: 18 }} />
          </View>

          <View style={s.rodape}>
            <Text style={s.rodapeTexto}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.link}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 16, paddingBottom: 40 },
  intro: { fontSize: 14, color: cores.textoClaro, lineHeight: 20, marginBottom: 14, paddingHorizontal: 4 },
  cartao: { backgroundColor: cores.superficie, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: cores.borda },
  termos: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  check: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: cores.borda,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  checkAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  termosTexto: { flex: 1, fontSize: 13, color: cores.texto, lineHeight: 18 },
  erro: { fontSize: 12, color: cores.perigo, marginTop: 6 },
  rodape: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  rodapeTexto: { fontSize: 14, color: cores.textoClaro },
  link: { fontSize: 14, color: cores.primaria, fontWeight: "800" },
});
