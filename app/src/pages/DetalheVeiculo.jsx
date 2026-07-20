import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function formatPreco(preco) {
  if (preco == null) return "Consulte";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DetalheVeiculo() {
  const { id } = useParams();
  const [veiculo, setVeiculo] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.rpc("obter_veiculo_publico", { p_veiculo_id: id }).maybeSingle(),
      supabase.from("fotos_veiculos").select("*").eq("veiculo_id", id).order("ordem").order("created_at"),
    ]).then(([{ data: dataVeiculo, error: erroVeiculo }, { data: dataFotos }]) => {
      if (erroVeiculo || !dataVeiculo) {
        setNaoEncontrado(true);
      } else {
        setVeiculo(dataVeiculo);
        setFotos(dataFotos ?? []);
      }
      setCarregando(false);
    });
  }, [id]);

  async function handleEnviarInteresse(e) {
    e.preventDefault();
    setErroForm("");

    if (!nome.trim()) {
      setErroForm("Informe seu nome.");
      return;
    }
    if (!telefone.trim() && !email.trim()) {
      setErroForm("Informe telefone ou e-mail para contato.");
      return;
    }

    setEnviando(true);

    const { error } = await supabase.rpc("criar_lead_publico", {
      p_veiculo_id: id,
      p_nome: nome,
      p_telefone: telefone,
      p_email: email,
      p_mensagem: mensagem,
    });

    setEnviando(false);

    if (error) {
      setErroForm(error.message);
      return;
    }

    setEnviado(true);
  }

  if (carregando) {
    return (
      <div className="vitrine">
        <div className="vitrine-content">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (naoEncontrado) {
    return (
      <div className="vitrine">
        <header className="vitrine-header">
          <span className="app-logo">Portal Negócio</span>
          <Link to="/login" className="vitrine-login-link">
            Entrar
          </Link>
        </header>
        <div className="vitrine-content">
          <p className="auth-erro">Veículo não encontrado ou não está mais disponível.</p>
          <Link to="/vitrine" className="botao-link">
            Voltar para a vitrine
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vitrine">
      <header className="vitrine-header">
        <span className="app-logo">Portal Negócio</span>
        <Link to="/login" className="vitrine-login-link">
          Entrar
        </Link>
      </header>

      <div className="vitrine-content">
        <Link to="/vitrine" className="detalhe-voltar">
          ← Voltar para a vitrine
        </Link>

        <div className="detalhe-veiculo">
          <div className="detalhe-galeria">
            <div className="detalhe-foto-principal">
              {fotos.length > 0 ? (
                <img src={fotos[fotoAtiva]?.url} alt={`${veiculo.marca} ${veiculo.modelo}`} />
              ) : (
                <div className="detalhe-sem-foto">Sem foto</div>
              )}
            </div>
            {fotos.length > 1 && (
              <div className="detalhe-miniaturas">
                {fotos.map((f, index) => (
                  <button
                    type="button"
                    key={f.id}
                    className={`detalhe-miniatura ${index === fotoAtiva ? "ativa" : ""}`}
                    onClick={() => setFotoAtiva(index)}
                  >
                    <img src={f.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="detalhe-info">
            <h1>
              {veiculo.marca} {veiculo.modelo}
            </h1>
            {veiculo.versao && <p className="vitrine-card-versao">{veiculo.versao}</p>}
            <p className="detalhe-preco">{formatPreco(veiculo.preco)}</p>
            {veiculo.empresa_nome && <p className="vitrine-card-garagem">{veiculo.empresa_nome}</p>}

            <ul className="detalhe-specs">
              <li>
                <span>Ano</span>
                {veiculo.ano_fabricacao ?? "-"}/{veiculo.ano_modelo ?? "-"}
              </li>
              <li>
                <span>Km</span>
                {veiculo.km != null ? `${veiculo.km.toLocaleString("pt-BR")} km` : "-"}
              </li>
              <li>
                <span>Combustível</span>
                {veiculo.combustivel ?? "-"}
              </li>
              <li>
                <span>Câmbio</span>
                {veiculo.cambio ?? "-"}
              </li>
              <li>
                <span>Cor</span>
                {veiculo.cor ?? "-"}
              </li>
            </ul>

            {!mostrarForm && !enviado && (
              <button type="button" className="botao-link detalhe-cta" onClick={() => setMostrarForm(true)}>
                Tenho interesse
              </button>
            )}

            {enviado && (
              <p className="auth-sucesso">
                Interesse enviado! A garagem vai entrar em contato com você em breve.
              </p>
            )}

            {mostrarForm && !enviado && (
              <form className="form-card detalhe-interesse-form" onSubmit={handleEnviarInteresse}>
                <div>
                  <label htmlFor="nome">Seu nome *</label>
                  <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="telefone">Telefone</label>
                  <input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="email">E-mail</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="mensagem">Mensagem (opcional)</label>
                  <textarea id="mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
                </div>

                {erroForm && <p className="auth-erro">{erroForm}</p>}

                <button type="submit" disabled={enviando}>
                  {enviando ? "Enviando..." : "Enviar interesse"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
