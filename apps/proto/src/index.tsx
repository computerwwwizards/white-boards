import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


if ('serviceWorker' in navigator) {

  const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
  navigator.serviceWorker.register(swUrl)
    .then(reg => {
      console.log('Service Worker registered:', reg);
    })
    .catch(err => {
      console.error('Service Worker registration failed:', err);
    });

}

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
