const ngrok = require('@ngrok/ngrok');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('Connecting official @ngrok/ngrok with auth token for port 5173...');
    const listener = await ngrok.forward({
      addr: 5173,
      authtoken: '3IN1TQqk8l5fp2T4zzDNMvlL1IH_7GJiMCKtKR3ac57wdfuiU'
    });
    const url = listener.url();
    console.log('========================================================');
    console.log('🎉 SUCCESS! NGROK PUBLIC TUNNEL IS ACTIVE!');
    console.log('🔗 Public Link:', url);
    console.log('========================================================');
    fs.writeFileSync(path.join(__dirname, 'NGROK_LINK.txt'), url, 'utf8');

    // Keep process alive indefinitely
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    console.error('NGROK ERROR:', err);
    fs.writeFileSync(path.join(__dirname, 'NGROK_ERR.txt'), String(err.stack || err), 'utf8');
  }
})();
