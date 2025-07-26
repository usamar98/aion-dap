import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Wallet, 
  Search, 
  FlaskConical,
  ArrowRight,
  Users
} from 'lucide-react';

const Dashboard = ({ setActiveSection }) => {
  const services = [
    {
      id: 'phishing-scanner',
      title: 'Phishing Link Scanner',
      description: 'Advanced detection of malicious links and phishing attempts',
      icon: Search,
      color: 'from-red-600 to-red-400',
      features: ['URL Analysis', 'Domain Reputation', 'Real-time Scanning'],
      clickable: true
    },
    {
      id: 'team-bundle-scanner',
      title: 'Team & Bundle Wallet Analysis',
      description: 'Comprehensive wallet tracking and rug pull detection system',
      icon: Users,
      color: 'from-blue-600 to-blue-400',
      features: [
        'Team Wallet Detection',
        'Bundle Wallet Analysis', 
        'Real-time Monitoring',
        'Alert System'
      ],
      clickable: true
    },
    {
      id: 'wallet-detection',
      title: 'Phishing Wallets',
      description: 'Identify and track suspicious wallet addresses',
      icon: Wallet,
      color: 'from-yellow-600 to-yellow-400',
      clickable: false
    },
    {
      id: 'trace-funds',
      title: 'Trace Stolen Funds',
      description: 'Track and trace stolen cryptocurrency across blockchains',
      icon: Shield,
      color: 'from-green-600 to-green-400',
      clickable: false
    },
    {
      id: 'aion-lab',
      title: 'Aion Lab',
      description: 'Experimental tools and research for blockchain security',
      icon: FlaskConical,
      color: 'from-purple-600 to-purple-400',
      clickable: false
    }
  ];

  const handleCardClick = (serviceId, clickable) => {
    if (clickable) {
      setActiveSection(serviceId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-white mb-4">Aion Ai Security Suite</h1>
        <p className="text-gray-400 text-lg">Comprehensive blockchain security tools powered by artificial intelligence</p>
      </motion.div>

      {/* Services Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <motion.div
              key={index}
              onClick={() => handleCardClick(service.id, service.clickable)}
              className={`relative overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-300 group ${
                service.clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}
              whileHover={service.clickable ? { scale: 1.02, y: -5 } : {}}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Video background for Phishing Link Scanner */}
              {service.id === 'phishing-scanner' && (
                <video 
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/security.mp4" type="video/mp4" />
                </video>
              )}
              
              {/* Content overlay */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${service.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {service.clickable && (
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                
                {/* Only show description and features for non-phishing-scanner cards */}
                {service.id !== 'phishing-scanner' && (
                  <>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{service.description}</p>
                    
                    {service.clickable ? (
                      <div className="space-y-2">
                        {service.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center text-xs text-gray-500">
                            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="text-lg font-semibold text-gray-400">Coming Soon</span>
                      </div>
                    )}
                  </>
                )}
                
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">12,847</div>
            <div className="text-sm text-gray-400">Total Scans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">1,234</div>
            <div className="text-sm text-gray-400">Threats Detected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">$2.4M</div>
            <div className="text-sm text-gray-400">Funds Traced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">8,492</div>
            <div className="text-sm text-gray-400">Active Users</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;