```
 ___ ___  ___ _____ _   ___ _   _ ___   ___ ___   _   _  _____ ___ __  __ ___ 
| __| _ \/ _ \_   _/_\ | _ ) | | / __| | _ \ __| /_\ | ||_   _|_ _|  \/  | __|
| _||   / (_) || |/ _ \| _ \ |_| \__ \ |   / _| / _ \| |__| |  | || |\/| | _| 
|_| |_|_\\___/ |_/_/ \_\___/\___/|___/ |_|_\___/_/ \_\____|_| |___|_|  |_|___|

  >> MONITORAMENTO GPS DE ALTA PERFORMANCE — RIO DE JANEIRO <<
  >> BUILD: NETLIFY EDGE  |  ENGINE: WEBGL  |  STATUS: [ONLINE] <<
```

![Demonstração do Mapa](./assets/preview.png)

![Status](https://img.shields.io/badge/Status-Em%20Produção-success?style=for-the-badge)
![Performance](https://img.shields.io/badge/GPU_Render-Optimized-blueviolet?style=for-the-badge)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-WebGL-0081C6?style=for-the-badge&logo=maplibre&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Serverless-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-Edge-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

Plataforma de monitoramento GPS em tempo real da frota de ônibus da cidade do Rio de Janeiro. Desenvolvida com foco em **extrema performance de renderização (WebGL)** e resiliência de rede, a aplicação processa e desenha mais de 4.000 pontos em movimento simultaneamente sobre camadas de satélite, com animação suave entre atualizações e múltiplas camadas de análise.

---

## 🗺️ Funcionalidades

* **Posicionamento em tempo real** — dados GPS atualizados a cada 30 segundos via API pública da Mobilidade Rio.
* **Animação de movimento** — ao chegar novos dados, cada ônibus desliza suavemente da posição anterior para a nova (interpolação com easing, 4s).
* **Cor por velocidade** — ícone muda de cor em tempo real: 🟢 em movimento (>20 km/h) · 🟡 lento (1–20 km/h) · 🔴 parado (0 km/h).
* **Filtro por linha** — campo de busca que exibe apenas os ônibus da linha digitada, com contagem ao vivo.
* **Trail do ônibus** — ao clicar em um ônibus, exibe as últimas 10 posições registradas como trilha pontilhada no mapa.
* **Cluster em zoom baixo** — ao afastar o mapa (zoom ≤ 10), ônibus próximos se agrupam em bolhas com contagem; clicar dá zoom automático no grupo.
* **Heatmap de densidade** — camada de calor ativável por botão, mostrando concentração da frota em toda a cidade.
* **Painel de estatísticas** — exibe frota ativa, % de ônibus parados, velocidade média e linha com mais ônibus em operação.
* **Cache offline** — último estado válido salvo no `localStorage`; se a API falhar, o mapa exibe os dados em cache com indicador de idade.

---

## ⚡ Otimizações de Performance (The "Secret Sauce")

Para garantir que o mapa rode a 60 FPS mesmo com milhares de SVGs e textos dinâmicos, o projeto conta com uma arquitetura *Zero-Bottleneck*:

### 🖥️ GPU / WebGL (MapLibre)
* **Bypass de Colisão Assíncrona (`text-ignore-placement`):** Desativa o recálculo do Worker para sobreposição de textos, forçando a GPU a desenhar as *labels* instantaneamente.
* **Culling de Câmera (`minzoom`, `antialias: false`):** Suavização de pixels desativada para poupar ciclos de GPU. Textos só entram no pipeline se o zoom for legível.
* **Network Trapping (`maxBounds`):** Câmera travada no RJ, impedindo download de *tiles* inúteis.
* **Expressão nativa de cor (`icon-image: case`):** A seleção de ícone por velocidade roda inteiramente na GPU via expressão MapLibre — zero JavaScript por frame.

### 🧠 CPU (Source Data)
* **Formato compacto no payload:** A Netlify Function entrega arrays `[id, linha, vel, lng, lat]` em vez de GeoJSON completo — redução de ~70% no tamanho do payload (~600 KB vs ~3 MB).
* **Algoritmo de Simplificação Desativado (`tolerance: 0`):** Remove o overhead do Douglas-Peucker, útil apenas para polígonos.
* **Cluster nativo MapLibre:** Agrupamento de pontos feito na engine em C++ (WASM), sem custo no thread principal.

### 🌐 Serverless & Resiliência (Proxy API)
* **Edge Proxying:** API pública da Mobilidade Rio encapsulada em Netlify Function para contornar CORS.
* **Streaming Parcial com Deadline de 7s:** A função corta o stream, repara o JSON parcial no último objeto completo e retorna os ônibus já recebidos — evita 504 com mapa vazio.
* **Decompressão Zlib:** Tratamento nativo de streams `gzip/deflate` na borda.

---

## 🛠️ Stack Tecnológica

* **Frontend:** HTML5, CSS3 (Flexbox/CSS Variables), JavaScript Vanilla.
* **Maps Engine:** [MapLibre GL JS](https://maplibre.org/) (Fork open-source do Mapbox GL).
* **Basemap:** Esri World Imagery (Satélite Alta Resolução).
* **Backend / Proxy:** Node.js (Netlify Functions) rodando na borda.

---

## 🚀 Como Executar Localmente

Como a aplicação exige um backend Serverless para contornar o CORS da API pública, é recomendado utilizar o CLI do Netlify para emular o ambiente de produção localmente.

### Pré-requisitos
* [Node.js](https://nodejs.org/) (v16 ou superior)
* Netlify CLI (`npm install -g netlify-cli`)

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/brunokobi/frotarealtime.git
cd frotarealtime
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor local com emulação de Functions:
```bash
netlify dev
```

4. Acesse `http://localhost:8888`
