import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { Wallet, LogOut, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

const Header = ({ activeSection, setActiveSection }) => {
  const { isConnected, account, connectWallet, disconnectWallet } = useWeb3();
  const headerRef = useRef(null);
  const [cryptoData, setCryptoData] = useState([
    { symbol: 'BTC', price: 43250.50, change: 2.45, isPositive: true },
    { symbol: 'ETH', price: 2580.75, change: -1.23, isPositive: false },
    { symbol: 'BNB', price: 315.20, change: 0.85, isPositive: true },
    { symbol: 'ADA', price: 0.485, change: 3.12, isPositive: true },
    { symbol: 'SOL', price: 98.45, change: -0.67, isPositive: false },
    { symbol: 'DOT', price: 7.23, change: 1.89, isPositive: true },
    { symbol: 'MATIC', price: 0.92, change: -2.15, isPositive: false },
    { symbol: 'AVAX', price: 36.78, change: 4.56, isPositive: true }
  ]);

  useEffect(() => {
    gsap.fromTo(headerRef.current, 
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );

    // Simulate real-time price updates
    const interval = setInterval(() => {
      setCryptoData(prev => prev.map(coin => ({
        ...coin,
        price: coin.price + (Math.random() - 0.5) * coin.price * 0.02,
        change: (Math.random() - 0.5) * 10,
        isPositive: Math.random() > 0.5
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price) => {
    return price < 1 ? price.toFixed(4) : price.toFixed(2);
  };

  return (
    <motion.header 
      ref={headerRef}
      className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-800"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Back Button */}
          <div className="flex items-center space-x-4">
            {activeSection !== 'dashboard' && (
              <motion.button
                onClick={() => setActiveSection('dashboard')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            )}
            <img src="/AioAi.jpg" alt="Aion Ai" className="h-8 w-8 rounded" />
          </div>

          {/* Crypto Ticker */}
          <div className="flex-1 mx-8 overflow-hidden">
            <div className="relative h-8 bg-gray-900/50 rounded-lg">
              <div className="absolute inset-0 flex items-center">
                <div className="animate-marquee flex space-x-8 whitespace-nowrap">
                  {[...cryptoData, ...cryptoData, ...cryptoData].map((coin, index) => (
                    <div key={`${coin.symbol}-${index}`} className="flex items-center space-x-2 text-sm">
                      <span className="text-white font-semibold">{coin.symbol}</span>
                      <span className="text-gray-300">${formatPrice(coin.price)}</span>
                      <div className={`flex items-center space-x-1 ${
                        coin.isPositive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {coin.isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs">
                          {coin.isPositive ? '+' : ''}{coin.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm font-medium text-white">
                  {formatAddress(account)}
                </div>
                <motion.button
                  onClick={disconnectWallet}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={connectWallet}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg hover:from-gray-700 hover:to-gray-600 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Wallet className="w-4 h-4" />
                <span>Connected</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;