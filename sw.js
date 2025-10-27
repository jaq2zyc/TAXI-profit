const CACHE_NAME = 'taxi-profit-cache-v1';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json',
  '/types.ts',
  '/utils/analytics.ts',
  '/utils/exporters.ts',
  '/utils/importers.ts',
  '/services/geminiService.ts',
  '/hooks/useTrips.ts',
  '/hooks/useCosts.ts',
  '/hooks/useAppSettings.ts',
  '/hooks/useDaySummaries.ts',
  '/hooks/usePartners.ts',
  '/hooks/useImportHistory.ts',
  '/hooks/useGeocodedTrips.ts',
  '/data/partners.ts',
  '/components/icons.tsx',
  '/components/StatCard.tsx',
  '/components/TripForm.tsx',
  '/components/EarningsChart.tsx',
  '/components/TripList.tsx',
  '/components/CostForm.tsx',
  '/components/CostList.tsx',
  '/components/CostAnalysis.tsx',
  '/components/SettingsModal.tsx',
  '/components/EmptyState.tsx',
  '/components/SmartImportModal.tsx',
  '/components/DailySummaryList.tsx',
  '/components/DaySummaryCard.tsx',
  '/components/AnalysisDashboard.tsx',
  '/components/PartnerForm.tsx',
  '/components/PartnerManager.tsx',
  '/components/InsuranceForm.tsx',
  '/components/Chatbot.tsx',
  '/components/WelcomeModal.tsx',
  '/components/WelcomeGraphic.tsx',
  '/components/EarningsHeatmap.tsx',
  '/App.tsx',
];

const CDN_URLS = [
    "https://aistudiocdn.com/react-dom@^19.2.0/",
    "https://aistudiocdn.com/@google/genai@^1.26.0",
    "https://aistudiocdn.com/react@^19.2.0/",
    "https://aistudiocdn.com/react@^19.2.0",
    "https://aistudiocdn.com/recharts@^3.3.0",
    "https://aistudiocdn.com/date-fns@^4.1.0",
    "https://cdn.tailwindcss.com",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
];

const urlsToCache = [...APP_SHELL_URLS, ...CDN_URLS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        const requests = urlsToCache.map(url => new Request(url, { cache: 'no-cache' }));
        return cache.addAll(requests).catch(err => {
            console.error('Failed to cache some URLs during install:', err);
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
