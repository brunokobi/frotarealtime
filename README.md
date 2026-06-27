# 🛸 Frota Realtime RJ - Monitoramento de Alta Performance

![Demonstração do Mapa](./assets/preview.png)

![Status](https://img.shields.io/badge/Status-Em%20Produção-success?style=for-the-badge)
![Performance](https://img.shields.io/badge/GPU_Render-Optimized-blueviolet?style=for-the-badge)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-WebGL-0081C6?style=for-the-badge&logo=maplibre&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox_GL-WebGL-000000?style=for-the-badge&logo=mapbox&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Serverless-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-Edge-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

Plataforma de monitoramento GPS em tempo real da frota de ônibus da cidade do Rio de Janeiro. Desenvolvida com foco em **extrema performance de renderização (WebGL)** e resiliência de rede, a aplicação é capaz de processar e desenhar mais de 4.000 pontos em movimento simultaneamente sobre camadas pesadas de satélite, sem gargalos de CPU ou GPU.

A interface conta com **duas abas de mapa** para comparação side-by-side das engines: **MapLibre GL** (open-source, sem token) e **Mapbox GL** (carregado de forma lazy apenas quando ativado).

---

## ⚡ Otimizações de Performance (The "Secret Sauce")

Para garantir que o mapa rode a 60 FPS mesmo com milhares de SVGs e textos dinâmicos, o projeto conta com uma arquitetura *Zero-Bottleneck*:

### 🖥️ Otimizações de GPU / WebGL
* **Bypass de Colisão Assíncrona (`text-ignore-placement`):** Desativa o recálculo do Worker para sobreposição de textos, forçando a GPU a desenhar as *labels* instantaneamente, prevenindo estouro de memória (VertexArray Mismatch).
* **Culling de Câmera e Antialiasing (`minzoom`, `antialias: false`):** Suavização de pixels desativada para poupar ciclos da placa de vídeo. Textos só são injetados no pipeline de renderização se o usuário estiver em um nível de zoom legível.
* **Network Trapping (`maxBounds`):** Câmera travada nas coordenadas do RJ, impedindo que o navegador faça o download de *tiles* de satélite inúteis caso o usuário arraste o mapa para longe.

### 🧠 Otimizações de CPU (Source Data)
* **Algoritmo de Simplificação Desativado (`tolerance: 0`):** Remove o overhead do algoritmo de Douglas-Peucker (útil apenas para polígonos/linhas), poupando a CPU ao injetar dados estritamente pontuais.
* **Buffer Zero (`buffer: 0`):** Impede a engine de pré-calcular colisões de geometria fora do limite visível da tela (*viewport*).

### 🌐 Arquitetura Serverless & Resiliência (Proxy API)
* **Edge Proxying:** Consumo da API pública da Mobilidade Rio encapsulado em uma Netlify Function (Node.js) para contornar problemas de CORS.
* **Fail-Fast Architecture:** Implementação de um `timeout` estrito de 8 segundos no socket HTTPS. Se a API de origem engargalar, o proxy corta a conexão imediatamente (retornando `504 Gateway Timeout`), protegendo a *thread* principal e evitando o bloqueio da interface do usuário.
* **Decompressão Zlib:** Tratamento nativo de *streams* em `gzip/deflate` na borda para minimizar o *payload* trafegado.
* **Token Seguro via Serverless:** O token do Mapbox é servido pela Netlify Function `get-mapbox-token` e nunca fica exposto diretamente no HTML estático.

---

## 🛠️ Stack Tecnológica

* **Frontend:** HTML5, CSS3 (Flexbox/CSS Variables), JavaScript Vanilla. Totalmente responsivo (mobile-first).
* **Maps Engine:** [MapLibre GL JS](https://maplibre.org/) + [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (carregado lazy).
* **Basemap:** Esri World Imagery (MapLibre) / Mapbox Satellite (Mapbox).
* **Backend / Proxy:** Node.js (Netlify Functions) rodando na borda.

---

## 🔑 Variáveis de Ambiente

| Variável              | Descrição                              | Obrigatória      |
|-----------------------|----------------------------------------|------------------|
| `VITE_MAPBOX_TOKEN`   | Token público do Mapbox (`pk.eyJ1...`) | Sim (aba Mapbox) |

Configure no painel do Netlify: **Site configuration → Environment variables → Add a variable**.

> O token é um *public token* do Mapbox (começa com `pk.`). Recomenda-se restringi-lo por URL no dashboard do Mapbox para evitar uso não autorizado da sua cota.

---

## 🚀 Como Executar Localmente

Como a aplicação exige um backend Serverless para contornar o CORS da API pública, é recomendado utilizar o CLI do Netlify para emular o ambiente de produção localmente.

### Pré-requisitos
* [Node.js](https://nodejs.org/) (v16 ou superior)
* Netlify CLI (`npm install -g netlify-cli`)

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/brunokobi/map-bus.git
cd map-bus
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o token do Mapbox criando um arquivo `.env` na raiz:
```env
VITE_MAPBOX_TOKEN=pk.eyJ1...seu_token_aqui
```

4. Inicie o servidor de desenvolvimento com o Netlify CLI:
```bash
netlify dev
```

5. Acesse `http://localhost:8888` no navegador.

> A aba **MapLibre GL** funciona sem token. A aba **Mapbox GL** requer o `VITE_MAPBOX_TOKEN` configurado.

---

## 📁 Estrutura do Projeto

```
map-bus/
├── index.html                        # Aplicação SPA (CSS + JS embutidos)
├── netlify/
│   └── functions/
│       ├── get-rio.js                # Proxy da API Mobilidade Rio (GPS)
│       └── get-mapbox-token.js       # Serve o token Mapbox com segurança
├── assets/
│   └── preview.png
└── package.json
```
