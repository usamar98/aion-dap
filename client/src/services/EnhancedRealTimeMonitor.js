import WalletAnalyticsService from './WalletAnalyticsService';

class EnhancedRealTimeMonitor {
  constructor() {
    this.walletService = new WalletAnalyticsService();
    this.monitoredWallets = new Map();
    this.alertCallbacks = new Set();
    this.updateCallbacks = new Set();
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.websocketConnection = null;
    
    // DEX addresses for sell detection
    this.dexAddresses = new Set([
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
      '0xe592427a0aece92de3edee1f18e0157c05861564', // Uniswap V3 Router
      '0x10ed43c718714eb63d5aa57b78b54704e256024e', // PancakeSwap Router
      '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', // SushiSwap Router
    ]);
  }

  // Initialize monitoring
  async initialize({ tokenAddress, blockchain, wallets }) {
    this.tokenAddress = tokenAddress;
    this.blockchain = blockchain;
    
    // Setup monitored wallets
    for (const wallet of wallets) {
      this.monitoredWallets.set(wallet.address, {
        ...wallet,
        lastBalance: wallet.balance,
        lastChecked: Date.now(),
        alertCount: 0,
        isActive: false
      });
    }
    
    console.log(`🔍 Initialized monitoring for ${wallets.length} wallets`);
  }

  // Start real-time monitoring
  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🚀 Starting real-time monitoring...');
    
    // Start WebSocket connection for real-time updates
    await this.initializeWebSocket();
    
    // Start polling for balance changes
    this.startPolling();
    
    // Start transaction monitoring
    this.startTransactionMonitoring();
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    if (this.websocketConnection) {
      this.websocketConnection.close();
      this.websocketConnection = null;
    }
    
    console.log('⏹️ Stopped real-time monitoring');
  }

  // Initialize WebSocket connection
  async initializeWebSocket() {
    try {
      // Use Alchemy WebSocket for real-time updates
      const wsUrl = `wss://eth-mainnet.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      
      this.websocketConnection = new WebSocket(wsUrl);
      
      this.websocketConnection.onopen = () => {
        console.log('🔌 WebSocket connected');
        
        // Subscribe to address activity
        const addresses = Array.from(this.monitoredWallets.keys());
        this.websocketConnection.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_subscribe',
          params: ['alchemy_pendingTransactions', {
            fromAddress: addresses,
            toAddress: addresses
          }]
        }));
      };
      
      this.websocketConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'eth_subscription') {
          this.handleWebSocketTransaction(data.params.result);
        }
      };
      
      this.websocketConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
      this.websocketConnection.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.isMonitoring) {
            this.initializeWebSocket();
          }
        }, 5000);
      };
      
    } catch (error) {
      console.error('❌ WebSocket initialization error:', error);
    }
  }

  // Handle WebSocket transaction
  handleWebSocketTransaction(tx) {
    const fromWallet = this.monitoredWallets.get(tx.from?.toLowerCase());
    const toWallet = this.monitoredWallets.get(tx.to?.toLowerCase());
    
    if (fromWallet || toWallet) {
      // Check if it's a DEX transaction (potential sell)
      if (this.dexAddresses.has(tx.to?.toLowerCase())) {
        this.handlePotentialSell(tx, fromWallet);
      }
      
      // Update wallet activity
      if (fromWallet) {
        fromWallet.isActive = true;
        fromWallet.lastActivity = Date.now();
      }
      if (toWallet) {
        toWallet.isActive = true;
        toWallet.lastActivity = Date.now();
      }
    }
  }

  // Handle potential sell transaction
  handlePotentialSell(tx, wallet) {
    if (!wallet) return;
    
    const alert = {
      type: 'DEX_SELL_DETECTED',
      severity: 'high',
      message: `${wallet.type} detected selling to DEX`,
      walletAddress: wallet.address,
      walletType: wallet.type,
      txHash: tx.hash,
      dexAddress: tx.to,
      timestamp: Date.now()
    };
    
    this.triggerAlert(alert);
    wallet.alertCount++;
  }

  // Start polling for balance changes
  startPolling() {
    this.monitorInterval = setInterval(async () => {
      await this.checkAllWallets();
    }, 30000); // Check every 30 seconds
  }

  // Start transaction monitoring
  startTransactionMonitoring() {
    // Monitor for large transfers, coordinated sells, etc.
    setInterval(async () => {
      await this.checkCoordinatedActivity();
    }, 60000); // Check every minute
  }

  // Check all monitored wallets
  async checkAllWallets() {
    const promises = Array.from(this.monitoredWallets.values()).map(wallet => 
      this.checkWalletChanges(wallet)
    );
    
    await Promise.allSettled(promises);
  }

  // Check individual wallet for changes
  async checkWalletChanges(wallet) {
    try {
      const currentBalance = await this.walletService.getTokenBalance(
        wallet.address,
        this.tokenAddress,
        this.blockchain
      );
      
      if (currentBalance !== null && currentBalance !== wallet.lastBalance) {
        const balanceChange = currentBalance - wallet.lastBalance;
        const percentChange = (balanceChange / wallet.lastBalance) * 100;
        
        // Detect significant balance changes
        if (Math.abs(percentChange) > 5) {
          const alert = {
            type: balanceChange > 0 ? 'BALANCE_INCREASE' : 'BALANCE_DECREASE',
            severity: Math.abs(percentChange) > 20 ? 'high' : 'medium',
            message: `${wallet.type} balance changed by ${percentChange.toFixed(2)}%`,
            walletAddress: wallet.address,
            walletType: wallet.type,
            oldBalance: wallet.lastBalance,
            newBalance: currentBalance,
            changePercent: percentChange,
            timestamp: Date.now()
          };
          
          this.triggerAlert(alert);
        }
        
        // Update wallet data
        wallet.lastBalance = currentBalance;
        wallet.currentBalance = currentBalance;
        wallet.lastChecked = Date.now();
        
        // Trigger update callback
        this.triggerUpdate({
          address: wallet.address,
          currentBalance,
          lastActivity: wallet.lastActivity,
          isActive: wallet.isActive,
          usdValue: currentBalance * (await this.getTokenPrice()),
          sellPressure: await this.calculateSellPressure(wallet)
        });
      }
      
    } catch (error) {
      console.error(`❌ Error checking wallet ${wallet.address}:`, error);
    }
  }

  // Check for coordinated activity
  async checkCoordinatedActivity() {
    try {
      const wallets = Array.from(this.monitoredWallets.values());
      const recentActivity = wallets.filter(w => 
        w.lastActivity && Date.now() - w.lastActivity < 5 * 60 * 1000 // Last 5 minutes
      );
      
      if (recentActivity.length >= 3) {
        const alert = {
          type: 'COORDINATED_ACTIVITY',
          severity: 'high',
          message: `${recentActivity.length} wallets showing coordinated activity`,
          walletAddresses: recentActivity.map(w => w.address),
          timestamp: Date.now()
        };
        
        this.triggerAlert(alert);
      }
    } catch (error) {
      console.error('❌ Error checking coordinated activity:', error);
    }
  }

  // Calculate sell pressure
  async calculateSellPressure(wallet) {
    try {
      const txHistory = await this.walletService.getTransactionHistory(
        wallet.address,
        this.tokenAddress,
        this.blockchain,
        20
      );
      
      const recentTxs = txHistory.filter(tx => 
        Date.now() - tx.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );
      
      const sells = recentTxs.filter(tx => tx.from.toLowerCase() === wallet.address.toLowerCase());
      const buys = recentTxs.filter(tx => tx.to.toLowerCase() === wallet.address.toLowerCase());
      
      const sellVolume = sells.reduce((sum, tx) => sum + tx.value, 0);
      const buyVolume = buys.reduce((sum, tx) => sum + tx.value, 0);
      
      return sellVolume / (sellVolume + buyVolume) || 0;
    } catch (error) {
      return 0;
    }
  }

  // Get current token price
  async getTokenPrice() {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${this.tokenAddress}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        return parseFloat(data.pairs[0].priceUsd);
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Trigger alert
  triggerAlert(alert) {
    console.log('🚨 Alert triggered:', alert);
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('❌ Alert callback error:', error);
      }
    });
  }

  // Trigger update
  triggerUpdate(updateData) {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(updateData);
      } catch (error) {
        console.error('❌ Update callback error:', error);
      }
    });
  }

  // Subscribe to alerts
  onAlert(callback) {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  // Subscribe to wallet updates
  onWalletUpdate(callback) {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  // Get monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      walletCount: this.monitoredWallets.size,
      connected: this.websocketConnection?.readyState === WebSocket.OPEN,
      lastCheck: Math.max(...Array.from(this.monitoredWallets.values()).map(w => w.lastChecked || 0))
    };
  }
}

export default EnhancedRealTimeMonitor;