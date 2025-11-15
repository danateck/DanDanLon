const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Enable CORS for your GitHub Pages
app.use(cors({
  origin: 'https://danateck.github.io',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// Proxy to Firebase Storage
app.all('/proxy-firebase/*', async (req, res) => {
  try {
    const firebaseUrl = req.originalUrl.replace('/proxy-firebase/', '');
    const fullUrl = `https://firebasestorage.googleapis.com/${firebaseUrl}`;
    
    console.log('Proxying to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
        'Authorization': req.headers['authorization'] || ''
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
    });
    
    const data = await response.arrayBuffer();
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    res.send(Buffer.from(data));
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});