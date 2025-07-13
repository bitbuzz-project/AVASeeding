// src/components/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Activity, 
  Shield, 
  Target, 
  ArrowRight, 
  DollarSign,
  BarChart3,
  Zap,
  PieChart,
  Users,
  ExternalLink,
  ChevronDown,
  Play,
  CheckCircle
} from 'lucide-react';

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  // Animation visibility tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id^="section-"]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Auto-slide for performance metrics
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const performanceMetrics = [
    { label: 'Bitcoin Strategy APY', value: '18%', period: '2021-2025 Avg' },
    { label: 'Ethereum Strategy APY', value: '27%', period: '2021-2025 Avg' },
    { label: 'Base LP Provisioning APY', value: '25-50%', period: 'Target Range' }
  ];

  const features = [
    {
      icon: Activity,
      title: 'Volatility Harvesting',
      description: 'Systematic profit generation from market motion - the only constant in crypto.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'No Staking Required',
      description: 'Simply hold AVA tokens. No manual claiming, no complex processes.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Proven Strategy',
      description: 'Backtested results showing consistent 18-27% APY across market cycles.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Automated Revenue',
      description: '90% of profits go to buybacks, creating deflationary pressure.',
      gradient: 'from-yellow-500 to-orange-500'
    }
  ];

  const allocations = [
    { name: 'Ethereum Strategy (E-MERS)', percentage: 50, color: 'bg-blue-500' },
    { name: 'Base Ecosystem LP', percentage: 35, color: 'bg-green-500' },
    { name: 'Token Liquidity', percentage: 15, color: 'bg-purple-500' }
  ];

  return (
    <div className="homepage-bg text-slate-900 font-inter">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-8">
                  <Zap className="w-4 h-4 mr-2" />
                  Now Live on Base Testnet
                </div>
                
                <h1 className="text-6xl lg:text-7xl font-black mb-6 hero-title">
                  <span className="block">AVALON</span>
                  <span className="block text-blue-600">TOKEN</span>
                </h1>
                
                <p className="text-2xl lg:text-3xl font-bold text-slate-700 mb-4">
                  Harnessing Volatility for Steady Returns
                </p>
                
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Systematic cryptocurrency trading strategies that generate 
                  <span className="font-bold text-blue-600"> 18-27% APY</span> through 
                  proven volatility harvesting techniques.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/presale"
                    className="hero-btn-primary px-8 py-4 rounded-xl font-bold text-lg text-white inline-flex items-center justify-center group"
                  >
                    Join Presale
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link
                    to="/"
                    className="hero-btn-secondary px-8 py-4 rounded-xl font-bold text-lg inline-flex items-center justify-center"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    View Dashboard
                  </Link>
                </div>
              </div>

              {/* Performance Metrics Carousel */}
              <div className="hero-card rounded-3xl p-8 backdrop-blur-lg">
                <h3 className="text-2xl font-bold mb-6 text-center text-slate-900">
                  Proven Performance
                </h3>
                
                <div className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
                  {performanceMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
                        currentSlide === index ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
                      }`}
                    >
                      <div className="text-5xl font-black text-blue-600 mb-2">
                        {metric.value}
                      </div>
                      <div className="text-xl font-bold text-slate-900 mb-1">
                        {metric.label}
                      </div>
                      <div className="text-sm text-slate-600">
                        {metric.period}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-6 space-x-2">
                  {performanceMetrics.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        currentSlide === index ? 'bg-blue-600 w-8' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-slate-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="section-features" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-900">
                Why Choose Avalon?
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                The only variable that never changes in crypto is volatility. 
                We've built a systematic approach to profit from this constant.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card p-8 rounded-2xl transition-all duration-500 ${
                    isVisible['section-features'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Section */}
      <section id="section-strategy" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-900">
                Three-Pillar Strategy
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Diversified approach combining systematic trading, DeFi yield farming, 
                and liquidity provisioning for maximum risk-adjusted returns.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                {allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className={`strategy-card p-6 rounded-2xl transition-all duration-500 ${
                      isVisible['section-strategy'] ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-900">
                        {allocation.name}
                      </h3>
                      <span className="text-2xl font-bold text-slate-900">
                        {allocation.percentage}%
                      </span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-3 mb-4">
                      <div
                        className={`${allocation.color} h-3 rounded-full transition-all duration-1000`}
                        style={{ 
                          width: isVisible['section-strategy'] ? `${allocation.percentage}%` : '0%',
                          transitionDelay: `${index * 200 + 300}ms`
                        }}
                      ></div>
                    </div>
                    <p className="text-slate-600 text-sm">
                      {allocation.name === 'Ethereum Strategy (E-MERS)' && 
                        'Maximum Exposure Rebalancing System - 10% rebalancing threshold for optimal profit capture'}
                      {allocation.name === 'Base Ecosystem LP' && 
                        'Active liquidity provisioning in high-yield Base ecosystem tokens'}
                      {allocation.name === 'Token Liquidity' && 
                        'Market support through ratcheting liquidity system and price stability'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative">
                <div className="strategy-visual bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 text-center">
                  <PieChart className="w-24 h-24 mx-auto mb-6 text-blue-600" />
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">
                    Revenue Distribution
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl">
                      <span className="font-medium text-slate-700">Token Buybacks</span>
                      <span className="text-xl font-bold text-green-600">90%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/80 rounded-xl">
                      <span className="font-medium text-slate-700">Operations</span>
                      <span className="text-xl font-bold text-blue-600">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section id="section-tokenomics" className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-slate-900">
                Tokenomics & Game Theory
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Designed to reward long-term holders while systematically removing weak hands from the ecosystem.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className={`tokenomics-card p-8 rounded-2xl transition-all duration-500 ${
                isVisible['section-tokenomics'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">Fixed Supply</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">8,888,888</p>
                <p className="text-slate-600">Total AVA tokens. No inflation, no dilution.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    87.5% for public seeding
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    12.5% for liquidity support
                  </li>
                </ul>
              </div>

              <div className={`tokenomics-card p-8 rounded-2xl transition-all duration-500 ${
                isVisible['section-tokenomics'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`} style={{ transitionDelay: '100ms' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">Deflationary Mechanics</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">5%</p>
                <p className="text-slate-600">Sell tax discourages speculation.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Continuous buyback pressure
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Ratcheting liquidity system
                  </li>
                </ul>
              </div>

              <div className={`tokenomics-card p-8 rounded-2xl transition-all duration-500 ${
                isVisible['section-tokenomics'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`} style={{ transitionDelay: '200ms' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900">Flywheel Effect</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">Long-term</p>
                <p className="text-slate-600">Value accrual for patient holders.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Revenue scales with AUM
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Weak hands filtered out
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Harness Volatility?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join the Avalon ecosystem and start earning steady returns from crypto market volatility.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/presale"
                className="cta-btn-primary px-8 py-4 rounded-xl font-bold text-lg inline-flex items-center group"
              >
                Join Presale Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/"
                className="cta-btn-secondary px-8 py-4 rounded-xl font-bold text-lg inline-flex items-center"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Explore Dashboard
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">18-27%</div>
                <div className="text-sm opacity-75">Target APY</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">90%</div>
                <div className="text-sm opacity-75">Revenue to Buybacks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">0%</div>
                <div className="text-sm opacity-75">Manual Work Required</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-sm opacity-75">Automated Trading</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="mb-8 lg:mb-0">
                <h3 className="text-2xl font-bold mb-2">AVALON TOKEN</h3>
                <p className="text-slate-400">Harnessing Volatility for Steady Returns</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/presale" className="text-slate-300 hover:text-white transition-colors">
                  Presale
                </Link>
                <a 
                  href="https://sepolia.basescan.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors inline-flex items-center"
                >
                  Explorer <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
            
            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
              <p>&copy; 2025 Avalon Token. Built on Base. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .homepage-bg {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
        }

        .hero-title {
          background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
        }

        .hero-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.1);
        }

        .hero-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .hero-btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .hero-btn-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: #1e293b;
          border: 1px solid rgba(59, 130, 246, 0.2);
          transition: all 0.3s ease;
        }

        .hero-btn-secondary:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }

        .strategy-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .strategy-visual {
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tokenomics-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .tokenomics-card:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }

        .cta-btn-primary {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          transition: all 0.3s ease;
        }

        .cta-btn-primary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .cta-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          transition: all 0.3s ease;
        }

        .cta-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}

export default HomePage;