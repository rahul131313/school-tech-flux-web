/* ============================================================
   Main Entry Point — SchoolConnect Web Admin
   Imports styles in correct order and renders <App />.
   ============================================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Style imports — ORDER MATTERS
import './styles/reset.css';
import './styles/tokens.css';
import './styles/global.css';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
