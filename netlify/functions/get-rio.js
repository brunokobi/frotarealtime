const https = require('https');
const zlib = require('zlib');

exports.handler = async function(event, context) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'dados.mobilidade.rio',
      path: '/gps/sppo',
      method: 'GET',
      headers: { 'Accept-Encoding': 'gzip, deflate' },
      rejectUnauthorized: false,
      timeout: 8000 // Timeout restrito para evitar erro 500 de limite da AWS/Netlify
    };

    const req = https.get(options, (res) => {
      let stream = res;
      if (res.headers['content-encoding'] === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (res.headers['content-encoding'] === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      }

      let rawData = '';

      stream.on('data', (chunk) => { 
        rawData += chunk; 
      });

      stream.on('end', () => {
        try {
          const data = JSON.parse(rawData);

          const geojson = {
            type: 'FeatureCollection',
            features: data.map(onibus => {
              const latParsed = parseFloat(onibus.latitude.replace(',', '.'));
              const lngParsed = parseFloat(onibus.longitude.replace(',', '.'));

              if (isNaN(lngParsed) || isNaN(latParsed) || lngParsed === 0 || latParsed === 0) return null;

              return {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lngParsed, latParsed]
                },
                properties: {
                  id: onibus.ordem,
                  linha: onibus.linha,
                  velocidade: onibus.velocidade
                }
              };
            }).filter(Boolean)
          };

          resolve({
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(geojson),
          });
        } catch (e) {
          resolve({ 
            statusCode: 502, 
            body: JSON.stringify({ erro: "Bad Gateway", detalhes: "Erro no Parse JSON da API." }) 
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        statusCode: 504, 
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ erro: "Gateway Timeout", detalhes: "A API do Rio demorou mais de 8s." }) 
      });
    });

    req.on('error', (e) => {
      resolve({ 
        statusCode: 500, 
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ erro: "Erro HTTPS", detalhes: e.message }) 
      });
    });

    req.end();
  });
};