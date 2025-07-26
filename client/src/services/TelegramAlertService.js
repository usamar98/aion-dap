class TelegramAlertService {
  constructor() {
    this.botToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.REACT_APP_TELEGRAM_CHAT_ID;
    this.isEnabled = this.botToken && this.chatId;
  }

  async sendAlert(message, priority = 'medium') {
    if (!this.isEnabled) {
      console.warn('Telegram alerts not configured');
      return false;
    }

    try {
      const emoji = this.getPriorityEmoji(priority);
      const formattedMessage = `${emoji} *WALLET ALERT*\n\n${message}\n\n_Time: ${new Date().toISOString()}_`;
      
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: formattedMessage,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });

      const result = await response.json();
      if (result.ok) {
        console.log('✅ Telegram alert sent successfully');
        return true;
      } else {
        console.error('❌ Telegram alert failed:', result.description);
        return false;
      }
    } catch (error) {
      console.error('❌ Telegram alert error:', error);
      return false;
    }
  }

  getPriorityEmoji(priority) {
    switch (priority) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  }

  async sendWalletAlert(walletData, alertType, details) {
    const message = this.formatWalletAlert(walletData, alertType, details);
    const priority = this.getAlertPriority(alertType);
    return await this.sendAlert(message, priority);
  }

  formatWalletAlert(walletData, alertType, details) {
    const { address, type, percentage, tokenSymbol } = walletData;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    switch (alertType) {
      case 'large_sell':
        return `🔴 *LARGE SELL DETECTED*\n\n` +
               `Wallet: \`${shortAddress}\`\n` +
               `Type: ${type}\n` +
               `Supply: ${percentage}%\n` +
               `Amount: ${details.amount} ${tokenSymbol}\n` +
               `Value: $${details.usdValue}\n` +
               `DEX: ${details.dex}`;
      
      case 'coordinated_dump':
        return `🚨 *COORDINATED DUMP ALERT*\n\n` +
               `${details.walletCount} wallets selling simultaneously\n` +
               `Total Amount: ${details.totalAmount} ${tokenSymbol}\n` +
               `Total Value: $${details.totalValue}`;
      
      case 'team_wallet_activity':
        return `👥 *TEAM WALLET ACTIVITY*\n\n` +
               `Wallet: \`${shortAddress}\`\n` +
               `Supply: ${percentage}%\n` +
               `Action: ${details.action}\n` +
               `Amount: ${details.amount} ${tokenSymbol}`;
      
      default:
        return `📢 *WALLET ALERT*\n\nWallet: \`${shortAddress}\`\nType: ${type}\nDetails: ${JSON.stringify(details)}`;
    }
  }

  getAlertPriority(alertType) {
    switch (alertType) {
      case 'large_sell':
      case 'coordinated_dump':
        return 'high';
      case 'team_wallet_activity':
        return 'medium';
      default:
        return 'low';
    }
  }
}

// Change line 105 from:
// export default new TelegramAlertService();

// To:
export default TelegramAlertService;