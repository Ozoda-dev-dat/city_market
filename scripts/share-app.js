const { spawn } = require('child_process');

console.log('🚀 Starting fullstack app for remote sharing...');

// Start ngrok for backend
const ngrok = spawn('npx', ['ngrok', 'http', '5001'], { stdio: 'inherit' });

// Wait a moment for ngrok to start
setTimeout(() => {
  console.log('\n📱 Now start your frontend with tunnel:');
  console.log('npx expo start --tunnel');
  console.log('\n🌍 Share the Expo tunnel URL with your friend!');
}, 3000);
