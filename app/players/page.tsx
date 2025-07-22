"use client"

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function PlayerDirectoryPage() {
  const [progress, setProgress] = useState(0);
  const [loadingTexts, setLoadingTexts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sample player data with correct SAL values (max 25)
  const samplePlayers = [
    { name: "Player One", team: "Archangels", sal: 18.25, position: "Forward" },
    { name: "Player Two", team: "Wizards", sal: 15.50, position: "Midfielder" },
    { name: "Player Three", team: "Valkyries", sal: 19.75, position: "Defender" },
    { name: "Player Four", team: "Surge", sal: 17.00, position: "Forward" }
  ];
  
  // Simulate development progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 78) {
          clearInterval(interval);
          return 78; // Cap at 78% to show it's still in development
        }
        return prev + Math.random() * 4;
      });
    }, 1000);
    
    // Development progress log messages
    const texts = [
      "Initializing player database...",
      "Setting up player rating system...",
      "Creating filtering algorithms...",
      "Building search functionality...",
      "Implementing SAL calculations...",
      "Designing player cards...",
      "Configuring eligibility filters..."
    ];
    
    let textIndex = 0;
    const textInterval = setInterval(() => {
      if (textIndex < texts.length) {
        setLoadingTexts(prev => [...prev, texts[textIndex]]);
        textIndex++;
      } else {
        clearInterval(textInterval);
      }
    }, 1500);
    
    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-decor absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="bg-decor absolute bottom-40 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
        <div className="bg-decor hidden lg:block absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-purple-400/5 blur-2xl"></div>
        
        {/* Animated player icons floating in background */}
        <div className="absolute top-1/4 left-10 opacity-20 text-5xl animate-float-slow text-blue-400">👤</div>
        <div className="absolute top-1/3 right-10 opacity-10 text-4xl animate-float-slow-reverse text-purple-400">👥</div>
        <div className="absolute bottom-1/4 left-1/3 opacity-15 text-6xl animate-float-medium text-blue-400">🏆</div>
      </div>
      
      <Navigation />
      
      <div className="container mx-auto px-4 py-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced title with pulsing effect */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200">
                Player Directory
              </h1>
              <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-xl animate-pulse-slow -z-10"></div>
            </div>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              The comprehensive database of all Beluga League players and statistics
            </p>
          </div>
          
          {/* Development progress visualization */}
          <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl mb-8">
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-blue-200">Development Progress</span>
                <span className="text-blue-300 font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Terminal style progress log */}
            <div className="bg-black/30 rounded-xl border border-white/5 p-4 mb-6 h-40 overflow-y-auto scrollbar-thin font-mono text-sm">
              <p className="text-green-400 mb-2">$ initializing player directory module...</p>
              {loadingTexts.map((text, index) => (
                <p key={index} className={`${index % 2 === 0 ? 'text-blue-300' : 'text-purple-300'} mb-1`}>
                  $ {text}
                  {index === loadingTexts.length - 1 && (
                    <span className="inline-block animate-pulse">_</span>
                  )}
                </p>
              ))}
            </div>
            
            {/* Estimated release timeline */}
            <div className="text-center">
              <p className="text-xl text-blue-100 mb-2">
                Estimated Release: <span className="text-purple-300 font-bold">A couple days</span>
              </p>
              <p className="text-blue-200 max-w-lg mx-auto">
                Our development team is working hard to bring you a comprehensive player database with advanced filtering and searching capabilities.
              </p>
            </div>
          </div>
          
          {/* Player Directory UI Preview */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">
              Upcoming Features Preview
            </h2>
            
            {/* Search and filters mockup */}
            <div className="bg-black/20 rounded-lg p-5 mb-6 border border-white/10">
              <div className="flex flex-col md:flex-row gap-4 mb-5">
                <div className="flex-grow">
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full bg-black/40 text-white border border-blue-500/30 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:border-blue-400 transition-all duration-300"
                      placeholder="Search players..."
                      disabled
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute left-3 top-3.5 text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 transition px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  Filters
                </button>
              </div>
              
              {/* Filter options mockup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <h3 className="text-sm font-medium text-blue-300 mb-2">SAL Range</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">12.00</span>
                    <div className="w-full mx-3 h-1 bg-blue-900/50 rounded-full relative">
                      <div className="absolute left-1/4 right-1/4 h-1 bg-blue-500 rounded-full"></div>
                      <div className="absolute left-1/4 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-blue-300"></div>
                      <div className="absolute right-1/4 translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-blue-300"></div>
                    </div>
                    <span className="text-white font-medium">22.50</span>
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <h3 className="text-sm font-medium text-blue-300 mb-2">Player Status</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <input type="checkbox" checked disabled className="w-4 h-4 bg-blue-600 rounded border-blue-500" />
                      <label className="ml-1.5 text-sm text-white">Active</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" disabled className="w-4 h-4 bg-gray-700 rounded border-gray-600" />
                      <label className="ml-1.5 text-sm text-white">Inactive</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" checked disabled className="w-4 h-4 bg-blue-600 rounded border-blue-500" />
                      <label className="ml-1.5 text-sm text-white">Eligible</label>
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                  <h3 className="text-sm font-medium text-blue-300 mb-2">Team</h3>
                  <div className="relative">
                    <select disabled className="w-full bg-black/40 text-white border border-blue-500/30 rounded px-3 py-1.5 appearance-none focus:outline-none focus:border-blue-400 transition-all duration-300">
                      <option>All Teams</option>
                    </select>
                    <div className="absolute right-3 top-2.5 text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Player cards preview */}
            <div className="space-y-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-blue-200">Players</h3>
                <div className="flex gap-2">
                  <button className={`px-3 py-1 rounded-md ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-black/20 text-blue-300 border border-white/10'}`} onClick={() => setActiveTab('all')}>
                    All
                  </button>
                  <button className={`px-3 py-1 rounded-md ${activeTab === 'favorites' ? 'bg-blue-600 text-white' : 'bg-black/20 text-blue-300 border border-white/10'}`} onClick={() => setActiveTab('favorites')}>
                    Favorites
                  </button>
                </div>
              </div>
              
              {/* Player cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {samplePlayers.map((player, i) => (
                  <div key={i} className="bg-gradient-to-br from-blue-900/40 to-purple-900/30 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-300 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-purple-600/0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold text-lg">
                        {player.name.charAt(0)}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-white font-bold flex items-center gap-1">
                          {player.name}
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500/30 rounded-full text-blue-200 ml-2">
                            {player.position}
                          </span>
                        </h3>
                        <p className="text-blue-200 text-sm">{player.team}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">{player.sal.toFixed(2)}</div>
                        <div className="text-xs text-blue-400 uppercase">SAL</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">Active</span>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">Eligible</span>
                      </div>
                      <button className="text-blue-400 hover:text-blue-300 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="absolute top-0 right-0 -mt-1 -mr-1">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500/0 to-purple-500/10 rotate-45 transform origin-bottom-left"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* View more button */}
              <div className="flex justify-center mt-6">
                <button className="px-6 py-2 rounded-full bg-black/40 border border-white/10 text-blue-300 hover:text-blue-200 hover:border-blue-400/30 transition flex items-center gap-2">
                  <span>View More</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Highlighted features */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8 mb-10">
            <h2 className="text-2xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">
              Player Directory Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/20 rounded-xl p-5 border border-white/10 hover:border-blue-400/30 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-200 mb-2 group-hover:text-blue-100 transition-colors duration-300">Advanced Sorting</h3>
                <p className="text-blue-100/90">
                  Sort players by SAL (skill assessment level), win rate, goals per game, and many other metrics. Easily identify top performers in each category.
                </p>
              </div>
              
              <div className="bg-black/20 rounded-xl p-5 border border-white/10 hover:border-blue-400/30 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-purple-200 mb-2 group-hover:text-purple-100 transition-colors duration-300">SAL Range Filtering</h3>
                <p className="text-blue-100/90">
                  Filter players within specific skill ranges. Set minimum and maximum SAL values (0-25) to find players that match your team's competitive level.
                </p>
              </div>
              
              <div className="bg-black/20 rounded-xl p-5 border border-white/10 hover:border-blue-400/30 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-indigo-200 mb-2 group-hover:text-indigo-100 transition-colors duration-300">Eligibility Tracking</h3>
                <p className="text-blue-100/90">
                  Easily identify eligible players with our eligibility tracking system. Toggle between all players and only those eligible for upcoming events or seasons.
                </p>
              </div>
              
              <div className="bg-black/20 rounded-xl p-5 border border-white/10 hover:border-blue-400/30 transition-colors duration-300 group">
                <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center mb-4 group-hover:bg-cyan-600/30 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-cyan-200 mb-2 group-hover:text-cyan-100 transition-colors duration-300">Smart Search</h3>
                <p className="text-blue-100/90">
                  Powerful search functionality lets you find players by name, team, position, or specific stat thresholds. Results update instantly as you type.
                </p>
              </div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/" 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-medium text-white hover:from-blue-600 hover:to-purple-700 transition shadow-lg inline-block group overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Return to Home
              </span>
              <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 bg-gradient-to-r from-blue-600/50 to-purple-700/50 transition-transform duration-300"></span>
            </Link>
            
            <Link 
              href="/schedules" 
              className="px-8 py-4 bg-black/30 border border-white/10 rounded-full font-medium text-white hover:bg-black/50 hover:border-blue-400/30 transition shadow-lg inline-block"
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                View Schedules
              </span>
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes float-slow-reverse {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        .animate-float-slow-reverse {
          animation: float-slow-reverse 7s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 4s ease-in-out infinite;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
}