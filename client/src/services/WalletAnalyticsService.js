import axios from 'axios';

class WalletAnalyticsService {
  constructor() {
    this.moralisApiKey = process.env.REACT_APP_MORALIS_API_KEY;
    // Remove this line:
    // this.covalentApiKey = process.env.REACT_APP_COVALENT_API_KEY;
    this.etherscanApiKey = process.env.REACT_APP_ETHERSCAN_API_KEY;
    
    this.chainIds = {
      ethereum: 1,
      bsc: 56,
      base: 8453,
      polygon: 137,
      arbitrum: 42161  // Add Arbitrum chain ID
    };
    
    this.explorerApis = {
      ethereum: 'https://api.etherscan.io/api',
      bsc: 'https://api.bscscan.com/api',
      base: 'https://api.basescan.org/api',
      polygon: 'https://api.polygonscan.com/api',
      arbitrum: 'https://api.arbiscan.io/api'  // Add Arbiscan API
    };
  }

  async analyzeToken(contractAddress, blockchain = 'ethereum') {
    try {
      console.log(`🔍 Starting analysis for ${contractAddress} on ${blockchain}`);
      
      // Step 1: Get contract deployer (optional)
      const deployer = await this.getContractDeployer(contractAddress, blockchain);
      if (deployer) {
        console.log(`✅ Deployer found: ${deployer.address}`);
      } else {
        console.log(`⚠️ Deployer not available - continuing analysis without deployer info`);
      }
      
      // Step 2: Get token metadata
      const metadata = await this.getTokenMetadata(contractAddress, blockchain);
      
      // Step 3: Get top holders
      const holders = await this.getTopHolders(contractAddress, blockchain);
      
      // Step 4: Classify wallets (works with or without deployer)
      const classification = await this.classifyWallets(holders, deployer, metadata, blockchain);
      
      return {
        contractAddress,
        blockchain,
        deployer, // May be null
        metadata,
        holders,
        ...classification,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  async getContractDeployer(contractAddress, blockchain) {
    try {
      const apiUrl = this.explorerApis[blockchain];
      const apiKey = this.getApiKey(blockchain);
      
      console.log(`🔍 Attempting to get deployer for ${contractAddress} on ${blockchain}`);
      
      const response = await axios.get(apiUrl, {
        params: {
          module: 'contract',
          action: 'getcontractcreation',
          contractaddresses: contractAddress,
          apikey: apiKey
        }
      });
      
      if (response.data.status === '1' && response.data.result && response.data.result.length > 0) {
        const result = response.data.result[0];
        console.log(`✅ Deployer found: ${result.contractCreator}`);
        return {
          address: result.contractCreator,
          txHash: result.txHash,
          blockNumber: result.blockNumber
        };
      }
      
      console.warn(`⚠️ No deployer information available for ${contractAddress}`);
      return null; // Return null instead of throwing error
    } catch (error) {
      console.warn(`⚠️ Failed to get deployer for ${contractAddress}:`, error.message);
      return null; // Return null instead of throwing error
    }
  }

  async getTokenMetadata(contractAddress, blockchain) {
    try {
      const chainId = this.chainIds[blockchain];
      
      const response = await axios.get(`https://deep-index.moralis.io/api/v2/erc20/metadata`, {
        params: {
          chain: `0x${chainId.toString(16)}`,
          addresses: [contractAddress]
        },
        headers: {
          'X-API-Key': this.moralisApiKey
        }
      });
      
      if (response.data && response.data.length > 0) {
        const token = response.data[0];
        return {
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          totalSupply: token.total_supply,
          contractAddress: token.address
        };
      }
      
      throw new Error('Token metadata not found');
    } catch (error) {
      console.error('❌ Failed to get metadata:', error);
      throw error;
    }
  }

  async getTopHolders(contractAddress, blockchain) {
    try {
      const chainId = this.chainIds[blockchain];
      console.log(`🔍 Getting holders for ${contractAddress} on chain ${chainId}`);
      
      // Use Moralis API instead of Covalent
      const response = await axios.get(
        `https://deep-index.moralis.io/api/v2/erc20/${contractAddress}/owners`,
        {
          params: {
            chain: `0x${chainId.toString(16)}`,
            limit: 100,
            order: 'DESC'
          },
          headers: {
            'X-API-Key': this.moralisApiKey
          }
        }
      );
      
      console.log('📊 Moralis API response:', {
        status: response.status,
        hasData: !!response.data,
        hasResult: !!response.data?.result,
        resultLength: response.data?.result?.length || 0
      });
      
      if (response.data && response.data.result && response.data.result.length > 0) {
        // Get token metadata to calculate total supply
        const metadata = await this.getTokenMetadata(contractAddress, blockchain);
        const decimals = parseInt(metadata.decimals || '18');
        const totalSupply = parseFloat(metadata.totalSupply || '0');
        
        // Convert total supply from smallest unit to human-readable format
        const totalSupplyFormatted = totalSupply / Math.pow(10, decimals);
        
        console.log(`📊 Total supply: ${totalSupply} (raw), ${totalSupplyFormatted} (formatted), decimals: ${decimals}`);
        
        const holders = response.data.result.map(holder => {
          const balanceRaw = parseFloat(holder.balance);
          // Convert balance from smallest unit to human-readable format
          const balanceFormatted = balanceRaw / Math.pow(10, decimals);
          const percentage = totalSupplyFormatted > 0 ? (balanceFormatted / totalSupplyFormatted) * 100 : 0;
          
          return {
            address: holder.owner_address,
            balance: balanceFormatted, // Store formatted balance
            balanceRaw: balanceRaw,    // Keep raw balance for reference
            percentage: percentage
          };
        });
        
        console.log(`✅ Processed ${holders.length} holders from Moralis`);
        console.log('📊 Top 3 holders:', holders.slice(0, 3).map(h => ({
          address: h.address.slice(0, 8) + '...',
          percentage: h.percentage.toFixed(4) + '%',
          balance: h.balance.toFixed(4)
        })));
        
        return holders;
      }
      
      console.warn('⚠️ No holders data from Moralis, trying fallback');
      throw new Error('No holders data found from Moralis');
    } catch (error) {
      console.error('❌ Failed to get holders from Moralis:', error.message);
      console.log('🔄 Falling back to transaction analysis...');
      // Fallback to transaction analysis
      return await this.getHoldersFromTransactions(contractAddress, blockchain);
    }
  }

  async getHoldersFromTransactions(contractAddress, blockchain) {
    try {
      const apiUrl = this.explorerApis[blockchain];
      const apiKey = this.getApiKey(blockchain);
      
      // Get token metadata to calculate total supply
      const metadata = await this.getTokenMetadata(contractAddress, blockchain);
      const decimals = parseInt(metadata.decimals || '18');
      const totalSupply = parseFloat(metadata.totalSupply || '0');
      
      // Convert total supply from smallest unit to human-readable format
      const totalSupplyFormatted = totalSupply / Math.pow(10, decimals);
      
      const response = await axios.get(apiUrl, {
        params: {
          module: 'account',
          action: 'tokentx',
          contractaddress: contractAddress,
          page: 1,
          offset: 1000,
          sort: 'desc',
          apikey: apiKey
        }
      });
      
      if (response.data.status === '1') {
        const holders = new Map();
        
        response.data.result.forEach(tx => {
          if (tx.to && tx.to !== '0x0000000000000000000000000000000000000000') {
            const current = holders.get(tx.to) || 0;
            const valueRaw = parseFloat(tx.value);
            holders.set(tx.to, current + valueRaw);
          }
        });
        
        return Array.from(holders.entries())
          .map(([address, balanceRaw]) => {
            // Convert balance from smallest unit to human-readable format
            const balanceFormatted = balanceRaw / Math.pow(10, decimals);
            const percentage = totalSupplyFormatted > 0 ? (balanceFormatted / totalSupplyFormatted) * 100 : 0;
            
            return { 
              address, 
              balance: balanceFormatted,
              balanceRaw: balanceRaw,
              percentage: percentage
            };
          })
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 100);
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to get holders from transactions:', error);
      return [];
    }
  }

  async classifyWallets(holders, deployer, metadata, blockchain) {
    console.log('🔍 Starting wallet classification:', {
      holdersCount: holders?.length || 0,
      deployer: deployer?.address,
      blockchain,
      metadata: metadata?.symbol
    });
    
    const teamWallets = [];
    const bundleWallets = [];
    const regularWallets = [];
    
    // Ensure holders is an array
    if (!Array.isArray(holders)) {
      console.warn('⚠️ Holders is not an array:', holders);
      return {
        teamWallets: [],
        bundleWallets: [],
        regularWallets: [],
        riskAssessment: this.assessRisk([], [])
      };
    }
    
    if (holders.length === 0) {
      console.warn('⚠️ No holders found to classify');
      return {
        teamWallets: [],
        bundleWallets: [],
        regularWallets: [],
        riskAssessment: this.assessRisk([], [])
      };
    }
    
    console.log('📊 Top 5 holder percentages:', holders.slice(0, 5).map(h => ({
      address: h.address.slice(0, 8) + '...',
      percentage: h.percentage?.toFixed(4) || 'undefined'
    })));
    
    for (const holder of holders) {
      try {
        const classification = await this.classifyWallet(holder, deployer, metadata, blockchain);
        
        console.log(`📝 Classified ${holder.address.slice(0, 8)}... as ${classification.type} (${holder.percentage?.toFixed(4)}%)`);
        
        switch (classification.type) {
          case 'team':
            teamWallets.push({ ...holder, ...classification });
            break;
          case 'bundle':
            bundleWallets.push({ ...holder, ...classification });
            break;
          default:
            regularWallets.push({ ...holder, ...classification });
        }
      } catch (error) {
        console.error(`❌ Failed to classify wallet ${holder.address}:`, error);
        regularWallets.push({ ...holder, type: 'unknown', reason: 'Classification failed' });
      }
    }
    
    console.log('✅ Classification results:', {
      teamWallets: teamWallets.length,
      bundleWallets: bundleWallets.length,
      regularWallets: regularWallets.length
    });
    
    return {
      teamWallets,
      bundleWallets,
      regularWallets,
      riskAssessment: this.assessRisk(teamWallets, bundleWallets)
    };
  }

  async classifyWallet(holder, deployer, metadata, blockchain) {
    const { address, balance, percentage } = holder;
    
    console.log(`🔍 Classifying wallet ${address.slice(0, 8)}... with ${percentage?.toFixed(4)}% holdings`);
    
    // Team wallet criteria (LOWERED threshold for testing)
    if (percentage > 0.1) {  // Changed from 0.5% to 0.1% for testing
      console.log(`✅ Team wallet detected: ${percentage.toFixed(4)}% > 0.1%`);
      return {
        type: 'team',
        reason: `Holds ${percentage.toFixed(2)}% of total supply`,
        riskLevel: percentage > 10 ? 'high' : 'medium'
      };
    }
    
    // Check if funded by deployer (only if deployer info is available)
    if (deployer?.address) {
      const fundedByDeployer = await this.checkDeployerFunding(address, deployer.address, blockchain);
      if (fundedByDeployer) {
        console.log(`✅ Bundle wallet detected: funded by deployer`);
        return {
          type: 'bundle',
          reason: 'Funded by contract deployer',
          riskLevel: 'high'
        };
      }
    } else {
      console.log(`ℹ️ Skipping deployer funding check - no deployer info available`);
    }
    
    // Bundle wallet detection
    const bundlePattern = await this.detectBundlePattern(address, blockchain);
    if (bundlePattern.isBundle) {
      console.log(`✅ Bundle wallet detected: ${bundlePattern.reason}`);
      return {
        type: 'bundle',
        reason: bundlePattern.reason,
        riskLevel: 'medium'
      };
    }
    
    return {
      type: 'regular',
      reason: 'Normal wallet activity',
      riskLevel: 'low'
    };
  }

  async checkDeployerFunding(walletAddress, deployerAddress, blockchain) {
    try {
      const apiUrl = this.explorerApis[blockchain];
      const apiKey = this.getApiKey(blockchain);
      
      const response = await axios.get(apiUrl, {
        params: {
          module: 'account',
          action: 'txlist',
          address: walletAddress,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 100,
          sort: 'asc',
          apikey: apiKey
        }
      });
      
      if (response.data.status === '1') {
        return response.data.result.some(tx => 
          tx.from.toLowerCase() === deployerAddress.toLowerCase()
        );
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to check deployer funding:', error);
      return false;
    }
  }

  async detectBundlePattern(address, blockchain) {
    try {
      const transactions = await this.getWalletTransactions(address, blockchain);
      
      // Look for patterns indicating bundle behavior
      const sellTransactions = transactions.filter(tx => tx.type === 'sell');
      const buyTransactions = transactions.filter(tx => tx.type === 'buy');
      
      // Bundle indicators
      const hasQuickSells = sellTransactions.some(tx => 
        Date.now() - tx.timestamp < 24 * 60 * 60 * 1000 // Sold within 24 hours
      );
      
      const hasLowActivity = transactions.length < 10;
      const hasHighSellRatio = sellTransactions.length > buyTransactions.length;
      
      if (hasQuickSells && hasLowActivity) {
        return {
          isBundle: true,
          reason: 'Quick sell pattern detected'
        };
      }
      
      if (hasHighSellRatio && hasLowActivity) {
        return {
          isBundle: true,
          reason: 'High sell ratio with low activity'
        };
      }
      
      return { isBundle: false, reason: 'Normal activity pattern' };
    } catch (error) {
      console.error('❌ Failed to detect bundle pattern:', error);
      return { isBundle: false, reason: 'Pattern detection failed' };
    }
  }

  async getWalletTransactions(address, blockchain) {
    try {
      const apiUrl = this.explorerApis[blockchain];
      const apiKey = this.getApiKey(blockchain);
      
      const response = await axios.get(apiUrl, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 100,
          sort: 'desc',
          apikey: apiKey
        }
      });
      
      if (response.data.status === '1') {
        return response.data.result.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          timestamp: parseInt(tx.timeStamp) * 1000,
          type: tx.from.toLowerCase() === address.toLowerCase() ? 'sell' : 'buy'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to get wallet transactions:', error);
      return [];
    }
  }

  assessRisk(teamWallets, bundleWallets) {
    const teamSupply = teamWallets.reduce((sum, wallet) => sum + wallet.percentage, 0);
    const bundleSupply = bundleWallets.reduce((sum, wallet) => sum + wallet.percentage, 0);
    
    let riskLevel = 'low';
    let recommendation = 'Token appears to have low risk factors.';
    
    if (teamSupply > 20) {
      riskLevel = 'high';
      recommendation = 'HIGH RISK: Team controls significant portion of supply.';
    } else if (bundleSupply > 15) {
      riskLevel = 'high';
      recommendation = 'HIGH RISK: Large bundle wallet presence detected.';
    } else if (teamSupply > 10 || bundleSupply > 10) {
      riskLevel = 'medium';
      recommendation = 'MEDIUM RISK: Monitor team and bundle wallet activity.';
    }
    
    return {
      riskLevel,
      recommendation,
      teamSupplyPercentage: teamSupply,
      bundleSupplyPercentage: bundleSupply,
      totalRiskySupply: teamSupply + bundleSupply
    };
  }

  getApiKey(blockchain) {
    switch (blockchain) {
      case 'ethereum':
        return this.etherscanApiKey;
      case 'bsc':
        return process.env.REACT_APP_BSCSCAN_API_KEY;
      case 'base':
        return process.env.REACT_APP_BASESCAN_API_KEY;
      case 'polygon':
        return process.env.REACT_APP_POLYGONSCAN_API_KEY;
      case 'arbitrum':
        return process.env.REACT_APP_ARBISCAN_API_KEY;  // Add Arbitrum API key
      default:
        return this.etherscanApiKey;
    }
  }

  async getTokenBalance(walletAddress, tokenAddress, blockchain) {
    try {
      const chainId = this.chainIds[blockchain];
      
      const response = await axios.get(
        `https://deep-index.moralis.io/api/v2/${walletAddress}/erc20`,
        {
          params: {
            chain: `0x${chainId.toString(16)}`,
            token_addresses: [tokenAddress]
          },
          headers: {
            'X-API-Key': this.moralisApiKey
          }
        }
      );
      
      if (response.data && response.data.length > 0) {
        return parseFloat(response.data[0].balance);
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      return 0;
    }
  }
}

export default WalletAnalyticsService;