import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setCarregando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setMensagem("Se o e-mail existir, enviamos um link de recuperação.");
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Recuperar senha</h1>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {erro && <p className="auth-erro">{erro}</p>}
        {mensagem && <p className="auth-sucesso">{mensagem}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? "Enviando..." : "Enviar link de recuperação"}
        </button>

        <div className="auth-links">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </form>
    </div>
  );
}
