export function linkWhatsapp(telefone) {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const comCodigoPais = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comCodigoPais}`;
}
