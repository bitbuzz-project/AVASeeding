// src/components/HomePage.js - UPDATED TO MATCH WHITEPAPER
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
    { label: 'Bitcoin Strategy APY', value: '21.1%', period: '2021-2025 Avg' },
    { label: 'Base LP Provisioning APY', value: '25-75%', period: 'Target Range' },
    { label: 'Combined Target APY', value: '20-40%', period: 'Portfolio Average' }
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
      description: 'Backtested results showing consistent 21.1% APY with Bitcoin strategy. and 25-75% with DeFi LP on Base Ecosystem.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Automated Revenue',
      description: '70% to 85% of profits go to buybacks, creating deflationary pressure.',
      gradient: 'from-yellow-500 to-orange-500'
    }
  ];

  const allocations = [
    { name: 'Base Ecosystem LP', percentage: 45, color: 'bg-green-500' },
    { name: 'Bitcoin Strategy (B-MERS)', percentage: 35, color: 'bg-blue-500' },
    { name: 'Token Liquidity', percentage: 20, color: 'bg-purple-500' }
  ];

  return (
    <div className="homepage-bg text-slate-900 font-inter">
      {/* Hero Section - MOBILE OPTIMIZED */}
      <section className="relative overflow-hidden min-h-screen flex items-center py-4 sm:py-8 lg:py-16">
     {/* Animated background elements */}
<div className="absolute inset-0 overflow-hidden">
  <div className="absolute -top-10 sm:-top-20 lg:-top-40 -right-10 sm:-right-20 lg:-right-40 w-80 sm:w-40 lg:w-80 h-80 sm:h-40 lg:h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
  <div className="absolute -bottom-10 sm:-bottom-20 lg:-bottom-40 -left-10 sm:-left-20 lg:-left-40 w-80 sm:w-40 lg:w-80 h-80 sm:h-40 lg:h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
</div>

        <div className="container mx-auto px-6 py-8 sm:py-12 lg:py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 sm:gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left order-1 lg:order-1">
                <div className="inline-flex items-center px-4 py-3 bg-blue-100 rounded-full text-blue-700 font-medium mb-8 sm:mb-6 lg:mb-8 text-base sm:text-sm lg:text-base">
                  <Zap className="w-5 sm:w-4 h-5 sm:h-4 mr-2" />
                  Now Live on Base Testnet
                </div>
                    <h1 className="text-6xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black mb-8 sm:mb-4 lg:mb-6 hero-title leading-none">
                  <span className="block text-slate-800 -mb-6 sm:-mb-2 lg:-mb-1 xl:mb-0">AVALON</span>
                  <span className="block text-blue-600">TOKEN</span>
                </h1>
                
                <p className="text-xl sm:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-slate-700 mb-6 sm:mb-3 lg:mb-4">
                  Harnessing Volatility for Steady Returns
                </p>
                
                <p className="text-lg sm:text-base lg:text-lg xl:text-xl text-slate-600 mb-8 sm:mb-6 lg:mb-8 leading-relaxed px-2 sm:px-0 max-w-2xl mx-auto lg:mx-0">
                  Systematic cryptocurrency trading strategies that generate
                  <span className="font-bold text-blue-600"> 20-40% APY</span> through
                  proven volatility harvesting techniques.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center lg:justify-start px-2 sm:px-0">
                  <Link
                    to="/presale"
                    className="hero-btn-primary px-8 sm:px-6 lg:px-8 py-4 sm:py-4 rounded-2xl font-bold text-lg sm:text-base lg:text-lg text-white inline-flex items-center justify-center group min-h-[56px] sm:min-h-[48px] lg:min-h-[52px]"
                  >
                    Join Presale
                    <ArrowRight className="w-5 h-5 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link
                    to="/dashboard"
                    className="hero-btn-secondary px-8 sm:px-6 lg:px-8 py-4 sm:py-4 rounded-2xl font-bold text-lg sm:text-base lg:text-lg inline-flex items-center justify-center min-h-[56px] sm:min-h-[48px] lg:min-h-[52px]"
                  >
                    <BarChart3 className="w-5 h-5 sm:w-5 sm:h-5 mr-2" />
                    View Dashboard
                  </Link>
                </div>
              </div>

              {/* Performance Metrics Carousel - MOBILE OPTIMIZED */}
              <div className="hero-card rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 xl:p-8 backdrop-blur-lg order-2 lg:order-2">
                <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-center text-slate-900">
                  Proven Performance
                </h3>
                
                <div className="relative h-24 sm:h-32 lg:h-40 xl:h-48 overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
                  {performanceMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 px-2 ${
                        currentSlide === index ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-blue-600 mb-1">
                        {metric.value}
                      </div>
                      <div className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl font-bold text-slate-900 mb-1 text-center">
                        {metric.label}
                      </div>
                      <div className="text-xs sm:text-xs lg:text-sm text-slate-600 text-center">
                        {metric.period}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-3 sm:mt-4 lg:mt-6 space-x-2">
                  {performanceMetrics.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                        currentSlide === index ? 'bg-blue-600 w-4 sm:w-6 lg:w-8' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator - Hidden on mobile */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:block">
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
        </div>
      </section>

      {/* Features Section - Same as before */}
      <section id="section-features" className="py-8 sm:py-12 lg:py-16 xl:py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 text-slate-900 px-2">
                Why Choose Avalon?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                The only variable that never changes in crypto is volatility.
                We've built a systematic approach to profit from this constant.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl transition-all duration-500 ${
                    isVisible['section-features'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 sm:mb-4 lg:mb-6`}>
                    <feature.icon className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 lg:mb-4 text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Section - UPDATED ALLOCATIONS */}
      <section id="section-strategy" className="py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 text-slate-900 px-2">
                Three-Pillar Strategy
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                Diversified approach combining systematic Bitcoin trading, Base ecosystem LP,
                and liquidity provisioning for maximum risk-adjusted returns.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              <div className="space-y-4 sm:space-y-6 lg:space-y-8 order-2 lg:order-1">
                {allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className={`strategy-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl transition-all duration-500 ${
                      isVisible['section-strategy'] ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">
                        {allocation.name}
                      </h3>
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                        {allocation.percentage}%
                      </span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2 sm:h-2 lg:h-3 mb-2 sm:mb-3 lg:mb-4">
                      <div
                        className={`${allocation.color} h-2 sm:h-2 lg:h-3 rounded-full transition-all duration-1000`}
                        style={{
                          width: isVisible['section-strategy'] ? `${allocation.percentage}%` : '0%',
                          transitionDelay: `${index * 200 + 300}ms`
                        }}
                      ></div>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      {allocation.name === 'Bitcoin Strategy (B-MERS)' &&
                        'Bitcoin Maximum Exposure Rebalancing System - 9% rebalancing threshold for optimal profit capture'}
                      {allocation.name === 'Base Ecosystem LP' &&
                        'Active liquidity provisioning in high-yield Base ecosystem tokens with 25-75% APY target'}
                      {allocation.name === 'Token Liquidity' &&
                        'Market support through ratcheting liquidity system starting at $1.00 with price stability'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative order-1 lg:order-2">
                <div className="strategy-visual bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 text-center">
                  <PieChart className="w-12 sm:w-16 lg:w-20 xl:w-24 mx-auto mb-3 sm:mb-4 lg:mb-6 text-blue-600" />
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-slate-900">
                    Revenue Distribution
                  </h3>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-white/80 rounded-lg sm:rounded-xl">
                      <span className="font-medium text-slate-700 text-xs sm:text-sm lg:text-base">Token Buybacks</span>
                      <span className="text-base sm:text-lg lg:text-xl font-bold text-green-600">90%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-white/80 rounded-lg sm:rounded-xl">
                      <span className="font-medium text-slate-700 text-xs sm:text-sm lg:text-base">Operations</span>
                      <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics Section - UPDATED */}
      <section id="section-tokenomics" className="py-8 sm:py-12 lg:py-16 xl:py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 text-slate-900 px-2">
                Tokenomics & Game Theory
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                Designed to reward long-term holders while systematically removing weak hands from the ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className={`tokenomics-card p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl transition-all duration-500 ${
                isVisible['section-tokenomics'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}>
                <div className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-6">
                  <Users className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 lg:mb-4 text-slate-900">Fixed Supply</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-2">5,000,000</p>
                <p className="text-slate-600 text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 lg:mb-4">Total AVA tokens. No inflation, no dilution.</p>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>87.5% for public seeding</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>12.5% for liquidity support</span>
                  </li>
                </ul>
              </div>

              <div className={`tokenomics-card p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl transition-all duration-500 ${
                isVisible['section-tokenomics'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`} style={{ transitionDelay: '100ms' }}>
                <div className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-6">
                  <Shield className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 lg:mb-4 text-slate-900">Deflationary Mechanics</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-2">8%</p>
                <p className="text-slate-600 text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 lg:mb-4">Sell tax discourages speculation.</p>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Continuous buyback pressure</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Ratcheting liquidity system</span>
                  </li>
                </ul>
              </div>

              <div className={`tokenomics-card p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl transition-all duration-500 ${
                isVisible['section-tokenomics'] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`} style={{ transitionDelay: '200ms' }}>
                <div className="w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-6">
                  <TrendingUp className="w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 lg:mb-4 text-slate-900">Referral Program</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-2">5% + 3%</p>
                <p className="text-slate-600 text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 lg:mb-4">Referrer earns 5%, referee gets 3% bonus.</p>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Network growth incentives</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Quality investor focus</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Same as before */}
      <section className="py-8 sm:py-12 lg:py-16 xl:py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 px-2">
              Ready to Harness Volatility?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90 px-2">
              Join the Avalon ecosystem and start earning steady returns from crypto market volatility.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center items-center px-2">
              <Link
                to="/presale"
                className="cta-btn-primary w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg inline-flex items-center justify-center group min-h-[44px] sm:min-h-[48px] lg:min-h-[52px]"
              >
                Join Ongoing Token Sale
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/dashboard"
                className="cta-btn-secondary w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg inline-flex items-center justify-center min-h-[44px] sm:min-h-[48px] lg:min-h-[52px]"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Explore Dashboard
              </Link>
            </div>

            <div className="mt-6 sm:mt-8 lg:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-8 px-2">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-2">20-40%</div>
                <div className="text-xs sm:text-sm opacity-75">Target APY</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-2">85%</div>
                <div className="text-xs sm:text-sm opacity-75">Revenue to Buybacks</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-2">0%</div>
                <div className="text-xs sm:text-sm opacity-75">Manual Work Required</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-2">24/7</div>
                <div className="text-xs sm:text-sm opacity-75">Automated Trading</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - MOBILE OPTIMIZED */}
      <footer className="py-6 sm:py-8 lg:py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-0">
              <div className="text-center lg:text-left">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">AVALON TOKEN</h3>
                <p className="text-slate-400 text-sm sm:text-base">Harnessing Volatility for Steady Returns</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 text-center sm:text-left">
                <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">
                  Dashboard
                </Link>
                <Link to="/presale" className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base">
                  Presale
                </Link>
                <a
                  href="https://sepolia.basescan.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors inline-flex items-center justify-center sm:justify-start text-sm sm:text-base"
                >
                  Explorer <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </a>
              </div>
            </div>
            
            <div className="border-t border-slate-800 mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-6 lg:pt-8 text-center text-slate-400">
              <p className="text-xs sm:text-sm">&copy; 2025 Avalon Token. Built on Base. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;