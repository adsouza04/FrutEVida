export const CATEGORIAS = ["Frutas", "Verduras", "Legumes", "Temperos", "Sucos"];
export const CATEGORIA_ICONE = { Frutas:"🍎", Verduras:"🥬", Legumes:"🥕", Temperos:"🌿", Sucos:"🥤" };
let proximoId = 11;
export const PRODUTOS_INICIAIS = [
  { id:"1", nome:"Maçã Fuji", unidade:"1 kg", categoria:"Frutas", preco:7.9, emoji:"🍎", destaque:true },
  { id:"2", nome:"Banana Prata", unidade:"1 kg", categoria:"Frutas", preco:5.5, emoji:"🍌", destaque:true },
  { id:"3", nome:"Alface Crespa", unidade:"unidade", categoria:"Verduras", preco:3.5, emoji:"🥬" },
  { id:"4", nome:"Couve Manteiga", unidade:"maço", categoria:"Verduras", preco:4.0, emoji:"🥬" },
  { id:"5", nome:"Cenoura", unidade:"1 kg", categoria:"Legumes", preco:4.9, emoji:"🥕", destaque:true },
  { id:"6", nome:"Tempero Verde", unidade:"maço", categoria:"Temperos", preco:4.2, emoji:"🌿" },
  { id:"7", nome:"Suco Detox", unidade:"500 ml", categoria:"Sucos", preco:12.0, emoji:"🥤", destaque:true },
  { id:"8", nome:"Laranja Pera", unidade:"1 kg", categoria:"Frutas", preco:6.9, emoji:"🍊" },
  { id:"9", nome:"Tomate Italiano", unidade:"1 kg", categoria:"Legumes", preco:8.5, emoji:"🍅" },
  { id:"10", nome:"Morango", unidade:"bandeja", categoria:"Frutas", preco:10.9, emoji:"🍓" },
];
export function gerarNovoId(){ return String(proximoId++); }
