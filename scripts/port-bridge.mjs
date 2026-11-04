import http from 'http';

const PORT = 3000;
const TARGET_PORT = 5173;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plainsyt রিডাইরেক্ট হচ্ছে...</title>
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #061621;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .box {
      text-align: center;
      padding: 24px;
    }
    .spinner {
      width: 44px;
      height: 44px;
      margin: 0 auto 18px;
      border: 3px solid rgba(3, 239, 98, 0.2);
      border-top-color: #03EF62;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
    p { color: #94a3b8; font-size: 13px; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h1>Plainsyt-এ রিডাইরেক্ট করা হচ্ছে...</h1>
    <p>আপনার অথেনটিকেশন সেশন প্রসেস হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
  </div>
  <script>
    const target = 'http://' + window.location.hostname + ':${TARGET_PORT}' + window.location.pathname + window.location.search + window.location.hash;
    window.location.replace(target);
  </script>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Port bridge active: http://localhost:${PORT} -> http://localhost:${TARGET_PORT}`);
});
