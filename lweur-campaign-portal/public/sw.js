// Empty service worker to prevent 404 errors
// This file prevents browsers from showing 404 errors when looking for a service worker

self.addEventListener('install', function(event) {
  // Do nothing - empty service worker
});

self.addEventListener('fetch', function(event) {
  // Do nothing - let the browser handle all requests normally
});