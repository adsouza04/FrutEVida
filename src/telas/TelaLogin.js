import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import cores from "../tema/cores";
import { useUsuario } from "../contexto/ContextoUsuario";

export default function TelaLogin({ navigation }) {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [ver, setVer] = useState(false);

    const { usuario, fazerLogin } = useUsuario();

    function entrar() {
        if (!email.trim() || !senha) {
            alert("Preencha e-mail e senha para continuar.");
            return;
        }

        if (!usuario) {
            alert("Nenhuma conta cadastrada. Crie uma conta primeiro.");
            return;
        }

        const loginValido = fazerLogin(email, senha);

        if (!loginValido) {
            alert("E-mail ou senha incorretos.");
            return;
        }

        navigation.replace("Principal");
    }

    return (
        <SafeAreaView style={s.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={s.hero}>
                    <View style={s.decor1} />
                    <View style={s.decor2} />

                    <View style={s.logo}>
                        <Text style={{ fontSize: 38 }}>🌿</Text>
                    </View>

                    <Text style={s.marca}>Frut & Vida</Text>

                    <Text style={s.slogan}>
                        Fresco, saudável e pertinho de você.
                    </Text>
                </View>

                <View style={s.card}>
                    <Text style={s.titulo}>
                        Que bom ter você aqui!
                    </Text>

                    <Text style={s.sub}>
                        Entre para continuar suas compras.
                    </Text>

                    <Text style={s.label}>E-mail</Text>

                    <View style={s.campoBox}>
                        <Text style={s.icone}>✉</Text>

                        <TextInput
                            style={s.campo}
                            placeholder="seuemail@exemplo.com"
                            placeholderTextColor={cores.placeholder}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <Text style={s.label}>Senha</Text>

                    <View style={s.campoBox}>
                        <Text style={s.icone}>⌑</Text>

                        <TextInput
                            style={s.campo}
                            placeholder="••••••••"
                            placeholderTextColor={cores.placeholder}
                            secureTextEntry={!ver}
                            value={senha}
                            onChangeText={setSenha}
                        />

                        <TouchableOpacity onPress={() => setVer(!ver)}>
                            <Text style={s.olho}>
                                {ver ? "Ocultar" : "Ver"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity>
                        <Text style={s.esqueci}>
                            Esqueci minha senha
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={s.botao}
                        onPress={entrar}
                    >
                        <Text style={s.botaoTexto}>Entrar</Text>
                        <Text style={s.seta}>→</Text>
                    </TouchableOpacity>

                    <View style={s.rodape}>
                        <Text style={s.muted}>
                            Ainda não tem uma conta?{" "}
                        </Text>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("Cadastro")}
                        >
                            <Text style={s.link}>Criar conta</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={s.beneficios}>
                        <Text style={s.beneficio}>
                            ✓ Compra segura
                        </Text>

                        <Text style={s.beneficio}>
                            ✓ Produtos frescos
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cores.primaria,
    },

    hero: {
        height: 245,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    decor1: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255,255,255,.06)",
        left: -65,
        top: -40,
    },

    decor2: {
        position: "absolute",
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "rgba(255,255,255,.05)",
        right: -30,
        bottom: -25,
    },

    logo: {
        width: 76,
        height: 76,
        borderRadius: 24,
        backgroundColor: cores.branco,
        alignItems: "center",
        justifyContent: "center",
    },

    marca: {
        fontSize: 25,
        fontWeight: "900",
        color: cores.branco,
        marginTop: 10,
    },

    slogan: {
        fontSize: 12,
        color: "#DCECDD",
        marginTop: 4,
    },

    card: {
        flex: 1,
        backgroundColor: cores.fundo,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 28,
    },

    titulo: {
        fontSize: 22,
        fontWeight: "900",
        color: cores.texto,
    },

    sub: {
        fontSize: 12,
        color: cores.textoClaro,
        marginTop: 5,
        marginBottom: 15,
    },

    label: {
        fontSize: 11,
        fontWeight: "700",
        color: cores.texto,
        marginTop: 12,
        marginBottom: 6,
    },

    campoBox: {
        height: 50,
        backgroundColor: cores.superficie,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: cores.borda,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
    },

    icone: {
        fontSize: 16,
        color: cores.primaria,
        marginRight: 8,
    },

    campo: {
        flex: 1,
        fontSize: 14,
        color: cores.texto,
    },

    olho: {
        fontSize: 11,
        color: cores.primaria,
        fontWeight: "800",
    },

    esqueci: {
        fontSize: 11,
        color: cores.primaria,
        textAlign: "right",
        fontWeight: "700",
        marginTop: 9,
    },

    botao: {
        height: 52,
        borderRadius: 15,
        backgroundColor: cores.primaria,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 22,
        flexDirection: "row",
    },

    botaoTexto: {
        fontSize: 15,
        fontWeight: "900",
        color: cores.branco,
    },

    seta: {
        position: "absolute",
        right: 18,
        color: cores.branco,
        fontSize: 20,
    },

    rodape: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 19,
    },

    muted: {
        fontSize: 12,
        color: cores.textoClaro,
    },

    link: {
        fontSize: 12,
        color: cores.primaria,
        fontWeight: "900",
    },

    beneficios: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
        marginTop: 25,
    },

    beneficio: {
        fontSize: 9,
        color: cores.textoClaro,
    },
});