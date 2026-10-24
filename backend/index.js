const os = require("os");
const { abrirBanco } = require("./src/banco");
const { criarApp } = require("./src/app");

const PORTA = process.env.PORTA || 3000;
const db = abrirBanco();
const app = criarApp(db);

app.listen(PORTA, "0.0.0.0", () => {
  console.log(`API Frut & Vida rodando na porta ${PORTA}`);
  console.log(
    process.env.MP_ACCESS_TOKEN
      ? "  Mercado Pago: configurado ✓"
      : "  Mercado Pago: NÃO configurado (crie o arquivo backend/.env com MP_ACCESS_TOKEN)"
  );
  // Mostra o IP da máquina na rede para configurar o app no celular.
  for (const lista of Object.values(os.networkInterfaces())) {
    for (const rede of lista || []) {
      if (rede.family === "IPv4" && !rede.internal) console.log(`  -> http://${rede.address}:${PORTA}`);
    }
  }
});