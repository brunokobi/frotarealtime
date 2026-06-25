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

Plataforma de monitoramento GPS em tempo real da frota de ônibus da cidade do Rio de Janeiro. Desenvolvida com foco em **extrema performance de renderização (WebGL)** e resiliência de rede, a aplicação é capaz de processar e desenhar mais de 4.000 pontos em movimento simultaneamente sobre camadas pesadas de satélite, sem gargalos de CPU ou GPU.

---

## ⚡ Otimizações de Performance (The "Secret Sauce")

Para garantir que o mapa rode a 60 FPS mesmo com milhares de SVGs e textos dinâmicos, o projeto conta com uma arquitetura *Zero-Bottleneck*:

### 🖥️ Otimizações de GPU / WebGL (MapLibre)
* **Bypass de Colisão Asíncrona (`text-ignore-placement`):** Desativa o recálculo do Worker para sobreposição de textos, forçando a GPU a desenhar as *labels* instantaneamente, prevenindo estouro de memória (VertexArray Mismatch).
* **Culling de Câmera e Antialiasing (`minzoom`, `antialias: false`):** Suavização de pixels desativada para poupar ciclos da placa de vídeo. Textos só são injetados no pipeline de renderização se o usuário estiver em um nível de zoom legível.
* **Network Trapping (`maxBounds`):** Câmera travada nas coordenadas do RJ, impedindo que o navegador faça o download de *tiles* de satélite inúteis caso o usuário arraste o mapa para longe.

### 🧠 Otimizações de CPU (Source Data)
* **Algoritmo de Simplificação Desativado (`tolerance: 0`):** Remove o overhead do algoritmo de Douglas-Peucker (útil apenas para polígonos/linhas), poupando a CPU ao injetar dados estritamente pontuais.
* **Buffer Zero (`buffer: 0`):** Impede a engine de pré-calcular colisões de geometria fora do limite visível da tela (*viewport*).

### 🌐 Arquitetura Serverless & Resiliência (Proxy API)
* **Edge Proxying:** Consumo da API pública da Mobilidade Rio encapsulado em uma Netlify Function (Node.js) para contornar problemas de CORS.
* **Streaming Parcial com Deadline de 7s:** A função corta o stream após 7s, repara o JSON parcial no último objeto completo e retorna os ônibus já recebidos — evita 504 com mapa vazio quando a API de origem é lenta.
* **Cache localStorage:** Último GeoJSON válido salvo no browser. Se a API falhar, o mapa exibe os dados em cache com indicador de idade (`🟡 cache de Xmin atrás`).
* **Decompressão Zlib:** Tratamento nativo de *streams* em `gzip/deflate` na borda para minimizar o *payload* trafegado.

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
