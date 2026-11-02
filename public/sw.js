// SGC Classes - Service Worker Uninstaller / Cache Cleaner
// Garante que nenhum Service Worker legado fique preso na máquina do usuário

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through direto para a rede sem qualquer cache intermediário
  return;
});
