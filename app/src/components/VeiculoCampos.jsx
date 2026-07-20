export const CAMPOS_INICIAIS_VEICULO = {
  marca: "",
  modelo: "",
  versao: "",
  ano_fabricacao: "",
  ano_modelo: "",
  placa: "",
  renavam: "",
  chassi: "",
  km: "",
  cor: "",
  combustivel: "",
  cambio: "",
  tipo_carroceria: "",
  preco: "",
  status: "disponivel",
  descricao: "",
};

export function VeiculoCampos({ campos, onChange }) {
  function handleChange(e) {
    const { name, value } = e.target;
    onChange({ ...campos, [name]: value });
  }

  return (
    <>
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
          <label htmlFor="renavam">Renavam</label>
          <input id="renavam" name="renavam" value={campos.renavam} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="chassi">Chassi</label>
          <input id="chassi" name="chassi" value={campos.chassi} onChange={handleChange} />
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
          <label htmlFor="tipo_carroceria">Tipo de carroceria</label>
          <select
            id="tipo_carroceria"
            name="tipo_carroceria"
            value={campos.tipo_carroceria}
            onChange={handleChange}
          >
            <option value="">Selecione</option>
            <option value="sedan">Sedã</option>
            <option value="suv">SUV</option>
            <option value="hatch">Hatch</option>
            <option value="pickup">Picape</option>
            <option value="utilitario">Utilitário</option>
            <option value="moto">Moto</option>
            <option value="outro">Outro</option>
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
      <textarea id="descricao" name="descricao" rows={4} value={campos.descricao} onChange={handleChange} />
    </>
  );
}
