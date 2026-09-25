import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";

import cores from "../tema/cores";
import { useUsuario } from "../contexto/ContextoUsuario";

export default function TelaCadastro({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const { cadastrarUsuario } = useUsuario();

  function handleCadastrar() {
    if (
      !nome.trim() ||
      !email.trim() ||
      !telefone.trim() ||
      !endereco.trim() ||
      !senha ||
      !confirmarSenha
    ) {
      alert("Preencha todos os campos.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      alert("Digite um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      alert("As senhas não conferem.");
      return;
    }

    cadastrarUsuario({
      nome,
      email,
      telefone,
      endereco,
      senha,
    });

    alert("Conta criada com sucesso! Faça o login para continuar.");

    navigation.replace("Login");
  }

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.cabecalho}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={estilos.voltar}>←</Text>
        </TouchableOpacity>

        <Text style={estilos.titulo}>Criar Conta</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.formulario}>
        <Campo
          rotulo="Nome completo"
          value={nome}
          onChangeText={setNome}
        />

        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Campo
          rotulo="Telefone"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        <Campo
          rotulo="Endereço de entrega"
          value={endereco}
          onChangeText={setEndereco}
        />

        <Campo
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <Campo
          rotulo="Confirmar senha"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry
        />

        <TouchableOpacity
          style={estilos.botaoPrimario}
          onPress={handleCadastrar}
        >
          <Text style={estilos.botaoPrimarioTexto}>
            CADASTRAR
          </Text>
        </TouchableOpacity>

        <View style={estilos.rodape}>
          <Text style={estilos.textoSecundario}>
            Já tem conta?{" "}
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={estilos.link}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({ rotulo, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={estilos.rotulo}>{rotulo}</Text>

      <TextInput
        style={estilos.campo}
        placeholderTextColor={cores.placeholder}
        {...props}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },

  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  voltar: {
    fontSize: 20,
    color: cores.texto,
  },

  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: cores.texto,
  },

  formulario: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  rotulo: {
    fontSize: 13,
    color: cores.textoClaro,
    marginBottom: 6,
  },

  campo: {
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: cores.texto,
  },

  botaoPrimario: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },

  botaoPrimarioTexto: {
    color: cores.branco,
    fontWeight: "bold",
    fontSize: 15,
  },

  rodape: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  textoSecundario: {
    color: cores.textoClaro,
    fontSize: 13,
  },

  link: {
    color: cores.primaria,
    fontWeight: "bold",
    fontSize: 13,
  },
});