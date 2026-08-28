const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('Connecting tunnel to port 5173...');
    const tunnel = await localtunnel({ port: 5173 });
    const url = tunnel.url;
    console.log('========================================================');
    console.log('🎉 SUCCESS! PUBLIC SHAREABLE TUNNEL LINK IS ACTIVE!');
    console.log('🔗 Public Link:', url);
    console.log('========================================================');
    
    fs.writeFileSync(path.join(__dirname, 'LIVE_TUNNEL_URL.txt'), url, 'utf8');
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Error starting tunnel:', err);
  }
})();
