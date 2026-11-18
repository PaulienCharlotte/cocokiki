import 'leaflet/dist/leaflet.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AccountPoort } from './components/account/AccountPoort';
import './design-system/tokens.css';
import './app.css';
import './design-system/components.css';
import './pages/world.css';
import './styles/mobiel-schaal.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AccountPoort><App /></AccountPoort>
  </React.StrictMode>
);
