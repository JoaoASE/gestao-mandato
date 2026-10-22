# Fontes de Dados — Oráculo Gestão de Mandato

## IBGE — Censo 2022

### APIs disponíveis (sem autenticação)

| Dado | Endpoint | Status |
|---|---|---|
| População total/sexo | `/api/v3/agregados/9514/...` | ✅ Disponível |
| Cor/raça | `/api/v3/agregados/9514/...&classificacao=86[...]` | ✅ Disponível |
| Renda média domiciliar | `/api/v3/agregados/9891/.../10084` | ✅ Disponível |
| Índice de Gini | `/api/v3/agregados/9891/.../10082` | ✅ Disponível |
| PIB per capita | `/api/v3/agregados/5938/.../37` | ✅ Disponível |
| Saneamento (esgoto/água/lixo) | `/api/v3/agregados/9894/...` | ✅ Disponível |
| Taxa de analfabetismo | `/api/v3/agregados/9906/...` | ✅ Disponível |
| Mortalidade infantil | `/api/v3/agregados/9145/...` | ✅ Disponível |
| GeoJSON dos bairros | `/api/v3/malhas/municipios/3170206` | ✅ Disponível |

### Dados por setor censitário (nível bairro)

Download manual necessário:
```
https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/MG/
```
- Baixar arquivo do município 3170206
- Salvar em: `data/setores_censitarios_3170206.csv`
- Executar: `node prisma/import_ibge.js --step=setores`

---

## CNES / DataSUS — Estabelecimentos de Saúde

API pública sem autenticação:
```
https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?municipio_codigo=317020&limit=200
```

Retorna: nome, endereço, tipo, coordenadas de todas as UAIs, UBSs, UPAs, hospitais.

---

## TSE — Dados Eleitorais

Já importados via `prisma/import_tse.js`:
- Candidatos (2008–2024)
- Resultados por seção/zona
- Perfil do eleitorado por local
- Detalhes de seção eleitoral

---

## Como rodar a importação

```bash
# Tudo de uma vez
node prisma/import_ibge.js

# Por etapas
node prisma/import_ibge.js --step=municipal   # Dados IBGE municipais
node prisma/import_ibge.js --step=saude       # CNES/DataSUS
node prisma/import_ibge.js --step=geojson     # GeoJSON oficial
node prisma/import_ibge.js --step=setores     # Setores censitários (requer CSV manual)
node prisma/import_ibge.js --step=banco       # Salva no PostgreSQL
```

---

## APIs do sistema

| Endpoint | Dados |
|---|---|
| `GET /api/ibge?type=municipal` | Dados IBGE municipais consolidados |
| `GET /api/ibge?type=bairro&neighborhoodId=X` | Métricas IBGE do bairro |
| `GET /api/ibge?type=saude` | Todos os estabelecimentos de saúde |
| `GET /api/ibge?type=comparativo` | Ranking de bairros por vulnerabilidade |
| `GET /api/estatisticas` | Dados eleitorais + demandas por bairro |
| `GET /api/uais` | Filas e tempo de espera das UAIs |
| `GET /api/relatorios?type=geral` | KPIs consolidados |

---

## Dados que ainda precisam de fonte real

| Dado | Status | Solução sugerida |
|---|---|---|
| Fila UAI em tempo real | ⚠️ Mock | LAI para Prefeitura ou API Saúde+ |
| Rastreio de ônibus | ⚠️ Mock | SETTRAN Uberlândia (contato formal) |
| Vagas em creches/escolas | ⚠️ Mock | Portal da Transparência municipal |
| Índice de criminalidade por bairro | ⚠️ Mock | SSP-MG (dados por DP) |
| Obras em andamento | ⚠️ Mock | Portal de obras da Prefeitura |
