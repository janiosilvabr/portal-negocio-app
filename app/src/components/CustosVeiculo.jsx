const CATEGORIAS = [
  { value: "aquisicao", label: "Aquisição" },
  { value: "mecanica", label: "Mecânica" },
  { value: "estetica", label: "Estética" },
  { value: "outro", label: "Outro" },
];

export function CustosVeiculo({ itens, onChange, onRemoverItem }) {
  function handleCampoChange(index, campo, valor) {
    const novos = itens.slice();
    novos[index] = { ...novos[index], [campo]: valor };
    onChange(novos);
  }

  function adicionarLinha() {
    onChange([...itens, { descricao: "", categoria: "outro", valor: "", data: "" }]);
  }

  function removerLinha(index) {
    const item = itens[index];
    onRemoverItem?.(item, index);
    onChange(itens.filter((_, i) => i !== index));
  }

  return (
    <div className="checklist">
      <div className="checklist-header">
        <h2>Custos do veículo</h2>
        <button type="button" onClick={adicionarLinha} className="checklist-add">
          + Adicionar custo
        </button>
      </div>

      {itens.length === 0 && <p className="auth-nota">Nenhum custo lançado ainda.</p>}

      {itens.map((linha, index) => (
        <div className="custo-linha" key={linha.id ?? `novo-${index}`}>
          <input
            placeholder="Descrição"
            value={linha.descricao ?? ""}
            onChange={(e) => handleCampoChange(index, "descricao", e.target.value)}
          />
          <select
            value={linha.categoria ?? "outro"}
            onChange={(e) => handleCampoChange(index, "categoria", e.target.value)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor (R$)"
            value={linha.valor ?? ""}
            onChange={(e) => handleCampoChange(index, "valor", e.target.value)}
          />
          <input
            type="date"
            value={linha.data ?? ""}
            onChange={(e) => handleCampoChange(index, "data", e.target.value)}
          />
          <button type="button" onClick={() => removerLinha(index)} className="checklist-remove">
            Remover
          </button>
        </div>
      ))}
    </div>
  );
}
