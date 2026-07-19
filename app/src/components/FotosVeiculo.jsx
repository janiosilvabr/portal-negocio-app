export async function salvarFotosNovas(supabase, fotos, veiculoId, empresaId) {
  const novas = fotos.filter((f) => f.file);

  for (const foto of novas) {
    const extensao = foto.file.name.split(".").pop();
    const caminho = `${empresaId}/${veiculoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`;

    const { error: erroUpload } = await supabase.storage.from("fotos-veiculos").upload(caminho, foto.file);
    if (erroUpload) return erroUpload;

    const { data: publicData } = supabase.storage.from("fotos-veiculos").getPublicUrl(caminho);

    const { error: erroInsert } = await supabase.from("fotos_veiculos").insert({
      veiculo_id: veiculoId,
      url: publicData.publicUrl,
      ordem: fotos.indexOf(foto),
    });
    if (erroInsert) return erroInsert;
  }

  return null;
}

export function FotosVeiculo({ fotos, onChange, onRemoverExistente }) {
  function handleAdicionar(e) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0) return;

    const novas = arquivos.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    onChange([...fotos, ...novas]);
    e.target.value = "";
  }

  function handleRemover(index) {
    const foto = fotos[index];
    onRemoverExistente?.(foto, index);
    onChange(fotos.filter((_, i) => i !== index));
  }

  return (
    <div className="checklist">
      <div className="checklist-header">
        <h2>Fotos</h2>
        <label className="checklist-add fotos-label-upload">
          + Adicionar fotos
          <input type="file" accept="image/*" multiple onChange={handleAdicionar} hidden />
        </label>
      </div>

      {fotos.length === 0 && <p className="auth-nota">Nenhuma foto ainda.</p>}

      {fotos.length > 0 && (
        <div className="fotos-grid">
          {fotos.map((foto, index) => (
            <div className="foto-item" key={foto.id ?? foto.previewUrl}>
              <img src={foto.url ?? foto.previewUrl} alt="" />
              <button type="button" onClick={() => handleRemover(index)} className="checklist-remove">
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
