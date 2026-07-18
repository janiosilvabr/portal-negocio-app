import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const CAMPOS_INICIAIS = {
  marca: "",
  modelo: "",
  versao: "",
  ano_fabricacao: "",
  ano_modelo: "",
  placa: "",
  km: "",
  cor: "",
  combustivel: "",
  cambio: "",
  preco: "",
  status: "disponivel",
  descricao: "",
};

export default function NovoVeiculo() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setCampos((c) => ({ ...c, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!perfil?.empresa_id) {
      setErro("Perfil da empresa ainda não carregado. Aguarde um instante e tente de novo.");
      return;
    }
    if (!campos.marca || !campos.modelo) {
      setErro("Marca e modelo são obrigatórios.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("veiculos").insert({
      empresa_id: perfil.empresa_id,
      marca: campos.marca,
      modelo: campos.modelo,
      versao: campos.versao || null,
      ano_fabricacao: campos.ano_fabricacao ? Number(campos.ano_fabricacao) : null,
      ano_modelo: campos.ano_modelo ? Number(campos.ano_modelo) : null,
      placa: campos.placa || null,
      km: campos.km ? Number(campos.km) : null,
      cor: campos.cor || null,
      combustivel: campos.combustivel || null,
      cambio: campos.cambio || null,
      preco: campos.preco ? Number(campos.preco) : null,
      status: campos.status,
      descricao: campos.descricao || null,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    navigate("/veiculos");
  }

  return (
    <div className="page">
      <h1>Novo veículo</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="marca">Marca *</label>
            <input id="marca" name="marca" value={campos.marca} onChange={handleChange} required />
          </div>

          <div>
            <label htmlFor="modelo">Modelo *</label>
            <input id="modelo" name="modelo" value={campos.modelo} onChange={handleChange} required />
          </div>

          <div>
            <label htmlFor="versao">Versão</label>
            <input id="versao" name="versao" value={campos.versao} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="placa">Placa</label>
            <input id="placa" name="placa" value={campos.placa} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="ano_fabricacao">Ano de fabricação</label>
            <input
              id="ano_fabricacao"
              name="ano_fabricacao"
              type="number"
              value={campos.ano_fabricacao}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="ano_modelo">Ano do modelo</label>
            <input
              id="ano_modelo"
              name="ano_modelo"
              type="number"
              value={campos.ano_modelo}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="km">Km</label>
            <input id="km" name="km" type="number" min="0" value={campos.km} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="cor">Cor</label>
            <input id="cor" name="cor" value={campos.cor} onChange={handleChange} />
          </div>

          <div>
            <label htmlFor="combustivel">Combustível</label>
            <select id="combustivel" name="combustivel" value={campos.combustivel} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="Flex">Flex</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Etanol">Etanol</option>
              <option value="Diesel">Diesel</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Elétrico">Elétrico</option>
              <option value="GNV">GNV</option>
            </select>
          </div>

          <div>
            <label htmlFor="cambio">Câmbio</label>
            <select id="cambio" name="cambio" value={campos.cambio} onChange={handleChange}>
              <option value="">Selecione</option>
              <option value="Manual">Manual</option>
              <option value="Automático">Automático</option>
              <option value="CVT">CVT</option>
              <option value="Automatizado">Automatizado</option>
            </select>
          </div>

          <div>
            <label htmlFor="preco">Preço (R$)</label>
            <input
              id="preco"
              name="preco"
              type="number"
              min="0"
              step="0.01"
              value={campos.preco}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={campos.status} onChange={handleChange}>
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
              <option value="consignado">Consignado</option>
            </select>
          </div>
        </div>

        <label htmlFor="descricao">Descrição</label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          value={campos.descricao}
          onChange={handleChange}
        />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar veículo"}
        </button>
      </form>
    </div>
  );
}
