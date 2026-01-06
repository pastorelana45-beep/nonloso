
const CACHE_NAME = 'vocalsynth-pro-v10';
const AUDIO_CACHE = 'vocalsynth-audio-v10';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME && key !== AUDIO_CACHE) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  const isAudioAsset = url.href.includes('midi-js-soundfonts') || url.href.includes('.js');

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        
        const cloned = response.clone();
        const targetCache = isAudioAsset ? AUDIO_CACHE : CACHE_NAME;
        caches.open(targetCache).then((cache) => cache.put(event.request, cloned));
        
        return response;
      });
    })
  );
});
