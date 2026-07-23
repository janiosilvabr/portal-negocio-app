import { Link } from "react-router-dom";
import { Calendar, Gauge, Fuel, Settings2, Building2 } from "lucide-react";

function formatPreco(preco) {
  if (preco == null) return "Consulte";
  return Number(preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function VeiculoCard({ veiculo: v }) {
  return (
    <div className="vitrine-card">
      <div className="vitrine-card-foto">
        {v.foto_url ? <img src={v.foto_url} alt="" /> : "Sem foto"}
      </div>
      <div className="vitrine-card-body">
        <h3>
          {v.marca} {v.modelo}
        </h3>
        {v.versao && <p className="vitrine-card-versao">{v.versao}</p>}
        <p className="vitrine-card-preco">{formatPreco(v.preco)}</p>
        <ul className="vitrine-card-specs">
          <li>
            <Calendar size={13} />
            {v.ano_fabricacao ?? "-"}/{v.ano_modelo ?? "-"}
          </li>
          <li>
            <Gauge size={13} />
            {v.km != null ? `${v.km.toLocaleString("pt-BR")} km` : "-"}
          </li>
          <li>
            <Fuel size={13} />
            {v.combustivel ?? "-"}
          </li>
          <li>
            <Settings2 size={13} />
            {v.cambio ?? "-"}
          </li>
        </ul>
        {v.empresa_nome && (
          <p className="vitrine-card-garagem">
            <Building2 size={13} />
            {v.empresa_nome}
          </p>
        )}
        <Link to={`/vitrine/${v.id}`} className="botao-link vitrine-card-detalhes">
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}
