import React, { createContext, useContext, useState } from "react";

const ContextoUsuario = createContext();

export function ProvedorUsuario({ children }) {
    const [usuario, setUsuario] = useState(null);

    function cadastrarUsuario(dadosUsuario) {
        setUsuario({
            nome: dadosUsuario.nome.trim(),
            email: dadosUsuario.email.trim().toLowerCase(),
            telefone: dadosUsuario.telefone.trim(),
            endereco: dadosUsuario.endereco.trim(),
            senha: dadosUsuario.senha,
        });
    }

    function fazerLogin(email, senha) {
        if (!usuario) {
            return false;
        }

        const emailDigitado = email.trim().toLowerCase();

        return (
            emailDigitado === usuario.email &&
            senha === usuario.senha
        );
    }

    return (
        <ContextoUsuario.Provider
            value={{
                usuario,
                cadastrarUsuario,
                fazerLogin,
            }}
        >
            {children}
        </ContextoUsuario.Provider>
    );
}

export function useUsuario() {
    return useContext(ContextoUsuario);
}