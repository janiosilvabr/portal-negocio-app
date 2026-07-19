import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { VeiculoCampos, CAMPOS_INICIAIS_VEICULO } from "../components/VeiculoCampos";
import { ChecklistVistoria } from "../components/ChecklistVistoria";
import {
  ConsignacaoCampos,
  CAMPOS_INICIAIS_CONSIGNACAO,
  buildConsignacaoPayload,
} from "../components/ConsignacaoCampos";
import { FotosVeiculo, salvarFotosNovas } from "../components/FotosVeiculo";
import { CustosVeiculo } from "../components/CustosVeiculo";
import { TermometroMargem } from "../components/TermometroMargem";

export default function EditarVeiculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { perfil } = useAuth();
  const [campos, setCampos] = useState(CAMPOS_INICIAIS_VEICULO);
  const [checklist, setChecklist] = useState([]);
  const [removidos, setRemovidos] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [fotosRemovidas, setFotosRemovidas] = useState([]);
  const [custos, setCustos] = useState([]);
  const [custosRemovidos, setCustosRemovidos] = useState([]);
  const [consignacao, setConsignacao] = useState(CAMPOS_INICIAIS_CONSIGNACAO);
  const [consignacaoId, setConsignacaoId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const [
        { data: veiculo, error: erroVeiculo },
        { data: itensChecklist },
        { data: consignacaoExistente },
        { data: listaClientes },
        { data: fotosExistentes },
        { data: custosExistentes },
      ] = await Promise.all([
        supabase.from("veiculos").select("*").eq("id", id).maybeSingle(),
        supabase.from("checklist_vistoria").select("*").eq("veiculo_id", id).order("created_at"),
        supabase.from("consignacoes").select("*").eq("veiculo_id", id).maybeSingle(),
        supabase.from("clientes").select("id, nome").order("nome"),
        supabase.from("fotos_veiculos").select("*").eq("veiculo_id", id).order("ordem"),
        supabase.from("custos_veiculo").select("*").eq("veiculo_id", id).order("data"),
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
        renavam: veiculo.renavam ?? "",
        chassi: veiculo.chassi ?? "",
        km: veiculo.km ?? "",
        cor: veiculo.cor ?? "",
        combustivel: veiculo.combustivel ?? "",
        cambio: veiculo.cambio ?? "",
        preco: veiculo.preco ?? "",
        status: veiculo.status ?? "disponivel",
        descricao: veiculo.descricao ?? "",
      });
      setChecklist(itensChecklist ?? []);
      setClientes(listaClientes ?? []);
      setFotos(fotosExistentes ?? []);
      setCustos(custosExistentes ?? []);

      if (consignacaoExistente) {
        setConsignacaoId(consignacaoExistente.id);
        setConsignacao({
          proprietario_cliente_id: consignacaoExistente.proprietario_cliente_id ?? "",
          modelo_remuneracao: consignacaoExistente.modelo_remuneracao ?? "comissao_fixa",
          percentual_comissao: consignacaoExistente.percentual_comissao ?? "",
          preco_liquido_consignante: consignacaoExistente.preco_liquido_consignante ?? "",
          data_inicio: consignacaoExistente.data_inicio ?? "",
          prazo_vigencia_dias: consignacaoExistente.prazo_vigencia_dias ?? "60",
          prorrogacao_automatica: consignacaoExistente.prorrogacao_automatica ?? true,
          laudo_cautelar_realizado: consignacaoExistente.laudo_cautelar_realizado ?? false,
          laudo_cautelar_apontamentos: consignacaoExistente.laudo_cautelar_apontamentos ?? "",
        });
      }

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
    if (campos.status === "consignado" && !consignacao.proprietario_cliente_id) {
      setErro("Selecione o proprietário (consignante) para um veículo consignado.");
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
        renavam: campos.renavam || null,
        chassi: campos.chassi || null,
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

    if (campos.status === "consignado") {
      const payload = buildConsignacaoPayload(consignacao, id);

      const { error: erroConsignacao } = consignacaoId
        ? await supabase.from("consignacoes").update(payload).eq("id", consignacaoId)
        : await supabase.from("consignacoes").insert(payload);

      if (erroConsignacao) {
        setSalvando(false);
        setErro(erroConsignacao.message);
        return;
      }
    }

    for (const fotoId of fotosRemovidas) {
      const { error } = await supabase.from("fotos_veiculos").delete().eq("id", fotoId);
      if (error) {
        setSalvando(false);
        setErro(error.message);
        return;
      }
    }

    const erroFotos = await salvarFotosNovas(supabase, fotos, id, perfil.empresa_id);
    if (erroFotos) {
      setSalvando(false);
      setErro(erroFotos.message);
      return;
    }

    for (const custoId of custosRemovidos) {
      const { error } = await supabase.from("custos_veiculo").delete().eq("id", custoId);
      if (error) {
        setSalvando(false);
        setErro(error.message);
        return;
      }
    }

    for (const custo of custos) {
      if (!custo.valor) continue;

      const dados = {
        descricao: custo.descricao || null,
        categoria: custo.categoria || "outro",
        valor: Number(custo.valor),
        data: custo.data || new Date().toISOString().slice(0, 10),
      };

      const { error } = custo.id
        ? await supabase.from("custos_veiculo").update(dados).eq("id", custo.id)
        : await supabase.from("custos_veiculo").insert({ ...dados, veiculo_id: id });

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

        {campos.status === "consignado" && (
          <ConsignacaoCampos campos={consignacao} onChange={setConsignacao} clientes={clientes} />
        )}

        <FotosVeiculo
          fotos={fotos}
          onChange={setFotos}
          onRemoverExistente={(foto) => {
            if (foto.id) setFotosRemovidas((r) => [...r, foto.id]);
          }}
        />

        <CustosVeiculo
          itens={custos}
          onChange={setCustos}
          onRemoverItem={(custo) => {
            if (custo.id) setCustosRemovidos((r) => [...r, custo.id]);
          }}
        />

        {erro && <p className="auth-erro">{erro}</p>}

        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <TermometroMargem preco={campos.preco} custos={custos} comissaoPercentual={perfil?.comissao_percentual} />

      {campos.status === "consignado" && consignacaoId && (
        <p className="auth-nota" style={{ marginTop: 16 }}>
          <Link to={`/documentos/gerar?consignacao_id=${consignacaoId}`}>
            Gerar contrato de consignação
          </Link>
        </p>
      )}
    </div>
  );
}
