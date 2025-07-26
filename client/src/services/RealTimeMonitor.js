import axios from 'axios';
import { ethers } from 'ethers';
import WalletAnalyticsService from './WalletAnalyticsService';

class RealTimeMonitor {
  constructor() {
    this.monitoredWallets = new Map();
    this.alertSubscribers = new Set();
    this.updateSubscribers = new Set(); // Add this
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.tokenAddress = null; // Add this
    this.blockchain = null; // Add this
  }

  // Add initialize method (place this after constructor)
  async initialize({ tokenAddress, blockchain, wallets }) {
    this.tokenAddress = tokenAddress;
    this.blockchain = blockchain;
    
    // Clear existing wallets
    this.monitoredWallets.clear();
    
    // Ensure wallets is an array
    if (!Array.isArray(wallets)) {
      console.error('❌ Wallets parameter must be an array');
      throw new Error('Wallets parameter must be an array');
    }
    
    // Check if wallets array is empty
    if (wallets.length === 0) {
      console.log('⚠️ No wallets provided for monitoring');
      return true;
    }
    
    // Setup monitored wallets
    for (const wallet of wallets) {
      if (!wallet || !wallet.address) {
        console.warn('⚠️ Skipping invalid wallet:', wallet);
        continue;
      }
      
      this.monitoredWallets.set(wallet.address.toLowerCase(), {
        ...wallet,
        tokenAddress,
        network: blockchain,
        lastBalance: null,
        lastChecked: null,
        alertCount: 0,
        totalVolumeSold: 0
      });
    }
    
    console.log(`🔍 Initialized monitoring for ${this.monitoredWallets.size} wallets`);
    return true;
  }

  // Add onAlert method for compatibility
  onAlert(callback) {
    return this.subscribe(callback);
  }

  // Add onWalletUpdate method
  onWalletUpdate(callback) {
    this.updateSubscribers.add(callback);
    
    return () => {
      this.updateSubscribers.delete(callback);
    };
  }

  // Update notifySubscribers to handle wallet updates
  notifyWalletUpdate(walletData) {
    this.updateSubscribers.forEach(callback => {
      try {
        callback(walletData);
      } catch (error) {
        console.error('Error notifying wallet update subscriber:', error);
      }
    });
  }

  // Start monitoring flagged wallets
  // Add these methods to RealTimeMonitor class
  
  // Enhanced monitoring with better performance
  async startMonitoring() {
    if (!this.tokenAddress || !this.blockchain) {
      throw new Error('Monitor not initialized. Call initialize() first.');
    }
    
    if (this.monitoredWallets.size === 0) {
      console.log('⚠️ No wallets to monitor');
      return false;
    }
    
    if (this.isMonitoring) {
      console.log('⚠️ Monitoring already active');
      return true;
    }
    
    this.isMonitoring = true;
    this.startPolling();
    
    console.log(`🔍 Started monitoring ${this.monitoredWallets.size} wallets`);
    return true;
  }

  // Update the existing startMonitoring method to avoid conflicts
  startMonitoringLegacy(wallets, tokenAddress, network = 'ethereum') {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }
    
    // Ensure wallets is an array
    if (!Array.isArray(wallets)) {
      console.error('❌ Wallets parameter must be an array');
      return false;
    }
    
    // Add wallets to monitoring list with enhanced data
    wallets.forEach(wallet => {
      this.monitoredWallets.set(wallet.address, {
        ...wallet,
        tokenAddress,
        network,
        lastBalance: null,
        lastChecked: null,
        alertCount: 0,
        totalVolumeSold: 0
      });
    });
    
    this.isMonitoring = true;
    this.startPolling();
    
    console.log(`🔍 Started enhanced monitoring for ${wallets.length} wallets`);
    return true;
  }

  // Enhanced polling with staggered checks
  startPolling() {
    this.monitorInterval = setInterval(async () => {
      await this.checkAllWalletsStaggered();
    }, 20000); // Check every 20 seconds
  }

  // Staggered wallet checking to prevent rate limiting
  async checkAllWalletsStaggered() {
    const wallets = Array.from(this.monitoredWallets.values());
    const batchSize = 3;
    
    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);
      const promises = batch.map(wallet => this.checkWalletChanges(wallet));
      
      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < wallets.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Enhanced sell detection with better accuracy
  async handleSellDetected(wallet, amountSold, newBalance) {
    try {
      console.log(`🚨 Sell detected for ${wallet.type}: ${amountSold.toFixed(4)} tokens`);
      
      // Get token price for USD calculation
      const tokenPrice = await this.getTokenPrice(wallet.tokenAddress, wallet.network);
      const usdValue = amountSold * (tokenPrice || 0);
      
      // Update wallet stats
      wallet.alertCount = (wallet.alertCount || 0) + 1;
      wallet.totalVolumeSold = (wallet.totalVolumeSold || 0) + usdValue;
      
      const alertData = {
        id: Date.now() + Math.random(),
        walletAddress: wallet.address,
        walletType: wallet.type,
        tokenAddress: wallet.tokenAddress,
        network: wallet.network,
        amountSold,
        usdValue,
        previousBalance: wallet.lastBalance,
        newBalance,
        changePercentage: ((amountSold / wallet.lastBalance) * 100).toFixed(2),
        timestamp: Date.now(),
        alertCount: wallet.alertCount,
        totalVolumeSold: wallet.totalVolumeSold
      };
      
      // Send alerts
      await this.sendAlert(alertData);
      
      // Notify subscribers immediately
      this.notifySubscribers(alertData);
      
    } catch (error) {
      console.error('Error handling sell detection:', error);
    }
  }

  // Get token price (same as WalletAnalyticsService)
  async getTokenPrice(tokenAddress, network = 'ethereum') {
    try {
      const dexData = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
      if (dexData.ok) {
        const data = await dexData.json();
        if (data.pairs && data.pairs.length > 0) {
          return parseFloat(data.pairs[0].priceUsd);
        }
      }
      return 0;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  // Get enhanced monitoring statistics
  getEnhancedStatus() {
    const wallets = Array.from(this.monitoredWallets.values());
    const totalAlerts = wallets.reduce((sum, w) => sum + (w.alertCount || 0), 0);
    const totalVolume = wallets.reduce((sum, w) => sum + (w.totalVolumeSold || 0), 0);
    
    return {
      isMonitoring: this.isMonitoring,
      walletCount: this.monitoredWallets.size,
      subscriberCount: this.alertSubscribers.size,
      totalAlerts,
      totalVolume,
      lastChecked: Math.max(...wallets.map(w => w.lastChecked || 0)),
      bundleWallets: wallets.filter(w => w.type === 'Bundle Wallet').length,
      teamWallets: wallets.filter(w => w.type === 'Team Wallet').length
    };
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.isMonitoring = false;
    this.monitoredWallets.clear();
    
    console.log('Stopped wallet monitoring');
  }

  // Start polling for changes
  startPolling() {
    this.monitorInterval = setInterval(async () => {
      await this.checkAllWallets();
    }, 30000); // Check every 30 seconds
  }

  // Check all monitored wallets for changes
  async checkAllWallets() {
    const promises = Array.from(this.monitoredWallets.values()).map(wallet => 
      this.checkWalletChanges(wallet)
    );
    
    await Promise.all(promises);
  }

  // Check individual wallet for balance changes
  async checkWalletChanges(wallet) {
    try {
      const currentBalance = await WalletAnalyticsService.getTokenBalance(
        wallet.address,
        wallet.tokenAddress,
        wallet.network
      );
      
      if (!currentBalance) return;
      
      const currentBalanceNum = parseFloat(currentBalance.formatted);
      
      // First time checking this wallet
      if (wallet.lastBalance === null) {
        wallet.lastBalance = currentBalanceNum;
        wallet.lastChecked = Date.now();
        return;
      }
      
      // Check for significant balance decrease (potential sell)
      const balanceChange = wallet.lastBalance - currentBalanceNum;
      const changePercentage = (balanceChange / wallet.lastBalance) * 100;
      
      if (balanceChange > 0 && changePercentage > 1) { // More than 1% decrease
        await this.handleSellDetected(wallet, balanceChange, currentBalanceNum);
      }
      
      // Update wallet data
      wallet.lastBalance = currentBalanceNum;
      wallet.lastChecked = Date.now();
      
    } catch (error) {
      console.error(`Error checking wallet ${wallet.address}:`, error);
    }
  }

  // Handle detected sell transaction
  async handleSellDetected(wallet, amountSold, newBalance) {
    try {
      // Get recent transactions to find the sell transaction
      const recentTxs = await WalletAnalyticsService.getTransactionHistory(
        wallet.address,
        wallet.tokenAddress,
        wallet.network
      );
      
      // Find the most recent outgoing transaction
      const sellTx = recentTxs.find(tx => 
        tx.from.toLowerCase() === wallet.address.toLowerCase() &&
        Date.now() - tx.timestamp < 5 * 60 * 1000 // Within last 5 minutes
      );
      
      if (sellTx) {
        const usdValue = await WalletAnalyticsService.getUSDValue(
          amountSold,
          wallet.tokenAddress,
          sellTx.timestamp,
          wallet.network
        );
        
        const destination = await WalletAnalyticsService.identifyDEX(
          sellTx.to,
          wallet.network
        );
        
        const alertData = {
          walletAddress: wallet.address,
          walletType: wallet.type,
          tokenAddress: wallet.tokenAddress,
          network: wallet.network,
          amountSold,
          usdValue,
          previousBalance: wallet.lastBalance,
          newBalance,
          changePercentage: ((amountSold / wallet.lastBalance) * 100).toFixed(2),
          destination,
          transactionHash: sellTx.hash,
          timestamp: sellTx.timestamp,
          explorerLink: this.getExplorerLink(sellTx.hash, wallet.network)
        };
        
        // Send alerts
        await this.sendAlert(alertData);
        
        // Store in database
        await this.storeAlert(alertData);
        
        // Notify subscribers
        this.notifySubscribers(alertData);
      }
    } catch (error) {
      console.error('Error handling sell detection:', error);
    }
  }

  // Send alert via multiple channels
  async sendAlert(alertData) {
    // Send Telegram alert
    await this.sendTelegramAlert(alertData);
    
    // Send dashboard notification
    await this.sendDashboardAlert(alertData);
  }

  // Send Telegram alert
  async sendTelegramAlert(alertData) {
    try {
      const message = this.formatTelegramMessage(alertData);
      
      await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Error sending Telegram alert:', error);
    }
  }

  // Send dashboard alert
  async sendDashboardAlert(alertData) {
    try {
      await axios.post('/api/alerts', {
        type: 'wallet_sell',
        data: alertData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending dashboard alert:', error);
    }
  }

  // Format Telegram message
  formatTelegramMessage(alertData) {
    return `
🚨 <b>WALLET SELL ALERT</b> 🚨

💼 <b>Wallet:</b> <code>${alertData.walletAddress}</code>
🏷️ <b>Type:</b> ${alertData.walletType}

💰 <b>Amount Sold:</b> ${alertData.amountSold.toFixed(4)} tokens
💵 <b>USD Value:</b> $${alertData.usdValue.toFixed(2)}

📊 <b>Balance Change:</b>
   • Previous: ${alertData.previousBalance.toFixed(4)}
   • New: ${alertData.newBalance.toFixed(4)}
   • Change: -${alertData.changePercentage}%

🏪 <b>DEX:</b> ${alertData.destination}
🌐 <b>Network:</b> ${alertData.network.toUpperCase()}

🔗 <b>Transaction:</b> <a href="${alertData.explorerLink}">${alertData.transactionHash.substring(0, 10)}...</a>

⏰ <b>Time:</b> ${new Date(alertData.timestamp).toLocaleString()}
    `;
  }

  // Store alert in database
  async storeAlert(alertData) {
    try {
      await axios.post('/api/alerts/store', alertData);
    } catch (error) {
      console.error('Error storing alert:', error);
    }
  }

  // Get explorer link
  getExplorerLink(txHash, network) {
    const explorers = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      bsc: `https://bscscan.com/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`
    };
    
    return explorers[network] || `#${txHash}`;
  }

  // Subscribe to alerts
  subscribe(callback) {
    this.alertSubscribers.add(callback);
    
    return () => {
      this.alertSubscribers.delete(callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(alertData) {
    this.alertSubscribers.forEach(callback => {
      try {
        callback(alertData);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Get monitoring status
  getStatus() {
    const wallets = Array.from(this.monitoredWallets.values());
    return {
      isMonitoring: this.isMonitoring,
      walletCount: this.monitoredWallets.size,
      subscriberCount: this.alertSubscribers.size,
      connected: this.isMonitoring, // Add this
      lastChecked: wallets.length > 0 ? Math.max(...wallets.map(w => w.lastChecked || 0)) : 0
    };
  }
}

export default RealTimeMonitor;