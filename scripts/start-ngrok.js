const ngrok = require('ngrok');

async function startNgrok() {
  try {
    // Start ngrok tunnel
    const url = await ngrok.connect({
      proto: 'http',
      addr: 5001, // Your backend port
      authtoken: 'YOUR_NGROK_AUTH_TOKEN' // Optional: Get from ngrok.com
    });
    
    console.log('🌍 Backend public URL:', url);
    console.log('📱 Update your .env file with:');
    console.log(`EXPO_PUBLIC_API_URL=${url}`);
    console.log(`EXPO_PUBLIC_DOMAIN=${url.replace('http://', '').replace('https://', '')}`);
    
    return url;
  } catch (error) {
    console.error('❌ Ngrok error:', error);
  }
}

startNgrok();
