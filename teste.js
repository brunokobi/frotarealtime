const https = require('https');
const zlib = require('zlib');

console.log("Iniciando requisição para a API do Rio...");
console.time("Tempo de Resposta");

const options = {
  hostname: 'dados.mobilidade.rio',
  path: '/gps/sppo',
  method: 'GET',
  headers: { 'Accept-Encoding': 'gzip, deflate' },
  rejectUnauthorized: false
};

https.get(options, (res) => {
  console.log(`Status HTTP: ${res.statusCode}`);
  console.log(`Compressão: ${res.headers['content-encoding'] || 'Nenhuma'}`);
  
  let stream = res;
  if (res.headers['content-encoding'] === 'gzip') stream = res.pipe(zlib.createGunzip());
  else if (res.headers['content-encoding'] === 'deflate') stream = res.pipe(zlib.createInflate());

  let rawData = '';
  stream.on('data', chunk => rawData += chunk);
  
  stream.on('end', () => {
    console.log(`Download concluído. Tamanho: ${(rawData.length / 1024 / 1024).toFixed(2)} MB`);
    console.timeEnd("Tempo de Resposta");
    try {
      const json = JSON.parse(rawData);
      console.log(`Parse com sucesso! Total de veículos na frota: ${json.data.length}`);
    } catch (e) {
      console.error("❌ Erro ao converter o JSON. A API devolveu lixo/HTML de erro da Cloudflare.", e.message);
      console.log("Prévia do que a API enviou:", rawData.substring(0, 200));
    }
  });
}).on('error', e => console.error("❌ Falha de rede interna no WSL:", e.message));