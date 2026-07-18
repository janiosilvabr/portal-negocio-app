export function ChecklistVistoria({ itens, onChange, onRemoverItem }) {
  function handleCampoChange(index, campo, valor) {
    const novos = itens.slice();
    novos[index] = { ...novos[index], [campo]: valor };
    onChange(novos);
  }

  function adicionarLinha() {
    onChange([...itens, { item: "", observacao: "" }]);
  }

  function removerLinha(index) {
    const item = itens[index];
    onRemoverItem?.(item, index);
    onChange(itens.filter((_, i) => i !== index));
  }

  return (
    <div className="checklist">
      <div className="checklist-header">
        <h2>Checklist de vistoria</h2>
        <button type="button" onClick={adicionarLinha} className="checklist-add">
          + Adicionar item
        </button>
      </div>

      {itens.length === 0 && <p className="auth-nota">Nenhum item ainda.</p>}

      {itens.map((linha, index) => (
        <div className="checklist-linha" key={linha.id ?? `novo-${index}`}>
          <input
            placeholder="Item (ex.: pneus, amortecedores)"
            value={linha.item}
            onChange={(e) => handleCampoChange(index, "item", e.target.value)}
          />
          <input
            placeholder="Observação (ex.: 40% de vida útil)"
            value={linha.observacao ?? ""}
            onChange={(e) => handleCampoChange(index, "observacao", e.target.value)}
          />
          <button type="button" onClick={() => removerLinha(index)} className="checklist-remove">
            Remover
          </button>
        </div>
      ))}
    </div>
  );
}
