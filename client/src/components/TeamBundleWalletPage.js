import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Activity, AlertTriangle, TrendingDown, Zap, X, Shield, Eye, Bell } from 'lucide-react';
import WalletAnalyticsService from '../services/WalletAnalyticsService';
import RealTimeMonitor from '../services/RealTimeMonitor';
import TelegramAlertService from '../services/TelegramAlertService';

const TeamBundleWalletPage = () => {
  // Core state
  const [contractAddress, setContractAddress] = useState('');
  const [blockchain, setBlockchain] = useState('ethereum');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Real-time monitoring state
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  
  // Services
  const walletService = useRef(new WalletAnalyticsService());
  const realTimeMonitor = useRef(new RealTimeMonitor());
  const telegramService = useRef(new TelegramAlertService());

  const blockchains = [
    { id: 'ethereum', name: 'Ethereum', chainId: 1 },
    { id: 'bsc', name: 'BSC', chainId: 56 },
    { id: 'base', name: 'Base', chainId: 8453 },
    { id: 'polygon', name: 'Polygon', chainId: 137 },
    { id: 'arbitrum', name: 'Arbitrum', chainId: 42161 }
  ];

  // Handle wallet analysis
  // Handle wallet analysis
  const handleAnalyze = async () => {
    if (!contractAddress.trim()) {
      setError('Please enter a valid contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResults(null);

    try {
      console.log(`🔍 Starting analysis for ${contractAddress} on ${blockchain}`);
      
      // Step 1: Get contract deployer (optional)
      const deployer = await walletService.current.getContractDeployer(contractAddress, blockchain);
      if (deployer) {
        console.log('✅ Deployer found:', deployer);
      } else {
        console.log('⚠️ Deployer not available - continuing analysis');
      }
      
      // Step 2: Get token metadata from Moralis
      const tokenMetadata = await walletService.current.getTokenMetadata(contractAddress, blockchain);
      console.log('✅ Token metadata:', tokenMetadata);
      
      // Step 3: Get top 100 holders from Moralis
      const topHolders = await walletService.current.getTopHolders(contractAddress, blockchain);
      console.log('✅ Top holders found:', topHolders.length, 'holders');
      console.log('📊 Sample holder percentages:', topHolders.slice(0, 5).map(h => ({ address: h.address.slice(0, 8) + '...', percentage: h.percentage })));
      
      // Step 4: Classify wallets (works with or without deployer)
      const classification = await walletService.current.classifyWallets(
        topHolders,
        deployer, // May be null
        tokenMetadata,
        blockchain
      );
      console.log('✅ Classification complete:', {
        teamWallets: classification.teamWallets.length,
        bundleWallets: classification.bundleWallets.length,
        regularWallets: classification.regularWallets.length
      });
      
      const results = {
        contractAddress,
        blockchain,
        deployer, // May be null
        tokenMetadata,
        topHolders,
        teamWallets: classification.teamWallets,
        bundleWallets: classification.bundleWallets,
        analysisTimestamp: Date.now()
      };
      
      setAnalysisResults(results);
      
      // Auto-start real-time monitoring
      setTimeout(() => {
        startRealTimeMonitoring(results);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Analysis error:', error);
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Start real-time monitoring
  // Update the startRealTimeMonitoring function
  const startRealTimeMonitoring = useCallback(async (results = analysisResults) => {
    if (!results) {
      console.error('❌ No results provided for monitoring');
      return;
    }
    
    try {
      console.log('🔍 Starting monitoring with results:', {
        hasTeamWallets: !!results.teamWallets,
        teamWalletsLength: results.teamWallets?.length || 0,
        hasBundleWallets: !!results.bundleWallets,
        bundleWalletsLength: results.bundleWallets?.length || 0
      });
      
      // Ensure arrays are defined before spreading
      const teamWallets = Array.isArray(results.teamWallets) ? results.teamWallets : [];
      const bundleWallets = Array.isArray(results.bundleWallets) ? results.bundleWallets : [];
      const allWallets = [...teamWallets, ...bundleWallets];
      
      console.log(`📊 Monitoring setup: ${teamWallets.length} team + ${bundleWallets.length} bundle = ${allWallets.length} total wallets`);
      
      // Check if there are any wallets to monitor
      if (allWallets.length === 0) {
        console.log('⚠️ No wallets to monitor');
        setError('No team or bundle wallets detected for monitoring');
        return;
      }
      
      // Initialize real-time monitor
      console.log('🔧 Initializing monitor...');
      await realTimeMonitor.current.initialize({
        tokenAddress: results.contractAddress,
        blockchain: results.blockchain,
        wallets: allWallets
      });
      
      // Subscribe to alerts
      realTimeMonitor.current.onAlert((alert) => {
        setLiveAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
        
        // Send Telegram alert for suspicious activity
        if (alert.severity === 'high') {
          telegramService.current.sendAlert(alert);
        }
      });
      
      // Subscribe to wallet updates
      realTimeMonitor.current.onWalletUpdate((walletData) => {
        setRealTimeData(prev => ({
          ...prev,
          [walletData.address]: walletData
        }));
      });
      
      // Start monitoring
      console.log('▶️ Starting monitoring...');
      const started = await realTimeMonitor.current.startMonitoring();
      
      if (started) {
        setMonitoringActive(true);
        console.log('✅ Monitoring started successfully');
      } else {
        console.error('❌ Failed to start monitoring');
        setError('Failed to start monitoring');
      }
      
      // Update monitoring status
      setInterval(() => {
        setMonitoringStatus(realTimeMonitor.current.getStatus());
      }, 5000);
      
    } catch (error) {
      console.error('❌ Monitoring error:', error);
      setError(`Monitoring failed: ${error.message}`);
    }
  }, [analysisResults]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    realTimeMonitor.current.stopMonitoring();
    setMonitoringActive(false);
    setMonitoringStatus(null);
  }, []);

  // Format utilities
  const formatTokenAmount = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringActive) {
        stopMonitoring();
      }
    };
  }, [monitoringActive, stopMonitoring]);

  const formatPercentage = (percentage) => {
    if (!percentage) return '0%';
    return `${percentage.toFixed(2)}%`;
  };

  const formatUSD = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getWalletRiskColor = (wallet) => {
    if (wallet.type === 'Team Wallet') {
      return wallet.supplyPercentage > 5 ? 'text-red-400' : 'text-yellow-400';
    }
    return 'text-orange-400';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringActive) {
        stopMonitoring();
      }
    };
  }, [monitoringActive, stopMonitoring]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-white mb-4">Team & Bundle Wallet Analysis</h1>
        <p className="text-gray-400 text-lg">Real-time blockchain wallet scanner with live monitoring and alerts</p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Contract Address
              </label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Blockchain
              </label>
              <select
                value={blockchain}
                onChange={(e) => setBlockchain(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {blockchains.map(chain => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !contractAddress.trim()}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze Wallets
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Real-time Monitoring Controls */}
      {analysisResults && (
        <motion.div
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time Monitoring
              {monitoringActive && <span className="text-green-400 text-sm animate-pulse">● LIVE</span>}
            </h3>
            <div className="flex gap-2">
              {!monitoringActive ? (
                <button
                  onClick={() => startRealTimeMonitoring()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Start Monitoring
                </button>
              ) : (
                <button
                  onClick={stopMonitoring}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Stop Monitoring
                </button>
              )}
            </div>
          </div>
          
          {monitoringStatus && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">Monitored Wallets</div>
                <div className="text-white font-semibold">{monitoringStatus.walletCount}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">Live Alerts</div>
                <div className="text-yellow-400 font-semibold">{liveAlerts.length}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">Connection</div>
                <div className={`font-semibold ${monitoringStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                  {monitoringStatus.connected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="text-gray-400">Last Check</div>
                <div className="text-white font-semibold">
                  {monitoringStatus.lastCheck ? new Date(monitoringStatus.lastCheck).toLocaleTimeString() : 'Never'}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          className="bg-red-900/20 border border-red-700/50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Error</span>
          </div>
          <p className="text-red-300">{error}</p>
        </motion.div>
      )}

      {/* Live Alerts */}
      {liveAlerts.length > 0 && (
        <motion.div
          className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            Live Alerts ({liveAlerts.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {liveAlerts.slice(0, 10).map((alert, index) => (
              <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-400' :
                      alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`} />
                    <span className="text-white font-medium">{alert.type}</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                {alert.walletAddress && (
                  <p className="text-blue-400 text-xs mt-1 font-mono">{alert.walletAddress}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Token Metadata */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Token Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Name</div>
                <div className="text-white font-semibold">{analysisResults.tokenMetadata.name}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Symbol</div>
                <div className="text-white font-semibold">{analysisResults.tokenMetadata.symbol}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Total Supply</div>
                <div className="text-white font-semibold">
                  {formatTokenAmount(analysisResults.tokenMetadata.totalSupply)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Deployer</div>
                <div className="text-blue-400 font-mono text-sm">
                  {analysisResults.deployer?.address || 'Not Available'}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Deploy Block</div>
                <div className="text-white font-semibold">
                  {analysisResults.deployer?.blockNumber || 'Not Available'}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Blockchain</div>
                <div className="text-white font-semibold capitalize">{analysisResults.blockchain}</div>
              </div>
            </div>
          </div>

          {/* Team Wallets */}
          {analysisResults && (
            <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 backdrop-blur-sm border border-blue-700/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Team Wallets ({(analysisResults.teamWallets || []).length})
                {monitoringActive && <span className="text-green-400 text-sm animate-pulse">● LIVE</span>}
              </h3>
              
              {(analysisResults.teamWallets || []).length > 0 ? (
                <div className="space-y-4">
                  {analysisResults.teamWallets.map((wallet, index) => {
                    const liveData = realTimeData[wallet.address];
                    return (
                      <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-blue-700/30">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-blue-400 font-mono text-sm">{wallet.address}</div>
                            <div className="text-gray-400 text-xs">{wallet.reason}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">
                              {formatTokenAmount(liveData?.currentBalance || wallet.balance)}
                            </div>
                            <div className="text-blue-400 text-xs">
                              {formatPercentage(wallet.supplyPercentage)} of supply
                            </div>
                          </div>
                        </div>
                        
                        {liveData && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-blue-700/30">
                            <div>
                              <div className="text-gray-400 text-xs">USD Value</div>
                              <div className="text-green-400 font-semibold">
                                {formatUSD(liveData.usdValue)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs">Last Activity</div>
                              <div className="text-white text-sm">
                                {liveData.lastActivity ? new Date(liveData.lastActivity).toLocaleDateString() : 'No activity'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs">Risk Level</div>
                              <div className={`font-semibold ${
                                wallet.supplyPercentage > 5 ? 'text-red-400' : 
                                wallet.supplyPercentage > 2 ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {wallet.supplyPercentage > 5 ? 'High' : 
                                 wallet.supplyPercentage > 2 ? 'Medium' : 'Low'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs">Status</div>
                              <div className={`font-semibold ${
                                liveData.isActive ? 'text-green-400' : 'text-gray-400'
                              }`}>
                                {liveData.isActive ? '🟢 Active' : '⚫ Inactive'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-400 text-4xl mb-4">✅</div>
                  <div className="text-white font-semibold mb-2">No team wallets detected</div>
                  <div className="text-gray-400 text-sm">This token appears to have no large team holdings</div>
                </div>
              )}
            </div>
          )}

          {/* Bundle Wallets */}
          {analysisResults && (
            <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-sm border border-red-700/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Bundle Wallets ({(analysisResults.bundleWallets || []).length})
                {monitoringActive && <span className="text-green-400 text-sm animate-pulse">● LIVE</span>}
              </h3>
              
              {(analysisResults.bundleWallets || []).length > 0 ? (
                <div className="space-y-4">
                  {analysisResults.bundleWallets.map((wallet, index) => {
                    const liveData = realTimeData[wallet.address];
                    return (
                      <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-red-700/30">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-red-400 font-mono text-sm">{wallet.address}</div>
                            <div className="text-gray-400 text-xs">{wallet.reason}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">
                              {formatTokenAmount(liveData?.currentBalance || wallet.balance)}
                            </div>
                            <div className="text-red-400 text-xs">
                              {formatPercentage(wallet.supplyPercentage)} of supply
                            </div>
                          </div>
                        </div>
                        
                        {liveData && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-red-700/30">
                            <div>
                              <div className="text-gray-400 text-xs">USD Value</div>
                              <div className="text-green-400 font-semibold">
                                {formatUSD(liveData.usdValue)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs">Last Activity</div>
                              <div className="text-white text-sm">
                                {liveData.lastActivity ? new Date(liveData.lastActivity).toLocaleDateString() : 'No activity'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs">Sell Pressure</div>
                              <div className={`font-semibold ${
                                liveData.sellPressure > 0.7 ? 'text-red-400' : 
                                liveData.sellPressure > 0.3 ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {liveData.sellPressure ? `${(liveData.sellPressure * 100).toFixed(1)}%` : '0%'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs">Status</div>
                              <div className={`font-semibold ${
                                liveData.isActive ? 'text-green-400' : 'text-gray-400'
                              }`}>
                                {liveData.isActive ? '🟢 Active' : '⚫ Inactive'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-400 text-4xl mb-4">✅</div>
                  <div className="text-white font-semibold mb-2">No bundle wallets detected</div>
                  <div className="text-gray-400 text-sm">This token appears to have no coordinated wallet activity</div>
                </div>
              )}
            </div>
          )}

          {/* Risk Assessment */}
          <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 backdrop-blur-sm border border-purple-700/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Risk Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Overall Risk</div>
                <div className={`text-2xl font-bold ${
                  analysisResults.teamWallets.length > 3 || analysisResults.bundleWallets.length > 5 ? 'text-red-400' :
                  analysisResults.teamWallets.length > 1 || analysisResults.bundleWallets.length > 2 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {analysisResults.teamWallets.length > 3 || analysisResults.bundleWallets.length > 5 ? 'HIGH' :
                   analysisResults.teamWallets.length > 1 || analysisResults.bundleWallets.length > 2 ? 'MEDIUM' :
                   'LOW'}
                </div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Team Concentration</div>
                <div className="text-white text-lg font-semibold">
                  {formatPercentage(
                    analysisResults.teamWallets.reduce((sum, w) => sum + w.supplyPercentage, 0)
                  )}
                </div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Bundle Concentration</div>
                <div className="text-white text-lg font-semibold">
                  {formatPercentage(
                    analysisResults.bundleWallets.reduce((sum, w) => sum + w.supplyPercentage, 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TeamBundleWalletPage;