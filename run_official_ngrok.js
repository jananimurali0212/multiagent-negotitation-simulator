const ngrok = require('@ngrok/ngrok');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('Starting official @ngrok/ngrok listener for port 5173...');
    const listener = await ngrok.forward({ addr: 5173 });
    const url = listener.url();
    console.log('========================================================');
    console.log('🎉 SUCCESS! NGROK PUBLIC SHAREABLE LINK IS ACTIVE!');
    console.log('🔗 Public Link:', url);
    console.log('========================================================');
    
    fs.writeFileSync(path.join(__dirname, 'NGROK_LIVE_URL.txt'), url, 'utf8');
  } catch (err) {
    console.error('Error starting @ngrok/ngrok:', err);
    fs.writeFileSync(path.join(__dirname, 'NGROK_ERROR.txt'), String(err), 'utf8');
  }
})();
