import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const CAMPOS_INICIAIS = {
  tipo: "receita",
  categoria: "",
  descricao: "",
  valor: "",
  data: "",
  status: "pago",
  forma_pagamento: "",
};

export default function EditarTransacao() {
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
      .from("transacoes_financeiras")
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
            tipo: data.tipo,
            categoria: data.categoria ?? "",
            descricao: data.descricao ?? "",
            valor: data.valor,
            data: data.data,
            status: data.status,
            forma_pagamento: data.forma_pagamento ?? "",
          });
        }
        setCarregando(false);
      });
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setCampos((c) => ({ ...c, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!campos.valor) {
      setErro("Informe o valor.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("transacoes_financeiras")
      .update({
        tipo: campos.tipo,
        categoria: campos.categoria || null,
        descricao: campos.descricao || null,
        valor: Number(campos.valor),
        data: campos.data,
        status: campos.status,
        forma_pagamento: campos.forma_pagamento || null,
      })
      .eq("id", id);

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/financeiro");
  }

  async function handleExcluir() {
    const confirmado = window.confirm("Excluir esta transação? Essa ação não pode ser desfeita.");
    if (!confirmado) return;

    setErro("");
    setExcluindo(true);

    const { error } = await supabase.from("transacoes_financeiras").delete().eq("id", id);

    setExcluindo(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/financeiro");
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
        <p className="auth-erro">Transação não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Editar transação</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" value={campos.tipo} onChange={handleChange}>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>

          <div>
            <label htmlFor="categoria">Categoria</label>
            <input
              id="categoria"
              name="categoria"
              placeholder="ex.: venda, aluguel, comissão"
              value={campos.categoria}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="valor">Valor (R$) *</label>
            <input
              id="valor"
              name="valor"
              type="number"
              min="0"
              step="0.01"
              value={campos.valor}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="data">Data</label>
            <input id="data" name="data" type="date" value={campos.data} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={campos.status} onChange={handleChange}>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          <div>
            <label htmlFor="forma_pagamento">Forma de pagamento</label>
            <select id="forma_pagamento" name="forma_pagamento" value={campos.forma_pagamento} onChange={handleChange}>
              <option value="">Não informado</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="cartao_credito">Cartão de crédito</option>
              <option value="cartao_debito">Cartão de débito</option>
              <option value="transferencia">Transferência</option>
              <option value="boleto">Boleto</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <label htmlFor="descricao">Descrição</label>
        <input id="descricao" name="descricao" value={campos.descricao} onChange={handleChange} />

        {erro && <p className="auth-erro">{erro}</p>}

        <div className="form-acoes">
          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
          <button type="button" className="botao-perigo" onClick={handleExcluir} disabled={excluindo}>
            {excluindo ? "Excluindo..." : "Excluir transação"}
          </button>
        </div>
      </form>
    </div>
  );
}
