// Remove unused imports:
// - TrendingUp, Users, Wallet, Shield, AlertTriangle
// These are imported but not used in the component

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const TokenCard = ({ tokenData, index }) => {
  const formatNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount);
  };

  const getRiskColor = () => {
    const totalRisk = tokenData.bundleWallets.soldPercentage + tokenData.mevs.soldPercentage;
    if (totalRisk > 150) return 'text-red-400';
    if (totalRisk > 100) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <motion.div
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white truncate">{tokenData.name}</h3>
          <p className="text-sm text-gray-400 font-mono truncate">{tokenData.symbol}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-2xl ${getRiskColor()}`}>🔴🔴🔴</div>
        </div>
      </div>

      {/* Contract Address */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">📃 CA:</span>
          <span className="text-blue-400 font-mono text-xs truncate flex-1">{tokenData.contractAddress}</span>
          <ExternalLink className="w-3 h-3 text-gray-400 hover:text-blue-400 cursor-pointer" />
        </div>
      </div>

      {/* Token Supply */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">🪙 Total Supply:</div>
        <div className="text-white font-semibold">{formatNumber(tokenData.totalSupply)} {tokenData.symbol}</div>
      </div>

      {/* Liquidity Pool */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">💧 Liquidity Pool</div>
        <div className="ml-4 space-y-1 text-xs">
          <div className="text-gray-300">├ Start LP: {formatNumber(tokenData.liquidityPool.startLP)} {tokenData.symbol} / {tokenData.liquidityPool.startETH} Ξ</div>
          <div className="text-gray-300">└ No-LP Supply: {tokenData.liquidityPool.noLPSupply}%</div>
        </div>
      </div>

      {/* Market Cap */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">🧢 Marketcap</div>
        <div className="ml-4 space-y-1 text-xs">
          <div className="text-gray-300">├ Launch MC: {formatUSD(tokenData.marketCap.launch)}</div>
          <div className="text-gray-300">└ MC after Block {tokenData.marketCap.block}: {formatUSD(tokenData.marketCap.current)}</div>
        </div>
      </div>

      {/* Bundle */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">🎁 Bundle</div>
        <div className="ml-4 space-y-1 text-xs">
          <div className="text-gray-300">├ Bundle wallets: {tokenData.bundleWallets.total}</div>
          <div className="text-gray-300">├ Bundle spent: {tokenData.bundleWallets.spent} Ξ</div>
          <div className="text-gray-300">└ Bundled tokens: {formatNumber(tokenData.bundleWallets.tokens)} {tokenData.symbol}</div>
        </div>
      </div>

      {/* Team Supply */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">👥 Team supply</div>
        <div className="ml-4 space-y-1 text-xs">
          <div className="text-gray-300">├ Bundled supply: {tokenData.teamSupply.bundled}%</div>
          <div className="text-gray-300">└ Bundle + No-LP Supply: {tokenData.teamSupply.total}%</div>
        </div>
      </div>

      {/* MEVs */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">🤖 MEVs</div>
        <div className="ml-4 space-y-1 text-xs">
          <div className="text-gray-300">├ Mev wallets: {tokenData.mevs.wallets}</div>
          <div className="text-gray-300">├ Mev spent: {tokenData.mevs.spent} Ξ</div>
          <div className="text-gray-300">└ Mev tokens: {formatNumber(tokenData.mevs.tokens)} {tokenData.symbol}</div>
        </div>
      </div>

      {/* MEV Supply */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">🎯 MEVs supply</div>
        <div className="ml-4 text-xs">
          <div className="text-gray-300">└ Mev supply: {tokenData.mevs.supply}%</div>
        </div>
      </div>

      {/* Bundle Wallets Status */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">💼 Bundle wallets:</div>
        <div className="ml-4 space-y-1 text-xs">
          <div className="text-gray-300">├ Hold: {tokenData.bundleWallets.holdPercentage}%</div>
          <div className="text-gray-300">├ Sold: {tokenData.bundleWallets.soldPercentage}%</div>
          <div className="text-gray-300">└ Transfer: {tokenData.bundleWallets.transferPercentage}%</div>
          <div className="text-gray-400 text-xs mt-1">(Wallets 1-{tokenData.bundleWallets.total})</div>
        </div>
      </div>

      {/* MEV Wallets Status */}
      <div>
        <div className="text-sm text-gray-400 mb-2">🤖 MEV wallets:</div>
        <div className="ml-4 space-y-1 text-xs">
          <div className="text-gray-300">├ Hold: {tokenData.mevs.holdPercentage}%</div>
          <div className="text-gray-300">├ Sold: {tokenData.mevs.soldPercentage}%</div>
          <div className="text-gray-300">└ Transfer: {tokenData.mevs.transferPercentage}%</div>
          <div className="text-gray-400 text-xs mt-1">(Wallets 1-{tokenData.mevs.wallets})</div>
        </div>
      </div>
    </motion.div>
  );
};

const TokenGrid = () => {
  // Sample data for 9 tokens
  const tokensData = [
    {
      name: "Unknown Token",
      symbol: "UNKNOWN",
      contractAddress: "0x1234...5678",
      totalSupply: 1000000000000000000,
      liquidityPool: {
        startLP: 0,
        startETH: "0.00",
        noLPSupply: 0
      },
      marketCap: {
        launch: 0,
        current: 0,
        block: 0
      },
      bundleWallets: {
        total: 0,
        spent: "0.00",
        tokens: 0,
        holdPercentage: 0,
        soldPercentage: 0,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 0,
        total: 0
      },
      mevs: {
        wallets: 0,
        spent: "0.00",
        tokens: 0,
        supply: 0,
        holdPercentage: 0,
        soldPercentage: 0,
        transferPercentage: 0
      }
    },
    {
      name: "HALO AI",
      symbol: "HALO",
      contractAddress: "0xd821...65f0",
      totalSupply: 1000000000,
      liquidityPool: {
        startLP: 500000000,
        startETH: "2.50",
        noLPSupply: 50
      },
      marketCap: {
        launch: 125000,
        current: 89000,
        block: 12345
      },
      bundleWallets: {
        total: 15,
        spent: "12.50",
        tokens: 450000000,
        holdPercentage: 7.8,
        soldPercentage: 92.2,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 45,
        total: 95
      },
      mevs: {
        wallets: 5,
        spent: "3.20",
        tokens: 50000000,
        supply: 5,
        holdPercentage: 0,
        soldPercentage: 100,
        transferPercentage: 0
      }
    },
    {
      name: "SafeMoon V2",
      symbol: "SFM",
      contractAddress: "0xabcd...efgh",
      totalSupply: 1000000000000,
      liquidityPool: {
        startLP: 100000000000,
        startETH: "5.00",
        noLPSupply: 10
      },
      marketCap: {
        launch: 250000,
        current: 180000,
        block: 15678
      },
      bundleWallets: {
        total: 8,
        spent: "8.75",
        tokens: 200000000000,
        holdPercentage: 25,
        soldPercentage: 75,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 20,
        total: 30
      },
      mevs: {
        wallets: 3,
        spent: "1.80",
        tokens: 30000000000,
        supply: 3,
        holdPercentage: 33,
        soldPercentage: 67,
        transferPercentage: 0
      }
    },
    {
      name: "DogeCoin 2.0",
      symbol: "DOGE2",
      contractAddress: "0x9876...5432",
      totalSupply: 100000000000000,
      liquidityPool: {
        startLP: 50000000000000,
        startETH: "15.00",
        noLPSupply: 50
      },
      marketCap: {
        launch: 750000,
        current: 650000,
        block: 18901
      },
      bundleWallets: {
        total: 12,
        spent: "18.50",
        tokens: 25000000000000,
        holdPercentage: 40,
        soldPercentage: 60,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 25,
        total: 75
      },
      mevs: {
        wallets: 7,
        spent: "4.20",
        tokens: 7000000000000,
        supply: 7,
        holdPercentage: 14,
        soldPercentage: 86,
        transferPercentage: 0
      }
    },
    {
      name: "Ethereum Max",
      symbol: "EMAX",
      contractAddress: "0xfedc...ba98",
      totalSupply: 2000000000000000,
      liquidityPool: {
        startLP: 1000000000000000,
        startETH: "25.00",
        noLPSupply: 50
      },
      marketCap: {
        launch: 1250000,
        current: 890000,
        block: 20234
      },
      bundleWallets: {
        total: 20,
        spent: "35.00",
        tokens: 600000000000000,
        holdPercentage: 15,
        soldPercentage: 85,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 30,
        total: 80
      },
      mevs: {
        wallets: 10,
        spent: "8.90",
        tokens: 200000000000000,
        supply: 10,
        holdPercentage: 10,
        soldPercentage: 90,
        transferPercentage: 0
      }
    },
    {
      name: "Baby Shiba",
      symbol: "BSHIB",
      contractAddress: "0x1357...2468",
      totalSupply: 1000000000000000000,
      liquidityPool: {
        startLP: 500000000000000000,
        startETH: "8.00",
        noLPSupply: 50
      },
      marketCap: {
        launch: 400000,
        current: 320000,
        block: 22567
      },
      bundleWallets: {
        total: 6,
        spent: "12.00",
        tokens: 300000000000000000,
        holdPercentage: 50,
        soldPercentage: 50,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 30,
        total: 80
      },
      mevs: {
        wallets: 4,
        spent: "2.40",
        tokens: 40000000000000000,
        supply: 4,
        holdPercentage: 25,
        soldPercentage: 75,
        transferPercentage: 0
      }
    },
    {
      name: "FlokiInu 2.0",
      symbol: "FLOKI2",
      contractAddress: "0x8642...9753",
      totalSupply: 10000000000000000,
      liquidityPool: {
        startLP: 5000000000000000,
        startETH: "12.00",
        noLPSupply: 50
      },
      marketCap: {
        launch: 600000,
        current: 480000,
        block: 24890
      },
      bundleWallets: {
        total: 18,
        spent: "22.00",
        tokens: 3000000000000000,
        holdPercentage: 22,
        soldPercentage: 78,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 30,
        total: 80
      },
      mevs: {
        wallets: 8,
        spent: "5.60",
        tokens: 800000000000000,
        supply: 8,
        holdPercentage: 12,
        soldPercentage: 88,
        transferPercentage: 0
      }
    },
    {
      name: "PepeCoin Max",
      symbol: "PEPEMAX",
      contractAddress: "0x7531...8642",
      totalSupply: 420690000000000,
      liquidityPool: {
        startLP: 210345000000000,
        startETH: "6.90",
        noLPSupply: 50
      },
      marketCap: {
        launch: 345000,
        current: 276000,
        block: 27123
      },
      bundleWallets: {
        total: 14,
        spent: "15.50",
        tokens: 126207000000000,
        holdPercentage: 30,
        soldPercentage: 70,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 30,
        total: 80
      },
      mevs: {
        wallets: 6,
        spent: "3.45",
        tokens: 25241400000000,
        supply: 6,
        holdPercentage: 17,
        soldPercentage: 83,
        transferPercentage: 0
      }
    },
    {
      name: "ShibaMax Pro",
      symbol: "SHIBMAX",
      contractAddress: "0x9642...7531",
      totalSupply: 1000000000000000,
      liquidityPool: {
        startLP: 500000000000000,
        startETH: "10.00",
        noLPSupply: 50
      },
      marketCap: {
        launch: 500000,
        current: 400000,
        block: 29456
      },
      bundleWallets: {
        total: 16,
        spent: "20.00",
        tokens: 300000000000000,
        holdPercentage: 19,
        soldPercentage: 81,
        transferPercentage: 0
      },
      teamSupply: {
        bundled: 30,
        total: 80
      },
      mevs: {
        wallets: 9,
        spent: "6.00",
        tokens: 90000000000000,
        supply: 9,
        holdPercentage: 11,
        soldPercentage: 89,
        transferPercentage: 0
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">Token Analysis Grid</h1>
          <p className="text-gray-300">Real-time monitoring of 9 tokens with comprehensive analytics</p>
        </motion.div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokensData.map((tokenData, index) => (
            <TokenCard key={index} tokenData={tokenData} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenGrid;