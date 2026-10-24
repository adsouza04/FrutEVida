import Constants from "expo-constants";

// Se o app não encontrar o servidor (ex.: usando "npx expo start --tunnel"),
// coloque aqui o endereço que aparece no terminal do backend:
// const URL_MANUAL = "http://192.168.0.15:3000";
const URL_MANUAL = null;

const PORTA_API = 3000;

// No Expo Go, o celular já conversa com o computador pelo IP da rede (hostUri).
// Reaproveitamos esse IP para chegar na API, que roda no mesmo computador.
function descobrirUrl() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host && !host.includes("exp.direct") && !host.includes("ngrok")) {
    return `http://${host}:${PORTA_API}`;
  }
  return `http://localhost:${PORTA_API}`;
}

export const API_URL = URL_MANUAL || descobrirUrl();