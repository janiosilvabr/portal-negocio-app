// Service worker mínimo: existe só pra tornar o site instalável como PWA
// (Chrome/Android exigem um service worker registrado com handler de
// fetch pra mostrar o prompt de instalação). Sem nenhum cache proposital
// -- este projeto já teve problemas reais de cache desatualizado via CDN
// (ver CLAUDE.md); um SW com cache agressivo pioraria isso, então aqui é
// só passagem direta pra rede, sempre.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
