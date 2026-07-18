import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { VeiculoCampos, CAMPOS_INICIAIS_VEICULO } from "../components/VeiculoCampos";
import { ChecklistVistoria } from "../components/ChecklistVistoria";

export default function NovoVeiculo() {
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS_VEICULO);
  const [checklist, setChecklist] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

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

    const { data: veiculo, error } = await supabase
      .from("veiculos")
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      setSalvando(false);
      setErro(error.message);
      return;
    }

    const itensValidos = checklist.filter((item) => item.item.trim());
    if (itensValidos.length > 0) {
      const { error: erroChecklist } = await supabase.from("checklist_vistoria").insert(
        itensValidos.map((item) => ({
          veiculo_id: veiculo.id,
          item: item.item,
          observacao: item.observacao || null,
        }))
      );

      if (erroChecklist) {
        setSalvando(false);
        setErro(`Veículo salvo, mas o checklist falhou: ${erroChecklist.message}`);
        return;
      }
    }

    setSalvando(false);
    navigate("/veiculos");
  }

  return (
    <div className="page">
      <h1>Novo veículo</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <VeiculoCampos campos={campos} onChange={setCampos} />

        <ChecklistVistoria itens={checklist} onChange={setChecklist} />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar veículo"}
        </button>
      </form>
    </div>
  );
}
