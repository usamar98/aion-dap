import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import DexScreenerService from '../services/DexScreenerService';

const RealTimeDataCard = ({ contractAddress, network = 'ethereum' }) => {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const dexScreenerService = new DexScreenerService();

  useEffect(() => {
    if (contractAddress) {
      fetchRealTimeData();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchRealTimeData, 30000);
      return () => clearInterval(interval);
    }
  }, [contractAddress, network]);

  const fetchRealTimeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await dexScreenerService.getTokenData(contractAddress, network);
      setTokenData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openDexScreener = () => {
    window.open(`https://dexscreener.com/${network}/${contractAddress}`, '_blank');
  };

  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriceChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Fetching real-time data from DexScreener...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-red-700 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button 
          onClick={fetchRealTimeData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
        <p className="text-gray-300">No real-time data available</p>
      </div>
    );
  }

  const realTimeCards = [
    {
      title: "Token Info",
      icon: "🏷️",
      content: (
        <div className="text-xs">
          <div className="font-semibold">{tokenData.name}</div>
          <div className="text-gray-400">{tokenData.symbol}</div>
        </div>
      ),
      color: "text-blue-400"
    },
    {
      title: "Current Price",
      icon: "💰",
      content: (
        <div className="text-xs">
          <div className="font-semibold">{dexScreenerService.formatPrice(tokenData.price)}</div>
          <div className={`flex items-center gap-1 ${getPriceChangeColor(tokenData.priceChange24h)}`}>
            {getPriceChangeIcon(tokenData.priceChange24h)}
            {dexScreenerService.formatPercentage(tokenData.priceChange24h)}
          </div>
        </div>
      ),
      color: "text-green-400"
    },
    {
      title: "24h Volume",
      icon: "📊",
      content: (
        <div className="text-xs">
          <div className="font-semibold">{dexScreenerService.formatLargeNumber(tokenData.volume24h)}</div>
          <div className="text-gray-400">24h trading</div>
        </div>
      ),
      color: "text-cyan-400"
    },
    {
      title: "Liquidity",
      icon: "💧",
      content: (
        <div className="text-xs">
          <div className="font-semibold">{dexScreenerService.formatLargeNumber(tokenData.liquidity)}</div>
          <div className="text-gray-400">Total liquidity</div>
        </div>
      ),
      color: "text-purple-400"
    },
    {
      title: "Market Cap",
      icon: "🧢",
      content: (
        <div className="text-xs">
          <div className="font-semibold">{dexScreenerService.formatLargeNumber(tokenData.marketCap)}</div>
          <div className="text-gray-400">Market cap</div>
        </div>
      ),
      color: "text-yellow-400"
    },
    {
      title: "5m Change",
      icon: "⚡",
      content: (
        <div className={`text-xs ${getPriceChangeColor(tokenData.priceChange5m)}`}>
          <div className="flex items-center gap-1">
            {getPriceChangeIcon(tokenData.priceChange5m)}
            <span className="font-semibold">{dexScreenerService.formatPercentage(tokenData.priceChange5m)}</span>
          </div>
          <div className="text-gray-400">5min change</div>
        </div>
      ),
      color: "text-orange-400"
    },
    {
      title: "1h Change",
      icon: "🕐",
      content: (
        <div className={`text-xs ${getPriceChangeColor(tokenData.priceChange1h)}`}>
          <div className="flex items-center gap-1">
            {getPriceChangeIcon(tokenData.priceChange1h)}
            <span className="font-semibold">{dexScreenerService.formatPercentage(tokenData.priceChange1h)}</span>
          </div>
          <div className="text-gray-400">1hr change</div>
        </div>
      ),
      color: "text-pink-400"
    },
    {
      title: "24h Transactions",
      icon: "🔄",
      content: (
        <div className="text-xs">
          <div className="text-green-400">Buys: {tokenData.txns24h.buys}</div>
          <div className="text-red-400">Sells: {tokenData.txns24h.sells}</div>
        </div>
      ),
      color: "text-indigo-400"
    },
    {
      title: "DEX Info",
      icon: "🏪",
      content: (
        <div className="text-xs">
          <div className="font-semibold">{tokenData.dexId}</div>
          <div className="text-gray-400">{tokenData.chainId}</div>
        </div>
      ),
      color: "text-teal-400"
    },
    {
      title: "FDV",
      icon: "💎",
      content: (
        <div className="text-xs">
          <div className="font-semibold">{dexScreenerService.formatLargeNumber(tokenData.fdv)}</div>
          <div className="text-gray-400">Fully diluted</div>
        </div>
      ),
      color: "text-emerald-400"
    }
  ];

  return (
    <motion.div 
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Real-Time Token Analysis</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => copyToClipboard(contractAddress)}
            className="text-blue-400 hover:text-blue-300 p-1"
            title="Copy Contract Address"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={openDexScreener}
            className="text-purple-400 hover:text-purple-300 p-1"
            title="Open in DexScreener"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button 
            onClick={fetchRealTimeData}
            className="text-green-400 hover:text-green-300 p-1"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contract Address */}
      <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
        <div className="text-sm text-gray-400 mb-1">📃 Contract Address:</div>
        <div className="text-blue-400 font-mono text-sm break-all">{contractAddress}</div>
      </div>

      {/* Real-time Data Grid - 5 per row */}
      <div className="grid grid-cols-5 gap-4">
        {realTimeCards.map((card, index) => (
          <motion.div
            key={index}
            className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 hover:border-gray-500 transition-all duration-200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className={`text-sm font-semibold mb-2 ${card.color}`}>
                {card.title}
              </div>
              <div className="text-gray-300 text-xs">
                {card.content}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-xs text-gray-400">
        <div>Data from DexScreener</div>
        <div>Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}</div>
        <div className="text-green-400 mt-1">🟢 Auto-refreshing every 30 seconds</div>
      </div>
    </motion.div>
  );
};

export default RealTimeDataCard;