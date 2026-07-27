const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();
console.log('Add these to your backend/.env file:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\nAlso copy VAPID_PUBLIC_KEY into frontend/.env as VITE_VAPID_PUBLIC_KEY.');
