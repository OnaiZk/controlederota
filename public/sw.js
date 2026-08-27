const CACHE_NAME = "eletromidia-frota-v1";

const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/LOGOELETRO.png",
  "/Eletromidia Horizontal (3).png",
  "/eletromidia-app logo-512px.png",
  "/eletromidia-app logo-1024px.png"
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Alguns ativos estáticos falharam ao ser armazenados no cache inicial:", err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições de rede
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar requisições que não sejam GET
  if (request.method !== "GET") {
    return;
  }

  // Ignorar esquemas não suportados (ex: extensões de navegador)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Não interferir em requisições de autenticação do Clerk ou websockets/APIs do Convex
  if (
    url.hostname.includes("clerk") ||
    url.hostname.includes("convex.cloud") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Para navegações de página (HTML)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlinePage = await cache.match("/offline.html");
          return offlinePage || new Response("Você está offline", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
    );
    return;
  }

  // Para imagens, fontes e arquivos estáticos
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Padrão: Network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
