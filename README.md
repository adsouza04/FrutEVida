# Frut & Vida

Aplicativo de e-commerce de hortifruti e sucos naturais, desenvolvido em React Native (Expo)
para o Projeto Integrador IV – Desenvolvimento para Dispositivos Móveis (Senac).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `src/telas` | 14 telas: Login, Cadastro, Início, Buscar, Produto, Carrinho, Checkout, Pedido confirmado, Meus pedidos, Rastreamento, Perfil, Favoritos, Endereço e Administração |
| `src/componentes` | Componentes reutilizáveis (barra de abas, card de produto, campos, botões, formulário de endereço etc.) |
| `src/contexto` | Estado global com Context API (usuário, produtos, carrinho) |
| `src/utils` | Regras compartilhadas com o servidor (frete, cupons, CPF, etapas do pedido), máscaras e validações |
| `src/servicos` | Consumo da API REST, ViaCEP (Correios) e sincronização offline |
| `src/dados` | Banco local SQLite do celular (cache de produtos e fila de pedidos offline) |
| `backend` | API REST em Node.js/Express + SQLite, integração com Mercado Pago e testes |
| `backend/public/imagens` | Fotos dos produtos (veja o `LEIA-ME.md` da pasta) |
| `dashboard` | Dashboard em Python (Streamlit) que lê o JSON exportado pelo app |
| `database` | Script SQL do banco de dados |

## Como rodar

Pré-requisitos: Node.js (LTS), app Expo Go no celular, e celular e computador na mesma rede Wi-Fi.

```bash
# 1. Dependências (na raiz e no backend)
npm install
cd backend && npm install

# 2. Token do Mercado Pago: copie backend/.env.example para backend/.env e cole o Access Token de teste

# 3. Backend (terminal 1, dentro de backend/)
npm start

# 4. App (terminal 2, na raiz do projeto)
npx expo start
```

Escaneie o QR Code com o Expo Go.

### Cupons para testar

`FRUTA10` (10% nos produtos), `FRETEGRATIS` (frete grátis) e `BEMVINDO5` (R$ 5 em compras a partir de R$ 30).

### Contas

- **Administrador:** `admin@frutevida.com` / `admin123` (criada automaticamente pelo backend). Só essa conta vê a Administração (no Perfil), onde cadastra, edita e exclui produtos e avança as etapas dos pedidos.
- **Cliente:** crie pela tela de cadastro.

### Dados de exemplo para o dashboard

```bash
cd backend
npm run seed      # gera clientes e pedidos de exemplo dos últimos 60 dias
```

Depois, no app, entre como administrador e toque em **Gerar JSON**.

### Testes (unitários, integração e E2E)

```bash
cd backend
npm test
```

### Dashboard

```bash
cd dashboard
py -m pip install -r requirements.txt
py -m streamlit run dashboard.py
```
