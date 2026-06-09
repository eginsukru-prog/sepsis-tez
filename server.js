const https = require('https');

const handler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(404); res.end(); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      const apiKey = payload.api_key;
      const data = JSON.stringify(payload.body);

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const proxyReq = https.request(options, proxyRes => {
        let responseData = '';
        proxyRes.on('data', chunk => responseData += chunk);
        proxyRes.on('end', () => {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(responseData);
        });
      });

      proxyReq.on('error', err => {
        res.writeHead(500);
        res.end(JSON.stringify({error: err.message}));
      });

      proxyReq.write(data);
      proxyReq.end();
    } catch(e) {
      res.writeHead(400);
      res.end(JSON.stringify({error: e.message}));
    }
  });
};

const PORT = process.env.PORT || 3000;
require('http').createServer(handler).listen(PORT, () => console.log('Proxy running on port', PORT));
