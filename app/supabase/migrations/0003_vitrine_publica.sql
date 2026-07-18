-- Vitrine pública: visitante anônimo pode ver veículos com status "disponivel"
-- de qualquer empresa, e o nome da garagem responsável (para exibir no card).
-- Não expõe empresas sem veículo disponível, nem veículos reservados/vendidos/
-- consignados de outras empresas.

create policy "publico ve veiculos disponiveis"
  on veiculos for select
  using (status = 'disponivel');

create policy "publico ve nome de empresas com veiculos disponiveis"
  on empresas for select
  using (id in (select empresa_id from veiculos where status = 'disponivel'));
