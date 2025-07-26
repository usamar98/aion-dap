import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, TrendingUp, TrendingDown, Wallet, DollarSign, Clock } from 'lucide-react';

const AlertPopup = ({ alert, onClose, autoClose = true }) => {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (autoClose) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoClose, onClose]);

  if (!alert) return null;

  const isSell = alert.transactionType === 'sell';
  const bgColor = isSell ? 'bg-red-900/90' : 'bg-green-900/90';
  const borderColor = isSell ? 'border-red-500' : 'border-green-500';
  const textColor = isSell ? 'text-red-300' : 'text-green-300';
  const icon = isSell ? TrendingDown : TrendingUp;
  const IconComponent = icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 z-50 max-w-md"
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={`${bgColor} ${borderColor} border-2 rounded-xl p-4 backdrop-blur-sm shadow-2xl`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IconComponent className={`w-5 h-5 ${textColor}`} />
              <span className={`font-bold text-lg ${textColor}`}>
                {isSell ? '🔴 SELL ALERT' : '🟢 BUY ALERT'}
              </span>
              {alert.isRealTime && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  LIVE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {autoClose && (
                <span className="text-gray-400 text-sm">{timeLeft}s</span>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">Wallet Type:</span>
              <span className="text-white font-semibold">{alert.walletType}</span>
            </div>
            <div className="text-gray-400 text-xs font-mono break-all">
              {alert.walletAddress}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">Amount</div>
              <div className="text-white font-semibold">
                {alert.amount.toFixed(4)}
              </div>
              <div className="text-gray-500 text-xs">tokens</div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded-lg">
              <div className="text-gray-400 text-xs mb-1">USD Value</div>
              <div className="text-green-400 font-semibold">
                ${alert.usdValue.toFixed(2)}
              </div>
              <div className="text-gray-500 text-xs">
                {alert.changePercentage}% change
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-gray-800/50 p-2 rounded-lg mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-xs">Token Price</div>
                <div className="text-white font-semibold">
                  ${alert.currentPrice?.toFixed(6) || 'N/A'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs">Network</div>
                <div className="text-blue-400 font-semibold uppercase">
                  {alert.network}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock className="w-3 h-3" />
              {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
            <a
              href={alert.explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
            >
              View Tx <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertPopup;