# Monitor Brasil — Real × Bitcoin · Área Bitcoin Research

Monitor da economia brasileira, ao vivo, em dez abas: **Painel · Poder de compra · Inflação · Juros e crédito ·
Famílias · Dívida pública · Pix · Bitcoin · Museu do Real · Dados e fontes**. Site estático (HTML + CSS + JavaScript
puro + ECharts), sem servidor, sem chave de API e sem custo: roda no GitHub Pages.

> Todos os números vêm de fontes públicas (Banco Central, IBGE, Ipeadata, Banco Mundial, FMI, BIS, blockchain.com,
> Binance…). Cada gráfico mostra a fonte e o dado bruto. Veja `FONTES-DE-DADOS.md` para a auditoria completa do que
> dá — e do que não dá — para extrair por API.

## Como os dados se mantêm atualizados

Duas camadas, para nunca depender de um único ponto:

1. **Coletor automático** (`scripts/collect.mjs`, Node 18+, sem dependências). Roda a cada 2 horas no GitHub Actions,
   grava `data/*.json` e publica o site. É a única forma de trazer fontes que não aceitam acesso direto do navegador
   (FMI, blockchain.com) e as séries históricas pesadas (Pix por município, juros por banco, IBGE por item…).
2. **Camada ao vivo no navegador** (`assets/js/live.js`): Bitcoin/R$ por WebSocket da Binance (reservas: Foxbit,
   Coinbase, CoinGecko), dólar (AwesomeAPI), rede Bitcoin (mempool.space) e os últimos pontos das séries do Banco
   Central direto da API SGS a cada 20 minutos. O selo **AO VIVO** no topo só acende se alguma cotação responder.

3. **Modo de segurança no navegador** (`assets/js/bootstrap.js` e `bootstrap-extras.js`): se o coletor ainda não rodou —
   ou deixou alguma coisa de fora — o navegador busca sozinho, direto das fontes (CORS liberado), as 63 séries do Banco
   Central, o Pix (meios de pagamento), o histórico do Bitcoin (Bitstamp), Banco Mundial, BIS, IBGE e Ipeadata, e guarda
   em cache por 6 h. É isso que faz o site funcionar **abrindo o `index.html` com duplo clique**. Só três coisas dependem
   do coletor: o mapa da dívida mundial (FMI), as expectativas do Boletim Focus e os juros por banco. As séries diárias
   (Selic meta, reservas, PTAX) chegam em segundo plano porque a API do BC é lenta nelas; até lá o PTAX usa a média mensal.

A aba **Dados e fontes** mostra, em tempo real, o status de cada coleta e de cada conexão ao vivo.

## Rodar no seu computador

**Jeito mais simples (sem terminal):** descompacte e dê **duplo clique em `index.html`**. O navegador busca os dados
sozinho (leva de 10 a 30 segundos na primeira vez; depois fica em cache por 6 h).

**Com a coleta completa:**

```bash
node scripts/collect.mjs --full     # primeira coleta completa (1–3 min; precisa de internet livre)
python3 -m http.server 8080         # ou: npx serve .
# abra http://localhost:8080
```

Opções do coletor: `--only=sgs,pix` (só alguns blocos), `--full` (refaz todo o histórico), `--extras` (liga as aberturas
detalhadas do Pix — perfil, estado, município, chaves, fraudes, setor —, que a versão atual do site não exibe).
Os arquivos `data/_cache-*.json` guardam o histórico diário (PTAX, reservas, Selic meta) para que as coletas seguintes busquem só os dias novos.

## Publicar no GitHub Pages (atualização automática)

1. Crie um repositório (ex.: `monitor-brasil`) e envie **todo o conteúdo desta pasta** para a branch `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Actions → General → Workflow permissions → Read and write permissions.**
4. Aba **Actions → “Atualizar dados e publicar” → Run workflow.** A primeira execução faz a coleta completa e publica;
   depois o workflow roda sozinho a cada 2 horas (cron `17 */2 * * *`).
5. O endereço fica em `https://SEU-USUARIO.github.io/monitor-brasil/`.

### Domínio próprio e Webflow

- **Subdomínio (recomendado):** em **Settings → Pages → Custom domain** use, por exemplo, `monitor.areabitcoin.com.br`
  e crie no seu DNS um registro `CNAME monitor → SEU-USUARIO.github.io`. No Webflow, linke o menu/botão para o subdomínio.
- **Embutir no Webflow:** use um bloco *Embed* com
  `<iframe src="https://monitor.areabitcoin.com.br" style="width:100%;height:95vh;border:0" loading="lazy"></iframe>`.
  Funciona, mas o subdomínio é melhor para SEO e para compartilhar links de cada aba (`/#/pix`, `/#/museu`…).

## Museu do Real: história, imagens e acervo

A aba **Museu do Real** é um museu de salas: a história do dinheiro brasileiro (capítulos com curiosidades), a sala do
**confisco de 1990** (Plano Collor I: datas, texto oficial da lei, simulador, gráfico do IPCA, manchete com fonte e linha do
tempo até a decisão do STF em 2025), as moedas e o conversor, a máquina de preços, a hiperinflação, o mapa-múndi da
inflação e o salário mínimo desde 1940.

- **As imagens são ilustrações originais** (SVG, em `assets/js/museu-historia.js`), sempre legendadas como ilustração.
- **Fotos e capas de jornal** têm autor e licença: não vêm embutidas. Para usar imagens licenciadas, coloque os arquivos em
  `assets/museu/img/` e liste-os em `assets/museu/acervo.js` (modelo no próprio arquivo, veja `assets/museu/LEIA-ME.md`).
  Defina `MB.ACERVO_DICA = false` para esconder a moldura pontilhada de exemplo ao publicar.
- **Fatos e números:** só entram datas e fatos conferidos em fontes (Lei 8.024/1990 em `planalto.gov.br`, STF, Poder360,
  Agência Senado, IBGE…); os percentuais de inflação vêm da série oficial carregada no site.

## Estrutura

```
index.html                 casca da página
assets/css/style.css       tema escuro + laranja Área Bitcoin (variáveis em :root)
assets/js/core.js          idioma PT/EN, formatação, cards de gráfico, componentes
assets/js/data.js          carrega data/*.json; índice de preços 1944→hoje; moedas; Bitcoin em R$
assets/js/live.js          tempo real no navegador (Binance, dólar, mempool, SGS)
assets/js/hero.js          mapa de pontos do Brasil no banner
assets/js/bootstrap*.js    busca direta no navegador (Banco Central, Pix, Bitcoin, Banco Mundial, BIS, IBGE, Ipeadata)
assets/js/geo-data.js      contornos embutidos (GERADO por scripts/make-geo.mjs) — permite abrir com duplo clique
assets/js/museu-historia.js  história contada, ilustrações e a sala do confisco de 1990
assets/museu/              acervo de fotos licenciadas do museu (acervo.js + img/)
assets/js/tab-*.js         uma aba por arquivo
assets/geo/                contornos (Natural Earth, domínio público, via pacote datamaps/MIT; simplificados)
scripts/sources.mjs        catálogo único: séries do BC, provedores e moedas
scripts/collect.mjs        coletor (Node, sem dependências)
data/                      saída do coletor (JSON abertos)
vendor/echarts.min.js      Apache ECharts 5 (Apache-2.0)
.github/workflows/update.yml   coleta + publicação a cada 2 h
```

## Personalizar

- **Cores:** variáveis no topo de `assets/css/style.css` (`--orange`, `--purple`, `--bg`…).
- **Logo:** o SVG no `<header>` de `index.html` é um marcador genérico — troque pelo logotipo oficial.
- **Textos:** estão no próprio código de cada aba, sempre em par `t("português", "english")`.
- **Nova série do Banco Central:** adicione uma linha em `SGS` (`scripts/sources.mjs`), rode
  `node scripts/make-catalog.mjs` (atualiza o catálogo do navegador) e o coletor, e use `MB.ser("chave")` no front-end
  (retorna `[["2026-09", 0.52], …]`).
- **Frequência:** altere o `cron` em `.github/workflows/update.yml` (o Pages aceita bem a cada hora).

## Cuidados

- Conteúdo informativo e educativo; **não é recomendação de investimento**. Simulações usam preços históricos de fim
  de mês, ignoram impostos e taxas e não garantem resultados futuros.
- “Juros do governo por segundo” e “Pix por segundo” são **estimativas** (médias de dados oficiais) e vêm sinalizadas.
- Os órgãos oficiais revisam séries; o coletor traz os valores revisados no ciclo seguinte.

Opt Out.
