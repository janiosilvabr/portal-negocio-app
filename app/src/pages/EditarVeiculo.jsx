import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { VeiculoCampos, CAMPOS_INICIAIS_VEICULO } from "../components/VeiculoCampos";
import { ChecklistVistoria } from "../components/ChecklistVistoria";

export default function EditarVeiculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS_VEICULO);
  const [checklist, setChecklist] = useState([]);
  const [removidos, setRemovidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const [{ data: veiculo, error: erroVeiculo }, { data: itensChecklist }] = await Promise.all([
        supabase.from("veiculos").select("*").eq("id", id).maybeSingle(),
        supabase.from("checklist_vistoria").select("*").eq("veiculo_id", id).order("created_at"),
      ]);

      if (erroVeiculo) {
        setErro(erroVeiculo.message);
        setCarregando(false);
        return;
      }

      if (!veiculo) {
        setNaoEncontrado(true);
        setCarregando(false);
        return;
      }

      setCampos({
        marca: veiculo.marca ?? "",
        modelo: veiculo.modelo ?? "",
        versao: veiculo.versao ?? "",
        ano_fabricacao: veiculo.ano_fabricacao ?? "",
        ano_modelo: veiculo.ano_modelo ?? "",
        placa: veiculo.placa ?? "",
        km: veiculo.km ?? "",
        cor: veiculo.cor ?? "",
        combustivel: veiculo.combustivel ?? "",
        cambio: veiculo.cambio ?? "",
        preco: veiculo.preco ?? "",
        status: veiculo.status ?? "disponivel",
        descricao: veiculo.descricao ?? "",
      });
      setChecklist(itensChecklist ?? []);
      setCarregando(false);
    }

    carregar();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!campos.marca || !campos.modelo) {
      setErro("Marca e modelo são obrigatórios.");
      return;
    }

    setSalvando(true);

    const { error: erroVeiculo } = await supabase
      .from("veiculos")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (erroVeiculo) {
      setSalvando(false);
      setErro(erroVeiculo.message);
      return;
    }

    for (const itemId of removidos) {
      const { error } = await supabase.from("checklist_vistoria").delete().eq("id", itemId);
      if (error) {
        setSalvando(false);
        setErro(error.message);
        return;
      }
    }

    for (const item of checklist) {
      if (!item.item.trim()) continue;

      const dados = { item: item.item, observacao: item.observacao || null };

      const { error } = item.id
        ? await supabase.from("checklist_vistoria").update(dados).eq("id", item.id)
        : await supabase.from("checklist_vistoria").insert({ ...dados, veiculo_id: id });

      if (error) {
        setSalvando(false);
        setErro(error.message);
        return;
      }
    }

    setSalvando(false);
    navigate("/veiculos");
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
        <p className="auth-erro">Veículo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Editar veículo</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <VeiculoCampos campos={campos} onChange={setCampos} />

        <ChecklistVistoria
          itens={checklist}
          onChange={setChecklist}
          onRemoverItem={(item) => {
            if (item.id) setRemovidos((r) => [...r, item.id]);
          }}
        />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
