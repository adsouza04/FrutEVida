import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import cores from "../tema/cores";
import CampoTexto from "./CampoTexto";
import { buscarCep } from "../servicos/api";
import { mascararCep } from "../utils/mascaras";
import { cepValido } from "../utils/validacoes";

export const ENDERECO_VAZIO = { cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", referencia: "" };

export function errosEndereco(e) {
  const erros = {};
  if (!cepValido(e.cep)) erros.cep = "Digite um CEP com 8 números.";
  if (!e.rua.trim()) erros.rua = "Informe a rua.";
  if (!e.numero.trim()) erros.numero = "Informe o número.";
  if (!e.bairro.trim()) erros.bairro = "Informe o bairro.";
  if (!e.cidade.trim()) erros.cidade = "Informe a cidade.";
  return erros;
}

export default function FormEndereco({ endereco, onChange, erros = {} }) {
  const [buscando, setBuscando] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");
  const mudar = (campo) => (valor) => onChange({ ...endereco, [campo]: valor });

  async function alterarCep(valor) {
    const cep = mascararCep(valor);
    onChange({ ...endereco, cep });
    setAvisoCep("");
    if (!cepValido(cep)) return;

    setBuscando(true);
    try {
      const achado = await buscarCep(cep);
      onChange({
        ...endereco, cep,
        rua: achado.rua || endereco.rua,
        bairro: achado.bairro || endereco.bairro,
        cidade: achado.cidade || endereco.cidade,
        uf: achado.uf || endereco.uf,
      });
      setAvisoCep("Endereço encontrado. Confira e complete com o número.");
    } catch (erro) {
      setAvisoCep(erro.semConexao ? "Sem internet para buscar o CEP. Preencha manualmente." : erro.message);
    } finally {
      setBuscando(false);
    }
  }

  const cidadeUf = endereco.uf ? `${endereco.cidade} - ${endereco.uf}` : endereco.cidade;

  return (
    <View>
      <CampoTexto
        rotulo="CEP"
        value={endereco.cep}
        onChangeText={alterarCep}
        keyboardType="number-pad"
        placeholder="00000-000"
        erro={erros.cep}
        ajuda={avisoCep}
        direita={buscando ? <ActivityIndicator color={cores.primaria} /> : null}
      />
      <CampoTexto rotulo="Rua" value={endereco.rua} onChangeText={mudar("rua")} placeholder="Nome da rua" erro={erros.rua} />
      <View style={s.linha}>
        <CampoTexto
          rotulo="Número"
          value={endereco.numero}
          onChangeText={mudar("numero")}
          placeholder="Ex.: 123"
          erro={erros.numero}
          estilo={{ width: 110 }}
        />
        <CampoTexto
          rotulo="Complemento"
          value={endereco.complemento}
          onChangeText={mudar("complemento")}
          placeholder="Apto, bloco (opcional)"
          estilo={{ flex: 1 }}
        />
      </View>
      <CampoTexto rotulo="Bairro" value={endereco.bairro} onChangeText={mudar("bairro")} placeholder="Nome do bairro" erro={erros.bairro} />
      <CampoTexto
        rotulo="Cidade"
        value={cidadeUf}
        onChangeText={(v) => onChange({ ...endereco, cidade: v.replace(/\s*-\s*[A-Za-z]{0,2}$/, ""), })}
        placeholder="Nome da cidade"
        erro={erros.cidade}
        editable={!endereco.uf}
      />
      <CampoTexto
        rotulo="Ponto de referência (opcional)"
        value={endereco.referencia}
        onChangeText={mudar("referencia")}
        placeholder="Ex.: portão verde, ao lado da padaria"
      />
    </View>
  );
}

const s = StyleSheet.create({ linha: { flexDirection: "row", gap: 12 } });
