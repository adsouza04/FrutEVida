const express = require("express");

const app = express();
const PORTA = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensagem: "API Frut & Vida funcionando!",
    });
});

app.get("/produtos", (req, res) => {
    res.json([
        {
            id: 1,
            nome: "Tomate Italiano",
            preco: 8.5,
            categoria: "Legumes",
        },
        {
            id: 2,
            nome: "Cenoura",
            preco: 4.9,
            categoria: "Legumes",
        },
    ]);
});

app.listen(PORTA, () => {
    console.log(
        `API Frut & Vida rodando na porta ${PORTA}`
    );
});