# Frut & Vida — Item 1.4 (Configuração do Ambiente e Interface Inicial)

App de e-commerce de hortifruti e sucos naturais, desenvolvido em React Native com Expo,
como parte do Projeto Integrador IV (PI IV – Desenvolvimento para Dispositivos Móveis).

## Telas implementadas

| Tela | Arquivo | Descrição |
|---|---|---|
| Login | `src/telas/TelaLogin.js` | Autenticação do usuário |
| Cadastro | `src/telas/TelaCadastro.js` | Criação de conta do cliente |
| Principal (Catálogo) | `src/telas/TelaPrincipal.js` | Listagem, busca e filtro de produtos por categoria |
| Carrinho | `src/telas/TelaCarrinho.js` | Itens adicionados, quantidades e total |
| Pagamento | `src/telas/TelaPagamento.js` | Horário de entrega e formas de pagamento (Mercado Pago) |
| Administração | `src/telas/TelaAdmin.js` | CRUD de produtos (adicionar, editar valor, excluir) |

Os dados de produtos estão mockados em `src/dados/produtos.js` e o estado é gerenciado
por Context API (`src/contexto/ContextoProdutos.js` e `src/contexto/ContextoCarrinho.js`).
Na Sprint 2 (item 1.5), esses dados passarão a vir da API Node + banco de dados.

## Como rodar o projeto

### 1. Pré-requisitos
- Node.js instalado (versão LTS): https://nodejs.org
- Editor: Visual Studio Code
- App **Expo Go** instalado no celular (Android ou iOS), disponível na loja de apps

### 2. Instalar as dependências
Abra a pasta do projeto no VS Code, abra o terminal integrado e rode:

```bash
npm install
```

### 3. Iniciar o projeto

```bash
npx expo start
```

Isso abre um QR Code no terminal/navegador. Basta escanear o QR Code com o app **Expo Go**
(Android: usando o próprio app; iOS: usando a câmera do celular) para abrir o app no seu
celular, sem precisar instalar Android Studio ou Xcode.

