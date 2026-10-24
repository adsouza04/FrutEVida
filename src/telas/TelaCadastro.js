import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import cores from "../tema/cores";
import { useUsuario } from "../contexto/ContextoUsuario";
import { buscarCep } from "../servicos/api";
import { cepValido, validarCadastro } from "../utils/validacoes";

export default function TelaCadastro({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const { cadastrarUsuario } = useUsuario();

  // Consome o serviço REST dos Correios (ViaCEP) quando o CEP fica completo.
  async function alterarCep(valor) {
    setCep(valor);
    setAvisoCep("");
    if (!cepValido(valor)) return;

    setBuscandoCep(true);
    try {
      const encontrado = await buscarCep(valor);
      setEndereco(encontrado.texto + ", nº ");
      setAvisoCep("Endereço encontrado. Complete com o número.");
    } catch (erro) {
      setAvisoCep(erro.semConexao ? "Sem internet para buscar o CEP." : erro.message);
    } finally {
      setBuscandoCep(false);
    }
  }

  async function handleCadastrar() {
    const erro = validarCadastro({ nome, email, telefone, endereco, senha, confirmarSenha });
    if (erro) {
      alert(erro);
      return;
    }

    setSalvando(true);
    try {
      await cadastrarUsuario({ nome, email, telefone, cep, endereco, senha });
      alert("Conta criada com sucesso! Faça o login para continuar.");
      navigation.replace("Login");
    } catch (e) {
      alert(e.semConexao ? "Sem conexão com o servidor. Tente novamente." : e.message);
    } finally {
      setSalvando(false);
    }
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
          testID="campo-nome"
          value={nome}
          onChangeText={setNome}
        />

        <Campo
          rotulo="E-mail"
          testID="campo-email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Campo
          rotulo="Telefone"
          testID="campo-telefone"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        <Campo
          rotulo="CEP"
          testID="campo-cep"
          value={cep}
          onChangeText={alterarCep}
          keyboardType="number-pad"
          maxLength={9}
          placeholder="00000-000"
        />
        {(buscandoCep || avisoCep) ? (
          <View style={estilos.avisoCep}>
            {buscandoCep && <ActivityIndicator size="small" color={cores.primaria} />}
            <Text style={estilos.avisoCepTexto}>
              {buscandoCep ? " Buscando endereço nos Correios..." : avisoCep}
            </Text>
          </View>
        ) : null}

        <Campo
          rotulo="Endereço de entrega"
          testID="campo-endereco"
          value={endereco}
          onChangeText={setEndereco}
        />

        <Campo
          rotulo="Senha"
          testID="campo-senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <Campo
          rotulo="Confirmar senha"
          testID="campo-confirmar-senha"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry
        />

        <TouchableOpacity
          style={[estilos.botaoPrimario, salvando && { opacity: 0.7 }]}
          onPress={handleCadastrar}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator color={cores.branco} />
          ) : (
            <Text style={estilos.botaoPrimarioTexto}>CADASTRAR</Text>
          )}
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

  avisoCep: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
    marginBottom: 12,
  },

  avisoCepTexto: {
    fontSize: 12,
    color: cores.textoClaro,
  },
});