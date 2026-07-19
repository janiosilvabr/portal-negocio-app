export function buildConsignacaoPayload(campos, veiculoId) {
  return {
    veiculo_id: veiculoId,
    proprietario_cliente_id: campos.proprietario_cliente_id,
    modelo_remuneracao: campos.modelo_remuneracao,
    percentual_comissao:
      campos.modelo_remuneracao === "comissao_fixa" && campos.percentual_comissao
        ? Number(campos.percentual_comissao)
        : null,
    preco_liquido_consignante:
      campos.modelo_remuneracao === "agio" && campos.preco_liquido_consignante
        ? Number(campos.preco_liquido_consignante)
        : null,
    data_inicio: campos.data_inicio || null,
    prazo_vigencia_dias: campos.prazo_vigencia_dias ? Number(campos.prazo_vigencia_dias) : 60,
    prorrogacao_automatica: campos.prorrogacao_automatica,
    laudo_cautelar_realizado: campos.laudo_cautelar_realizado,
    laudo_cautelar_apontamentos: campos.laudo_cautelar_apontamentos || null,
  };
}

export const CAMPOS_INICIAIS_CONSIGNACAO = {
  proprietario_cliente_id: "",
  modelo_remuneracao: "comissao_fixa",
  percentual_comissao: "",
  preco_liquido_consignante: "",
  data_inicio: "",
  prazo_vigencia_dias: "60",
  prorrogacao_automatica: true,
  laudo_cautelar_realizado: false,
  laudo_cautelar_apontamentos: "",
};

export function ConsignacaoCampos({ campos, onChange, clientes }) {
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    onChange({ ...campos, [name]: type === "checkbox" ? checked : value });
  }

  return (
    <div className="consignacao">
      <h2>Dados da consignação</h2>

      <div className="form-grid">
        <div>
          <label htmlFor="proprietario_cliente_id">Proprietário (consignante) *</label>
          <select
            id="proprietario_cliente_id"
            name="proprietario_cliente_id"
            value={campos.proprietario_cliente_id}
            onChange={handleChange}
          >
            <option value="">Selecione</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="modelo_remuneracao">Modelo de remuneração</label>
          <select
            id="modelo_remuneracao"
            name="modelo_remuneracao"
            value={campos.modelo_remuneracao}
            onChange={handleChange}
          >
            <option value="comissao_fixa">Comissão fixa</option>
            <option value="agio">Ágio</option>
          </select>
        </div>

        {campos.modelo_remuneracao === "comissao_fixa" && (
          <div>
            <label htmlFor="percentual_comissao">Percentual de comissão (%)</label>
            <input
              id="percentual_comissao"
              name="percentual_comissao"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={campos.percentual_comissao}
              onChange={handleChange}
            />
          </div>
        )}

        {campos.modelo_remuneracao === "agio" && (
          <div>
            <label htmlFor="preco_liquido_consignante">Preço líquido do consignante (R$)</label>
            <input
              id="preco_liquido_consignante"
              name="preco_liquido_consignante"
              type="number"
              min="0"
              step="0.01"
              value={campos.preco_liquido_consignante}
              onChange={handleChange}
            />
          </div>
        )}

        <div>
          <label htmlFor="data_inicio">Data de início</label>
          <input id="data_inicio" name="data_inicio" type="date" value={campos.data_inicio} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="prazo_vigencia_dias">Prazo de vigência (dias)</label>
          <input
            id="prazo_vigencia_dias"
            name="prazo_vigencia_dias"
            type="number"
            min="1"
            value={campos.prazo_vigencia_dias}
            onChange={handleChange}
          />
        </div>
      </div>

      <label className="checkbox-linha">
        <input
          type="checkbox"
          name="prorrogacao_automatica"
          checked={campos.prorrogacao_automatica}
          onChange={handleChange}
        />
        Prorrogação automática ao final do prazo
      </label>

      <label className="checkbox-linha">
        <input
          type="checkbox"
          name="laudo_cautelar_realizado"
          checked={campos.laudo_cautelar_realizado}
          onChange={handleChange}
        />
        Laudo de vistoria cautelar realizado na entrada
      </label>

      <label htmlFor="laudo_cautelar_apontamentos">Apontamentos do laudo cautelar</label>
      <textarea
        id="laudo_cautelar_apontamentos"
        name="laudo_cautelar_apontamentos"
        rows={2}
        placeholder='Deixe em branco (ou "sem apontamentos") se nada foi constatado'
        value={campos.laudo_cautelar_apontamentos}
        onChange={handleChange}
      />
    </div>
  );
}
