import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TokenSecurityPage from './components/TokenSecurityPage';
import { Scene } from './components/rubikcube.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { Web3Provider } from './context/Web3Context';
import './index.css';
import TeamBundleWalletPage from './components/TeamBundleWalletPage';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard setActiveSection={setActiveSection} />;
      case 'aion-bot':
        return <TokenSecurityPage title="Aion Bot" />;
      case 'phishing-scanner':
        return <TokenSecurityPage title="Phishing Link Scanner" />;
      case 'team-bundle-scanner':
        return <TeamBundleWalletPage />;
      case 'wallet-detection':
        return <TokenSecurityPage title="Phishing Wallets Detection" />;
      case 'trace-funds':
        return <TokenSecurityPage title="Trace Stolen Funds" />;
      case 'aion-lab':
        return <TokenSecurityPage title="Aion Lab" />;
      default:
        return <Dashboard setActiveSection={setActiveSection} />;
    }
  };

  return (
    <ThemeProvider>
      <Web3Provider>
        <div className="min-h-screen bg-black relative">
          {/* Rubik's Cube Background */}
          <div className="fixed inset-0 z-0">
            <Scene />
          </div>
          
          {/* Main Content Overlay */}
          <div className="relative z-10">
            <Header activeSection={activeSection} setActiveSection={setActiveSection} />
            <main className="p-6">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {renderContent()}
              </motion.div>
            </main>
          </div>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff'
              }
            }}
          />
        </div>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
