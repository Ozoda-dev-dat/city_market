const { spawn } = require('child_process');

console.log('🚀 Setting up Cloudflare Tunnel for free...');

// Install cloudflared if not present
const cloudflared = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:5001'], { stdio: 'inherit' });

cloudflared.on('close', (code) => {
  console.log(`Cloudflare tunnel exited with code ${code}`);
});
