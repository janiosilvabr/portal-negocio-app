import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function formatMinutos(bloqueadoAte) {
  const ms = new Date(bloqueadoAte).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 60000));
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const emailNormalizado = email.trim().toLowerCase();

    const { data: statusAntes } = await supabase
      .rpc("verificar_bloqueio_login", { p_email: emailNormalizado })
      .maybeSingle();

    if (statusAntes?.bloqueado) {
      setErro(
        `Muitas tentativas incorretas. Tente novamente em ${formatMinutos(statusAntes.bloqueado_ate)} minuto(s).`
      );
      setCarregando(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    await supabase.rpc("registrar_tentativa_login", {
      p_email: emailNormalizado,
      p_sucesso: !error,
    });

    setCarregando(false);

    if (error) {
      const { data: statusDepois } = await supabase
        .rpc("verificar_bloqueio_login", { p_email: emailNormalizado })
        .maybeSingle();

      setErro(
        statusDepois?.bloqueado
          ? `Muitas tentativas incorretas. Sua conta foi bloqueada por ${formatMinutos(statusDepois.bloqueado_ate)} minutos por segurança.`
          : "E-mail ou senha inválidos."
      );
      return;
    }

    navigate("/painel");
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Entrar</h1>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <div className="auth-links">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
          <Link to="/cadastro">Criar conta</Link>
        </div>
      </form>
    </div>
  );
}
