import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { InvoiceProvider } from './context/InvoiceContext';
import { ThemeProvider } from './context/ThemeContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <InvoiceProvider>
          <App />
        </InvoiceProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
