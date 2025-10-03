/**
 * Main App component with routing
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { ServerDetail } from './pages/ServerDetail';
import { AddServer } from './pages/AddServer';
import { Docs } from './pages/Docs';

function App() {
  return (
    <ThemeProvider>
      <Router basename="/mcp-hub">
        <div className="App">
          <Header />
          <main>
            <Routes>
              {/* Home page */}
              <Route path="/" element={<Home />} />

              {/* Browse page */}
              <Route path="/browse" element={<Browse />} />

              {/* Server detail page */}
              <Route path="/server/:id" element={<ServerDetail />} />

              {/* Add server page */}
              <Route path="/add" element={<AddServer />} />

              {/* Documentation page */}
              <Route path="/docs" element={<Docs />} />

              {/* 404 page */}
              <Route path="*" element={
                <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Page not found</p>
                    <a href="/mcp-hub/browse" className="btn-primary">
                      Go to Browse
                    </a>
                  </div>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
