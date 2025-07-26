import axios from 'axios';

class DexScreenerService {
  constructor() {
    this.baseUrl = 'https://api.dexscreener.com/latest';
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Get token data from DexScreener
  async getTokenData(contractAddress, chainId = 'ethereum') {
    const cacheKey = `${chainId}-${contractAddress}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/dex/tokens/${contractAddress}`, {
        timeout: 10000
      });

      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        const tokenData = this.processTokenData(response.data.pairs, contractAddress);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: tokenData,
          timestamp: Date.now()
        });
        
        return tokenData;
      }
      
      throw new Error('No trading pairs found for this token');
    } catch (error) {
      console.error('Error fetching token data from DexScreener:', error);
      throw error;
    }
  }

  // Process and format token data from DexScreener response
  processTokenData(pairs, contractAddress) {
    // Find the main pair (usually the one with highest liquidity)
    const mainPair = pairs.reduce((prev, current) => {
      return (prev.liquidity?.usd || 0) > (current.liquidity?.usd || 0) ? prev : current;
    });

    const token = mainPair.baseToken.address.toLowerCase() === contractAddress.toLowerCase() 
      ? mainPair.baseToken 
      : mainPair.quoteToken;

    return {
      // Basic token info
      address: contractAddress,
      name: token.name || 'Unknown Token',
      symbol: token.symbol || 'UNKNOWN',
      
      // Price data
      price: parseFloat(mainPair.priceUsd) || 0,
      priceChange24h: parseFloat(mainPair.priceChange?.h24) || 0,
      priceChange1h: parseFloat(mainPair.priceChange?.h1) || 0,
      priceChange5m: parseFloat(mainPair.priceChange?.m5) || 0,
      
      // Volume data
      volume24h: parseFloat(mainPair.volume?.h24) || 0,
      volume1h: parseFloat(mainPair.volume?.h1) || 0,
      volume5m: parseFloat(mainPair.volume?.m5) || 0,
      
      // Liquidity data
      liquidity: parseFloat(mainPair.liquidity?.usd) || 0,
      liquidityBase: parseFloat(mainPair.liquidity?.base) || 0,
      liquidityQuote: parseFloat(mainPair.liquidity?.quote) || 0,
      
      // Market data
      marketCap: parseFloat(mainPair.marketCap) || 0,
      fdv: parseFloat(mainPair.fdv) || 0,
      
      // DEX info
      dexId: mainPair.dexId,
      pairAddress: mainPair.pairAddress,
      chainId: mainPair.chainId,
      
      // Trading data
      txns24h: mainPair.txns?.h24 || { buys: 0, sells: 0 },
      txns1h: mainPair.txns?.h1 || { buys: 0, sells: 0 },
      txns5m: mainPair.txns?.m5 || { buys: 0, sells: 0 },
      
      // Additional data
      pairCreatedAt: mainPair.pairCreatedAt,
      lastUpdated: Date.now(),
      
      // All pairs for reference
      allPairs: pairs.map(pair => ({
        dexId: pair.dexId,
        pairAddress: pair.pairAddress,
        liquidity: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0
      }))
    };
  }

  // Get multiple tokens data
  async getMultipleTokensData(contractAddresses, chainId = 'ethereum') {
    const promises = contractAddresses.map(address => 
      this.getTokenData(address, chainId).catch(error => ({ error, address }))
    );
    
    return Promise.all(promises);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Format price for display
  formatPrice(price) {
    if (price >= 1) return `$${price.toFixed(4)}`;
    if (price >= 0.01) return `$${price.toFixed(6)}`;
    if (price >= 0.0001) return `$${price.toFixed(8)}`;
    return `$${price.toExponential(2)}`;
  }

  // Format volume/market cap
  formatLargeNumber(num) {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  }

  // Format percentage change
  formatPercentage(percentage) {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  }
}

export default DexScreenerService;