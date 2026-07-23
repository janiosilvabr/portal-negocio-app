import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const CAMPOS_INICIAIS = {
  nome: "",
  telefone: "",
  email: "",
  cpf: "",
  rg: "",
  estado_civil: "",
  regime_bens: "",
  uniao_estavel_comprovada: false,
  conjuge_nome: "",
  conjuge_cpf: "",
  endereco: "",
};

export default function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setErro(error.message);
        } else if (!data) {
          setNaoEncontrado(true);
        } else {
          setCampos({
            nome: data.nome ?? "",
            telefone: data.telefone ?? "",
            email: data.email ?? "",
            cpf: data.cpf ?? "",
            rg: data.rg ?? "",
            estado_civil: data.estado_civil ?? "",
            regime_bens: data.regime_bens ?? "",
            uniao_estavel_comprovada: data.uniao_estavel_comprovada ?? false,
            conjuge_nome: data.conjuge_nome ?? "",
            conjuge_cpf: data.conjuge_cpf ?? "",
            endereco: data.endereco ?? "",
          });
        }
        setCarregando(false);
      });
  }, [id]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setCampos((c) => ({ ...c, [name]: type === "checkbox" ? checked : value }));
  }

  const precisaConjuge = campos.estado_civil === "casado" || campos.estado_civil === "uniao_estavel";

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!campos.nome) {
      setErro("Nome é obrigatório.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("clientes")
      .update({
        nome: campos.nome,
        telefone: campos.telefone || null,
        email: campos.email || null,
        cpf: campos.cpf || null,
        rg: campos.rg || null,
        estado_civil: campos.estado_civil || null,
        regime_bens: campos.estado_civil === "casado" ? campos.regime_bens || null : null,
        uniao_estavel_comprovada: campos.estado_civil === "uniao_estavel" ? campos.uniao_estavel_comprovada : false,
        conjuge_nome: precisaConjuge ? campos.conjuge_nome || null : null,
        conjuge_cpf: precisaConjuge ? campos.conjuge_cpf || null : null,
        endereco: campos.endereco || null,
      })
      .eq("id", id);

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/clientes");
  }

  async function handleExcluir() {
    const confirmado = window.confirm(`Excluir o cliente ${campos.nome}? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    setErro("");
    setExcluindo(true);

    const { error } = await supabase.from("clientes").delete().eq("id", id);

    setExcluindo(false);

    if (error) {
      setErro(
        error.message.includes("foreign key")
          ? "Não é possível excluir: este cliente está vinculado a um negócio ou lead. Remova esses vínculos primeiro."
          : error.message
      );
      return;
    }

    navigate("/clientes");
  }

  if (carregando) {
    return (
      <div className="page">
        <p>Carregando...</p>
      </div>
    );
  }

  if (naoEncontrado) {
    return (
      <div className="page">
        <p className="auth-erro">Cliente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Editar cliente</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="nome">Nome *</label>
            <input id="nome" name="nome" value={campos.nome} onChange={handleChange} required />
          </div>

          <div>
            <label htmlFor="cpf">CPF</label>
            <input id="cpf" name="cpf" value={campos.cpf} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="rg">RG</label>
            <input id="rg" name="rg" value={campos.rg} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="telefone">Telefone</label>
            <input id="telefone" name="telefone" value={campos.telefone} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" value={campos.email} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="estado_civil">Estado civil</label>
            <select id="estado_civil" name="estado_civil" value={campos.estado_civil} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="solteiro">Solteiro(a)</option>
              <option value="casado">Casado(a)</option>
              <option value="uniao_estavel">União estável</option>
              <option value="separado">Separado(a)</option>
              <option value="divorciado">Divorciado(a)</option>
              <option value="viuvo">Viúvo(a)</option>
            </select>
          </div>

          {campos.estado_civil === "casado" && (
            <div>
              <label htmlFor="regime_bens">Regime de bens</label>
              <select id="regime_bens" name="regime_bens" value={campos.regime_bens} onChange={handleChange}>
                <option value="">Selecione</option>
                <option value="comunhao_universal">Comunhão universal</option>
                <option value="comunhao_parcial">Comunhão parcial</option>
                <option value="separacao_total">Separação total</option>
              </select>
            </div>
          )}
        </div>

        {campos.estado_civil === "uniao_estavel" && (
          <label className="checkbox-linha">
            <input
              type="checkbox"
              name="uniao_estavel_comprovada"
              checked={campos.uniao_estavel_comprovada}
              onChange={handleChange}
            />
            União estável comprovada (contrato ou declaração com firma reconhecida em cartório)
          </label>
        )}

        {precisaConjuge && (
          <div className="form-grid">
            <div>
              <label htmlFor="conjuge_nome">Nome do cônjuge/companheiro(a)</label>
              <input
                id="conjuge_nome"
                name="conjuge_nome"
                value={campos.conjuge_nome}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="conjuge_cpf">CPF do cônjuge/companheiro(a)</label>
              <input id="conjuge_cpf" name="conjuge_cpf" value={campos.conjuge_cpf} onChange={handleChange} />
            </div>
          </div>
        )}

        <label htmlFor="endereco">Endereço</label>
        <input id="endereco" name="endereco" value={campos.endereco} onChange={handleChange} />

        {erro && <p className="auth-erro">{erro}</p>}

        <div className="form-acoes">
          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
          <button type="button" className="botao-perigo" onClick={handleExcluir} disabled={excluindo}>
            {excluindo ? "Excluindo..." : "Excluir cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
