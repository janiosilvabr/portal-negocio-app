const CNPJ_PROVISORIO = "60.920.435/001-39";

export function cnpjEhProvisorio(cnpj) {
  if (!cnpj) return false;
  return (
    cnpj.toLowerCase().includes("provisório") ||
    cnpj.toLowerCase().includes("provisorio") ||
    cnpj === CNPJ_PROVISORIO
  );
}

export function cnpjValido(cnpj) {
  return Boolean(cnpj) && !cnpjEhProvisorio(cnpj);
}
