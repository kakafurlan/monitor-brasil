/**
 * CATÁLOGO DE FONTES — única fonte de verdade do projeto.
 * Tudo aqui foi testado ao vivo, de um navegador real, em 02/11/2026.
 * O coletor (collect.mjs) lê este arquivo; o site mostra o catálogo na aba "Dados".
 *
 * Para trocar/adicionar uma série do Banco Central, edite a tabela SGS.
 * Formato: chave: [código, nome PT, nome EN, unidade, frequência ("m" mensal | "d" diária), opção]
 */

export const SGS = {
  // ---- Preços e inflação ----
  ipca:       [433,   "IPCA — variação mensal", "IPCA — monthly change", "% a.m.", "m"],
  ipca12:     [13522, "IPCA — acumulado em 12 meses", "IPCA — 12-month change", "%", "m"],
  inpc:       [188,   "INPC — variação mensal", "INPC — monthly change", "% a.m.", "m"],
  igpm:       [189,   "IGP-M — variação mensal", "IGP-M — monthly change", "% a.m.", "m"],
  igpdi:      [190,   "IGP-DI — variação mensal (desde 1944)", "IGP-DI — monthly change (since 1944)", "% a.m.", "m"],
  ipca15:     [7478,  "IPCA-15 — variação mensal", "IPCA-15 — monthly change", "% a.m.", "m"],
  ipcaAdm:    [4449,  "IPCA — preços monitorados", "IPCA — administered prices", "% a.m.", "m"],
  ipcaLivres: [11428, "IPCA — itens livres", "IPCA — market-set items", "% a.m.", "m"],
  coreMA:     [11426, "IPCA — núcleo por médias aparadas", "IPCA — trimmed-mean core", "% a.m.", "m"],
  coreDP:     [16122, "IPCA — núcleo de dupla ponderação", "IPCA — double-weighted core", "% a.m.", "m"],
  // ---- Juros e câmbio ----
  selicMeta:  [432,   "Meta Selic (Copom)", "Selic target (Copom)", "% a.a.", "d", { step: true }],
  selicMes:   [4189,  "Selic acumulada no mês, anualizada", "Selic accumulated in the month, annualized", "% a.a.", "m"],
  cdiMes:     [4391,  "CDI acumulado no mês", "CDI accumulated in the month", "% a.m.", "m"],
  ptax:       [1,     "Dólar comercial (PTAX venda)", "US dollar (PTAX selling rate)", "R$/US$", "d", { start: "28/11/1984", keepDays: 900 }],
  icr:        [11752, "Taxa de câmbio real efetiva (IPCA)", "Real effective exchange rate (IPCA)", "índice", "m"],
  // ---- Dívida pública ----
  dbggPct:    [13762, "Dívida bruta do governo geral — % do PIB", "General government gross debt — % of GDP", "% do PIB", "m"],
  dbggBRL:    [13761, "Dívida bruta do governo geral — saldo", "General government gross debt — stock", "R$ milhões", "m"],
  dlspPct:    [4513,  "Dívida líquida do setor público — % do PIB", "Net public sector debt — % of GDP", "% do PIB", "m"],
  dlspBRL:    [4478,  "Dívida líquida do setor público — saldo", "Net public sector debt — stock", "R$ milhões", "m"],
  nominal12:  [5727,  "Resultado nominal, 12 meses (déficit +)", "Nominal balance, 12 months (deficit +)", "% do PIB", "m"],
  juros12:    [5760,  "Juros nominais, 12 meses", "Nominal interest, 12 months", "% do PIB", "m"],
  primario12: [5793,  "Resultado primário, 12 meses (déficit +)", "Primary balance, 12 months (deficit +)", "% do PIB", "m"],
  reservas:   [13621, "Reservas internacionais (conceito caixa)", "International reserves (cash concept)", "US$ milhões", "d", { start: "02/01/2006", keepDays: 120, monthEnd: true }],
  // ---- Famílias ----
  endiv:      [29037, "Endividamento das famílias (dívida ÷ renda de 12 meses)", "Household debt (debt ÷ 12-month income)", "% da renda", "m"],
  endivExHab: [29038, "Endividamento das famílias, exceto habitacional", "Household debt, excluding mortgages", "% da renda", "m"],
  comprom:    [29034, "Comprometimento de renda com a dívida (dessazonalizado)", "Income committed to debt service (seasonally adj.)", "% da renda", "m"],
  compromEx:  [29035, "Comprometimento de renda, exceto habitacional", "Income committed to debt service, excl. mortgages", "% da renda", "m"],
  compromJur: [29033, "Comprometimento de renda — só juros", "Income committed — interest only", "% da renda", "m"],
  compromAmo: [29036, "Comprometimento de renda — só amortização", "Income committed — principal only", "% da renda", "m"],
  inadTotal:  [21082, "Inadimplência — carteira total", "Delinquency — total portfolio", "%", "m"],
  inadPJ:     [21083, "Inadimplência — pessoas jurídicas", "Delinquency — companies", "%", "m"],
  inadPF:     [21084, "Inadimplência — pessoas físicas", "Delinquency — individuals", "%", "m"],
  inadCartRot:[21127, "Inadimplência — cartão rotativo (PF)", "Delinquency — revolving card (individuals)", "%", "m"],
  inadCartPar:[21128, "Inadimplência — cartão parcelado (PF)", "Delinquency — installment card (individuals)", "%", "m"],
  inadCartTot:[21129, "Inadimplência — cartão de crédito total (PF)", "Delinquency — credit card total (individuals)", "%", "m"],
  inadCheque: [21113, "Inadimplência — cheque especial (PF)", "Delinquency — overdraft (individuals)", "%", "m"],
  // ---- Crédito: saldos ----
  credTotal:  [20539, "Saldo da carteira de crédito — total", "Credit portfolio — total", "R$ milhões", "m"],
  credPJ:     [20540, "Saldo da carteira de crédito — pessoas jurídicas", "Credit portfolio — companies", "R$ milhões", "m"],
  credPF:     [20541, "Saldo da carteira de crédito — pessoas físicas", "Credit portfolio — individuals", "R$ milhões", "m"],
  cartSaldoRot:[20587,"Saldo do cartão rotativo (PF)", "Revolving card balance (individuals)", "R$ milhões", "m"],
  cartSaldoPar:[20588,"Saldo do cartão parcelado (PF)", "Installment card balance (individuals)", "R$ milhões", "m"],
  cartSaldoAvi:[20589,"Saldo do cartão à vista (PF)", "Pay-in-full card balance (individuals)", "R$ milhões", "m"],
  cartSaldoTot:[20590,"Saldo do cartão de crédito total (PF)", "Credit card balance, total (individuals)", "R$ milhões", "m"],
  cartConcRot:[20679, "Concessões do cartão rotativo (PF)", "Revolving card new credit (individuals)", "R$ milhões", "m"],
  cartConcTot:[20682, "Concessões do cartão de crédito total (PF)", "Credit card new credit, total (individuals)", "R$ milhões", "m"],
  // ---- Crédito: juros ----
  jurosTotal: [20714, "Taxa média de juros — crédito total", "Average interest rate — total credit", "% a.a.", "m"],
  jurosPF:    [20716, "Taxa média de juros — pessoas físicas", "Average interest rate — individuals", "% a.a.", "m"],
  jurosLivrePF:[20740,"Taxa média de juros — recursos livres, PF", "Average interest rate — market-rate credit, individuals", "% a.a.", "m"],
  jurosCheque:[20741, "Juros do cheque especial (PF)", "Overdraft interest rate (individuals)", "% a.a.", "m"],
  jurosPessoal:[20742,"Juros do crédito pessoal não consignado (PF)", "Personal loan interest rate, non-payroll (individuals)", "% a.a.", "m"],
  jurosVeic:  [20749, "Juros da aquisição de veículos (PF)", "Auto loan interest rate (individuals)", "% a.a.", "m"],
  jurosCartRot:[22022,"Juros do cartão de crédito rotativo (PF)", "Revolving credit card interest rate (individuals)", "% a.a.", "m"],
  jurosCartPar:[22023,"Juros do cartão de crédito parcelado (PF)", "Installment credit card interest rate (individuals)", "% a.a.", "m"],
  jurosCartTot:[22024,"Juros do cartão de crédito total (PF)", "Credit card interest rate, total (individuals)", "% a.a.", "m"],
  spreadPF:   [20785, "Spread bancário médio (PF)", "Average bank spread (individuals)", "p.p.", "m"],
  iccPF:      [25353, "Indicador de Custo do Crédito (ICC) — PF", "Credit Cost Indicator (ICC) — individuals", "% a.a.", "m"],
  // ---- Moeda e atividade ----
  m1:         [27791, "Meios de pagamento — M1", "Money supply — M1", "R$ mil", "m"],
  m2:         [27810, "Meios de pagamento amplos — M2", "Broad money — M2", "R$ mil", "m"],
  ibcbr:      [24364, "IBC-Br (dessazonalizado)", "IBC-Br activity index (seasonally adj.)", "índice", "m"],
  desemprego: [24369, "Taxa de desocupação (PNAD Contínua)", "Unemployment rate (PNAD Contínua)", "%", "m"],
  pibMes:     [4380,  "PIB mensal, valores correntes", "Monthly GDP, current prices", "R$ milhões", "m"],
  pib12:      [4382,  "PIB acumulado em 12 meses, valores correntes", "GDP, 12-month sum, current prices", "R$ milhões", "m"],
  salMin:     [1619,  "Salário mínimo", "Minimum wage", "R$", "m", { clipFuture: true }],
};

/** Catálogo "humano" para a aba Dados (além do SGS, que é gerado da tabela acima). */
export const PROVIDERS = [
  { id: "sgs", group: "BCB", name: "Banco Central — SGS (séries temporais)", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados", doc: "https://www3.bcb.gov.br/sgspub", cadence: { pt: "diária / mensal", en: "daily / monthly" }, cors: true, note: { pt: "Séries diárias: janela máxima de 10 anos. Algumas séries trazem datas futuras pré-preenchidas (Selic meta, salário mínimo).", en: "Daily series: 10-year maximum window. Some series carry pre-filled future dates (Selic target, minimum wage)." } },
  { id: "olinda-pix", group: "BCB", name: "Banco Central — Pix (Olinda)", url: "https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/", doc: "https://dadosabertos.bcb.gov.br/dataset/pix", cadence: { pt: "mensal", en: "monthly" }, cors: true, note: { pt: "O parâmetro de mês devolve esse mês e todos os seguintes; o coletor filtra por AnoMes.", en: "The month parameter returns that month and every later one; the collector filters by AnoMes." } },
  { id: "olinda-mpv", group: "BCB", name: "Banco Central — Meios de pagamento (Olinda)", url: "https://olinda.bcb.gov.br/olinda/servico/MPV_DadosAbertos/versao/v1/odata/", doc: "https://dadosabertos.bcb.gov.br/dataset/estatisticas-de-meios-de-pagamento", cadence: { pt: "mensal / trimestral", en: "monthly / quarterly" }, cors: true, note: { pt: "Pix total inclui transferências dentro do mesmo banco; unidades: milhares e R$ milhões.", en: "Total Pix includes on-us transfers; units: thousands and R$ millions." } },
  { id: "olinda-juros", group: "BCB", name: "Banco Central — Taxas de juros por instituição (Olinda)", url: "https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/", doc: "https://www.bcb.gov.br/estatisticas/taxasjurosdiarias", cadence: { pt: "semanal", en: "weekly" }, cors: true, note: { pt: "Janelas semanais; a tabela mensal cobre só financiamento imobiliário.", en: "Weekly windows; the monthly table covers mortgages only." } },
  { id: "olinda-focus", group: "BCB", name: "Banco Central — Boletim Focus (Olinda)", url: "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/", doc: "https://www.bcb.gov.br/publicacoes/focus", cadence: { pt: "semanal (segunda-feira)", en: "weekly (Mondays)" }, cors: true },
  { id: "ibge", group: "IBGE", name: "IBGE — SIDRA / Agregados (IPCA, população)", url: "https://servicodados.ibge.gov.br/api/v3/agregados/", doc: "https://servicodados.ibge.gov.br/api/docs/agregados", cadence: { pt: "mensal", en: "monthly" }, cors: true },
  { id: "ipeadata", group: "IPEA", name: "Ipeadata — salário mínimo desde 1940", url: "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='MTE12_SALMIN12')", doc: "https://www.ipeadata.gov.br", cadence: { pt: "mensal", en: "monthly" }, cors: true },
  { id: "worldbank", group: "World", name: "Banco Mundial — inflação e população por país", url: "https://api.worldbank.org/v2/", doc: "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589", cadence: { pt: "anual", en: "annual" }, cors: true },
  { id: "imf", group: "World", name: "FMI — Fiscal Monitor / WEO (dívida e inflação, com projeções)", url: "https://www.imf.org/external/datamapper/api/v1/", doc: "https://www.imf.org/external/datamapper/api/help", cadence: { pt: "semestral", en: "semiannual" }, cors: false, note: { pt: "Sem CORS: só o coletor busca.", en: "No CORS: only the collector fetches it." } },
  { id: "bis", group: "World", name: "BIS — estatísticas de pagamentos (Red Book / CPMI)", url: "https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CPMI_SYSTEMS/1.0/", doc: "https://data.bis.org/topics/CPMI", cadence: { pt: "anual (até 2024)", en: "annual (through 2024)" }, cors: true, note: { pt: "Requer o cabeçalho Accept: application/vnd.sdmx.data+json;version=1.0.0.", en: "Requires header Accept: application/vnd.sdmx.data+json;version=1.0.0." } },
  { id: "blockchain", group: "Bitcoin", name: "blockchain.com — preço histórico do bitcoin em US$", url: "https://api.blockchain.info/charts/market-price", doc: "https://www.blockchain.com/explorer/charts/market-price", cadence: { pt: "diária", en: "daily" }, cors: false, note: { pt: "Exige Accept-Language: en. Sem CORS: só o coletor busca.", en: "Requires Accept-Language: en. No CORS: only the collector fetches it." } },
  { id: "bitstamp", group: "Bitcoin", name: "Bitstamp — preço histórico do bitcoin em US$ (no navegador)", url: "https://www.bitstamp.net/api/v2/ohlc/btcusd/", doc: "https://www.bitstamp.net/api/", cadence: { pt: "diária", en: "daily" }, cors: true, note: { pt: "Usada pelo navegador quando não há coleta (histórico desde ago/2011, 1.000 dias por consulta).", en: "Used by the browser when there is no collection (history since Aug 2011, 1,000 days per request)." } },
  { id: "binance", group: "Bitcoin", name: "Binance — BTC/BRL ao vivo (WebSocket)", url: "wss://stream.binance.com:9443/ws/btcbrl@miniTicker", doc: "https://binance-docs.github.io/apidocs/spot/en/", cadence: { pt: "tempo real", en: "real time" }, cors: true, note: { pt: "A API REST da Binance não serve: bloqueia IPs dos EUA (onde rodam os coletores) e não tem CORS.", en: "Binance's REST API is not used: it blocks US IPs (where collectors run) and lacks CORS." } },
  { id: "coinbase", group: "Bitcoin", name: "Coinbase — BTC/BRL (reserva)", url: "https://api.coinbase.com/v2/prices/BTC-BRL/spot", doc: "https://docs.cdp.coinbase.com/", cadence: { pt: "tempo real", en: "real time" }, cors: true },
  { id: "foxbit", group: "Bitcoin", name: "Foxbit — BTC/BRL (reserva brasileira)", url: "https://api.foxbit.com.br/rest/v3/markets/btcbrl/ticker/24hr", doc: "https://docs.foxbit.com.br/", cadence: { pt: "tempo real", en: "real time" }, cors: true },
  { id: "coingecko", group: "Bitcoin", name: "CoinGecko — BTC (reserva)", url: "https://api.coingecko.com/api/v3/simple/price", doc: "https://docs.coingecko.com/", cadence: { pt: "~1 min", en: "~1 min" }, cors: true },
  { id: "mempool", group: "Bitcoin", name: "mempool.space — bloco, taxas, hashrate, dificuldade", url: "https://mempool.space/api/", doc: "https://mempool.space/docs/api/rest", cadence: { pt: "tempo real", en: "real time" }, cors: true },
  { id: "awesomeapi", group: "FX", name: "AwesomeAPI — dólar ao vivo", url: "https://economia.awesomeapi.com.br/json/last/USD-BRL", doc: "https://docs.awesomeapi.com.br/", cadence: { pt: "~30 s", en: "~30 s" }, cors: true },
];

/** Fatos fixos do Museu — fonte: Banco Central (Museu de Valores / resoluções do CMN). */
export const MOEDAS = [
  { id: "real-antigo", name: "Réis / Mil-réis", sym: "Rs", from: "1822", to: "1942-10-31", ratio: null,  act: null },
  { id: "cruzeiro1",  name: "Cruzeiro",         sym: "Cr$",  from: "1942-11-01", to: "1967-02-12", ratio: 1,    act: "Decreto-Lei 4.791/1942" },
  { id: "cruzeironovo", name: "Cruzeiro Novo",  sym: "NCr$", from: "1967-02-13", to: "1970-05-14", ratio: 1000, act: "Decreto-Lei 1/1965; Decreto 60.190/1967" },
  { id: "cruzeiro2",  name: "Cruzeiro",         sym: "Cr$",  from: "1970-05-15", to: "1986-02-27", ratio: 1,    act: "Resolução CMN 144/1970" },
  { id: "cruzado",    name: "Cruzado",          sym: "Cz$",  from: "1986-02-28", to: "1989-01-14", ratio: 1000, act: "Resolução CMN 1.100/1986" },
  { id: "cruzadonovo", name: "Cruzado Novo",    sym: "NCz$", from: "1989-01-15", to: "1990-03-15", ratio: 1000, act: "Resolução CMN 1.565/1989" },
  { id: "cruzeiro3",  name: "Cruzeiro",         sym: "Cr$",  from: "1990-03-16", to: "1993-07-31", ratio: 1,    act: "Resolução CMN 1.689/1990" },
  { id: "cruzeiroreal", name: "Cruzeiro Real",  sym: "CR$",  from: "1993-08-01", to: "1994-06-30", ratio: 1000, act: "MP 336/1993; Lei 8.697/1993" },
  { id: "real",       name: "Real",             sym: "R$",   from: "1994-07-01", to: null,         ratio: 2750, act: "MP 542/1994" },
];
