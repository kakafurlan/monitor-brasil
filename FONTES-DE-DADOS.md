# Auditoria de dados — o que dá para puxar por API

Legenda: ✔ confirmado por consulta real (com CORS = dá para buscar direto do navegador) · ◐ só pelo coletor ou com
ressalva · ✖ não é possível hoje.

## Resumo por tema

| Tema | O que o monitor mostra | Fonte | Acesso | Frequência |
|---|---|---|---|---|
| **Pix no Brasil** | **total desde o lançamento e total de cada ano** (transações e valor); participação do Pix entre as formas de pagamento; série mensal (recolhida em “Ver mais dados”) | BCB — Olinda `MPV_DadosAbertos` | ✔ CORS | mensal / trimestral |
| **Pix no mundo** | transações/ano por sistema (SPI/Pix, UPI, FPS, SPEI, NPP, Zengin, TIPS, FedNow) e por habitante | BIS (CPMI) + Banco Mundial | ✔ CORS | anual |
| **Corrosão do Real** | poder de compra desde 1944; dólar (PTAX); salário mínimo desde 1940; M1/M2 | BCB SGS (IPCA, IGP-DI, PTAX, 1619, M1/M2) + Ipeadata | ✔ / ◐ Ipeadata | mensal / diária |
| **Inflação acumulada** | IPCA, INPC, IGP-M, IGP-DI, IPCA-15, núcleos, livres × monitorados; por grupo, subitem e região (16 áreas); Focus | BCB SGS + IBGE SIDRA + Olinda Expectativas | ✔ CORS | mensal / semanal |
| **Endividamento das famílias** | endividamento, comprometimento da renda (juros × amortização), inadimplência, crédito, desocupação, IBC-Br | BCB SGS | ✔ CORS | mensal |
| **Juros do cartão** | rotativo, parcelado, cheque especial, pessoal, veículos; saldos; inadimplência; **taxa de cada banco** | BCB SGS + Olinda `taxaJuros` | ✔ CORS | mensal / semanal |
| **Dívida do governo** | dívida bruta e líquida (% PIB e R$), juros, primário, nominal, reservas; ranking mundial | BCB SGS + FMI DataMapper | ✔ SGS / ◐ FMI | mensal / semestral |
| **E se tivesse comprado Bitcoin** | preço em R$ desde 2010 (coletor) ou 2011 (navegador), simulador, quedas, janelas, oferta, rede ao vivo | blockchain.com (coletor) ou Bitstamp (navegador) × PTAX; Binance; mempool.space | ◐ histórico / ✔ ao vivo | diária / tempo real |
| **História do Real (museu)** | 9 moedas, fatores de conversão, índice de preços 1944→hoje, inflação mundial 1960→hoje | atos legais + SGS + Banco Mundial | ✔ | — |

## O que o navegador busca sozinho (conferido em 02/11/2026, de um navegador comum)

| Fonte | Responde ao navegador? | Uso no modo sem coletor |
|---|---|---|
| BCB SGS (`api.bcb.gov.br`) | ✔ | as 63 séries |
| BCB Olinda — meios de pagamento | ✔ | Pix mensal e trimestral |
| IBGE (`servicodados.ibge.gov.br`) | ✔ | IPCA por grupo, item e região; população |
| Banco Mundial | ✔ | inflação por país, população |
| BIS (`stats.bis.org`, SDMX-JSON) | ✔ | pagamentos instantâneos por sistema |
| Ipeadata (https) | ✔ | salário mínimo desde 1940 |
| Bitstamp (OHLC diário) | ✔ | Bitcoin em US$ desde ago/2011 (× PTAX = R$) |
| Foxbit, Coinbase, Kraken, CoinGecko (365 dias), AwesomeAPI, mempool.space | ✔ | cotação ao vivo, dólar, rede Bitcoin |
| FMI DataMapper | ✖ | só pelo coletor (mapa da dívida mundial) |
| blockchain.info (mesmo com `cors=true`), CryptoCompare, Binance REST | ✖ | não usados no navegador |
| Olinda — Expectativas (Focus) e `taxaJuros` | ◐ | só pelo coletor (aparecem em “Ver mais dados”) |

## O que **não** dá (e como o monitor lida com isso)

- **Ibovespa e ouro:** o BC parou de publicar essas séries em 2019; não há fonte aberta estável com CORS. Não exibidos.
- **Pix em tempo real / por segundo:** só existe estatística mensal (chaves, diária). O contador “Pix por segundo” é uma
  **estimativa** (média do último mês) e está sempre rotulado.
- **UPI (Índia) mensal:** o site do NPCI bloqueia acessos automatizados; usamos o dado anual do BIS.
- **Tesouro Direto, cesta básica (DIEESE):** sem API aberta com CORS.
- **Binance REST:** bloqueia IPs dos EUA (onde rodam os coletores); por isso só o WebSocket, no navegador.

## Endpoints usados (todos públicos)

```text
BCB SGS        https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{n}?formato=json
               https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=dd/mm/aaaa&dataFinal=dd/mm/aaaa
BCB Olinda     https://olinda.bcb.gov.br/olinda/servico/{Pix_DadosAbertos|MPV_DadosAbertos|taxaJuros|Expectativas}/versao/{v}/odata/
IBGE SIDRA     https://servicodados.ibge.gov.br/api/v3/agregados/7060/…   (IPCA)   ·   …/agregados/6579/…   (população)
Ipeadata       https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='MTE12_SALMIN12')
Banco Mundial  https://api.worldbank.org/v2/country/all/indicator/{FP.CPI.TOTL.ZG|SP.POP.TOTL}
FMI            https://www.imf.org/external/datamapper/api/v1/{GGXWDG_NGDP|PCPIPCH}
BIS            https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CPMI_SYSTEMS/1.0/…   (Accept: application/vnd.sdmx.data+json;version=1.0.0)
blockchain.com https://api.blockchain.info/charts/market-price?timespan=all&format=json&sampled=false   (Accept-Language: en)
Binance (WS)   wss://stream.binance.com:9443/ws/btcbrl@miniTicker
AwesomeAPI     https://economia.awesomeapi.com.br/json/last/USD-BRL
mempool.space  https://mempool.space/api/{blocks/tip/height|v1/fees/recommended|v1/prices|v1/difficulty-adjustment}
```

Séries SGS usadas (63): veja a tabela “Catálogo de séries” na aba **Dados e fontes** ou `scripts/sources.mjs`.

## Armadilhas encontradas (e já tratadas no coletor)

1. **Olinda devolve “o mês e todos os seguintes”**: o parâmetro de mês não filtra. O coletor sempre usa
   `$filter=AnoMes eq AAAAMM` e confere o mês de cada linha.
2. **Duas contagens oficiais de Pix** (meios de pagamento × SPI liquidadas): diferem poucos por cento; o site usa o total
   nas séries mensais e o SPI nas aberturas por perfil, e avisa na aba Pix.
3. **Séries diárias do SGS** só aceitam janelas de até 10 anos: o coletor busca em janelas e remonta o histórico.
4. **Datas futuras pré-preenchidas** (meta Selic, salário mínimo): descartadas.
5. **Valores como texto** (`"0.52"`) e unidades diferentes (mil, R$ milhões, US$ milhões): normalizados.
6. **Moedas antigas**: PTAX antes de 1994 e salário mínimo estão na moeda da época; convertidos pelos fatores oficiais.
7. **blockchain.com** exige `Accept-Language: en`; **BIS** exige o `Accept` de SDMX-JSON.
8. **Olinda tem partida a frio** (até ~10 s) e o **CKAN** do dados abertos limita rajadas: o coletor usa novas tentativas com espera.
9. **SGS `ultimos/N` só aceita N de 1 a 99**; histórico longo exige a consulta completa (mensal) ou janelas de datas (diárias).
10. **Salário mínimo (SGS 1619) vem na moeda da época antes de jul/1994** (ex.: CR$ 147.627 em jun/1994, R$ 64,79 em jul/1994);
    o Ipeadata, ao contrário, já publica tudo em reais atuais (1940 ≈ 8,7 × 10⁻¹⁴).
11. **Taxas por instituição (`taxaJuros`)**: nos parâmetros o segmento é “Pessoa Física”, nos dados é “PESSOA FÍSICA” (caixa alta) —
    o filtro precisa usar a caixa alta. Valores muito baixos de algumas instituições são dados informados por elas.
12. **Pix por setor (CNAE)** traz “Pessoa fisica” como se fosse um setor; o coletor separa. **DICT** conta *usuários* com chave
    (~188 mi), não chaves — o total de chaves vem de `ChavesPix`.
13. **IPCA por item (IBGE/SIDRA)**: grupos, subgrupos, itens e subitens vêm misturados; o nível é o tamanho do prefixo numérico do nome
    (1, 2, 4, 7 dígitos).
14. **Falha parcial não derruba o site**: se uma fonte falha, o coletor mantém os dados anteriores dela e registra o erro
   em `data/manifest.json` (visível na aba Dados e fontes).

## Convenções de cálculo

- **Índice de preços:** IGP-DI (1944–1979) encadeado ao IPCA (desde 1980). Correção do **início** do mês de origem
  até o **último mês divulgado**.
- **Moedas:** fatores de conversão derivados dos atos legais — R$ 1 = CR$ 2.750; CR$ 1 = Cr$ 1.000; Cz$/NCz$/NCr$ 1 = 1.000
  da anterior; trocas de nome 1:1 — somando **2,75 × 10¹⁵ mil-réis por real**.
- **Bitcoin em reais:** preço em US$ (coletor: blockchain.com, desde 2010; navegador: Bitstamp, desde 2011) × PTAX de fim de mês; ao vivo, Binance BTC/BRL.
- **Estimativas rotuladas:** juros do governo por segundo = juros nominais 12 m (% PIB) × PIB 12 m ÷ segundos do ano;
  Pix por segundo = transações do último mês ÷ segundos do mês.

## Museu do Real: política de conteúdo

- Ilustrações próprias (SVG), legendadas como tal. Nenhuma foto ou capa de jornal de terceiros é embutida; elas entram pelo
  acervo (`assets/museu/acervo.js`), com crédito e licença.
- Texto de lei (ato oficial, domínio público) pode ser citado na íntegra — a sala do confisco reproduz os arts. 5º, 6º e 9º da
  Lei 8.024/1990 conforme o Planalto.
- Manchete: uma só (Jornal do Brasil, 17/03/1990), curta, com a fonte e o link para a Hemeroteca Digital (capa original).
- Todo número de inflação vem da série oficial carregada no site; o texto estático só tem datas e fatos conferidos.
