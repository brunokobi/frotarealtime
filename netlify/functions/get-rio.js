const https = require('https');
const zlib = require('zlib');

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const DEADLINE_MS = 7000;          // corta em 7s e usa o que chegou

exports.handler = async function(event, context) {
  return new Promise((resolve) => {
    const CORS = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    const options = {
      hostname: 'dados.mobilidade.rio',
      path: '/gps/sppo',
      method: 'GET',
      headers: { 'Accept-Encoding': 'gzip, deflate' },
      rejectUnauthorized: false,
    };

    let chunks = [];
    let totalBytes = 0;
    let rawData = '';
    let resolvido = false;

    function encerrar(motivo) {
      if (resolvido) return;
      resolvido = true;
      req.destroy();
      processarDados(motivo);
    }

    // Deadline: após 7s, corta e usa o que chegou
    const deadline = setTimeout(() => encerrar('parcial'), DEADLINE_MS);

    function processarDados(motivo) {
      clearTimeout(deadline);

      if (!rawData) rawData = Buffer.concat(chunks).toString('utf8');

      if (!rawData.trimStart().startsWith('[')) {
        console.error('[get-rio] Resposta inesperada:', rawData.slice(0, 300));
        return resolve({
          statusCode: 502,
          headers: CORS,
          body: JSON.stringify({
            erro: "Bad Gateway",
            detalhes: "API não retornou JSON array.",
            preview: rawData.slice(0, 200)
          })
        });
      }

      // Tenta fechar o JSON parcial: encontra o último objeto completo
      let jsonParaParsear = rawData;
      if (motivo === 'parcial') {
        const ultimoFechamento = rawData.lastIndexOf('}');
        if (ultimoFechamento === -1) {
          return resolve({
            statusCode: 504,
            headers: CORS,
            body: JSON.stringify({ erro: "Timeout", detalhes: "API lenta, nenhum objeto completo recebido em 7s." })
          });
        }
        jsonParaParsear = rawData.slice(0, ultimoFechamento + 1) + ']';
        console.log(`[get-rio] Parcial: ${rawData.length} bytes recebidos, JSON reparado.`);
      }

      try {
        const data = JSON.parse(jsonParaParsear);

        const result = {
          parcial: motivo === 'parcial',
          buses: data.map(onibus => {
            const lat = parseFloat(onibus.latitude.replace(',', '.'));
            const lng = parseFloat(onibus.longitude.replace(',', '.'));
            if (isNaN(lng) || isNaN(lat) || lng === 0 || lat === 0) return null;
            return [onibus.ordem, onibus.linha, parseFloat(onibus.velocidade) || 0, lng, lat];
          }).filter(Boolean)
        };

        console.log(`[get-rio] OK (${motivo}): ${result.buses.length} ônibus`);
        resolve({ statusCode: 200, headers: CORS, body: JSON.stringify(result) });

      } catch (e) {
        console.error('[get-rio] Parse falhou:', e.message, '| preview:', rawData.slice(0, 300));
        resolve({
          statusCode: 502,
          headers: CORS,
          body: JSON.stringify({
            erro: "Bad Gateway",
            detalhes: "Erro no parse JSON: " + e.message,
            preview: rawData.slice(0, 200)
          })
        });
      }
    }

    const req = https.get(options, (res) => {
      let stream = res;
      if (res.headers['content-encoding'] === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (res.headers['content-encoding'] === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      }

      stream.on('data', (chunk) => {
        if (resolvido) return;
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        totalBytes += chunk.length;
        if (totalBytes > MAX_BYTES) encerrar('parcial');
      });

      stream.on('end', () => {
        rawData = Buffer.concat(chunks).toString('utf8');
        encerrar('completo');
      });
    });

    req.on('error', (e) => {
      if (resolvido) return;
      clearTimeout(deadline);
      resolvido = true;
      // Se foi destroy() por deadline, já processamos — ignora o erro ECONNRESET
      if (e.code === 'ECONNRESET' || e.code === 'ERR_STREAM_DESTROYED') return;
      resolve({
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ erro: "Erro HTTPS", detalhes: e.message })
      });
    });

    req.end();
  });
};
