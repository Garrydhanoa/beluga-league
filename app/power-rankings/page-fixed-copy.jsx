"use client"

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import FloatingParticles from '../components/FloatingParticles';
import '../header-size-fix.js';
import Image from 'next/image';

// Import our custom styles
import './power-rankings.css';

// Current week for default selection
const CURRENT_WEEK = 1; // Change this as the season progresses

// Mock historical data for visualization (we'll simulate trends)
const mockHistoricalRanks = {
  "Immortals": [2, 1, 1, 1, 2, 1, 1],
  "Kingdom": [1, 2, 3, 2, 1, 2, 2],
  "Acid Esports": [3, 3, 2, 3, 3, 4, 3],
  "Panthers": [4, 4, 4, 4, 4, 3, 4],
  "Wizards": [5, 5, 6, 5, 5, 5, 5],
};

export default function PowerRankingsPage() {
  // State variables
  const [activeTab, setActiveTab] = useState("majors");
  const [activeWeek, setActiveWeek] = useState(CURRENT_WEEK);
  const [powerRankings, setPowerRankings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animateItems, setAnimateItems] = useState(false);
  const [showHistoricalView, setShowHistoricalView] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [spotlightActive, setSpotlightActive] = useState(false);
  
  // Mouse position for spotlight effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Refs
  const spotlightRef = useRef(null);
  const containerRef = useRef(null);
  
  // State for tracking data freshness
  const [fetchStatus, setFetchStatus] = useState({
    fromCache: false,
    cachedAt: null,
    fetchError: null
  });

  // Add entrance animations after initial render and set up effects
  useEffect(() => {
    setTimeout(() => {
      setAnimateItems(true);
    }, 100);
    
    // Force header size on mobile
    if (typeof window !== 'undefined' && window.innerWidth <= 640) {
      const header = document.querySelector('.super-large-mobile-header');
      if (header) {
        header.style.fontSize = '3.2rem';
        header.style.lineHeight = '1.1';
      }
    }
    
    // Setup spotlight effect
    const handleMouseMove = (e) => {
      if (!containerRef.current || !spotlightRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const spotX = e.clientX;
      const spotY = e.clientY;
      
      // Only show spotlight when mouse is over container
      if (
        spotX >= containerRect.left && 
        spotX <= containerRect.right && 
        spotY >= containerRect.top && 
        spotY <= containerRect.bottom
      ) {
        mouseX.set(spotX);
        mouseY.set(spotY);
        setSpotlightActive(true);
      } else {
        setSpotlightActive(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Create confetti celebration for first visit
    const hasSeenConfetti = sessionStorage.getItem('confetti-shown');
    if (!hasSeenConfetti && typeof window !== 'undefined') {
      setTimeout(() => {
        createConfetti();
        sessionStorage.setItem('confetti-shown', 'true');
      }, 1500);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);
  
  // Function to create confetti celebration effect
  const createConfetti = () => {
    const colors = ['#FCD34D', '#60A5FA', '#F472B6', '#A78BFA', '#34D399'];
    const container = document.body;
    
    // Create 50 confetti pieces
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 10 + 10}px`;
      confetti.style.opacity = '1';
      confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
      confetti.style.animationDelay = `${Math.random() * 3}s`;
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      container.appendChild(confetti);
      
      // Remove after animation is complete
      setTimeout(() => {
        if (confetti.parentNode === container) {
          container.removeChild(confetti);
        }
      }, 5000);
    }
  };

  // Handle data fetching
  useEffect(() => {
    async function fetchPowerRankings() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check for cached data
        const cacheKey = `power-rankings-${activeTab}-week${activeWeek}`;
        let useCachedData = false;
        
        try {
          const cachedData = localStorage.getItem(cacheKey);
          const cachedTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
          
          if (cachedData && cachedTimestamp) {
            const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
            // Use cache if it's less than 24 hours old
            if (cacheAge < 24 * 60 * 60 * 1000) {
              useCachedData = true;
              const data = JSON.parse(cachedData);
              setPowerRankings(data);
              setFetchStatus({
                fromCache: true,
                cachedAt: parseInt(cachedTimestamp, 10),
                fetchError: null
              });
              setIsLoading(false);
              console.log(`Using cached power rankings data from ${new Date(parseInt(cachedTimestamp, 10)).toLocaleString()}`);
            }
          }
        } catch (e) {
          console.error("Error checking cache:", e);
        }
        
        // Fetch fresh data if no valid cache
        if (!useCachedData) {
          const response = await fetch(`/api/power-rankings?division=${activeTab}&week=${activeWeek}`);
          const data = await response.json();
          
          if (response.ok) {
            setPowerRankings(data);
            setFetchStatus({
              fromCache: data.fromCache || false,
              cachedAt: data.cachedAt || Date.now(),
              fetchError: data.fetchError || null
            });
            
            // Save to cache
            try {
              localStorage.setItem(cacheKey, JSON.stringify(data));
              localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
            } catch (e) {
              console.warn("Error saving to cache:", e);
            }
          } else {
            throw new Error(data.error || "Failed to fetch power rankings");
          }
        }
      } catch (err) {
        console.error("Error fetching power rankings:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPowerRankings();
  }, [activeTab, activeWeek]);

  // Helper function to get team initials
  const getTeamInitials = (teamName) => {
    return teamName.split(' ').map(word => word[0]).join('');
  };

  // Helper to format rank numbers
  const formatRank = (rank) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };
  
  // Helper to determine team trend (for visual indicators)
  const getTeamTrend = (teamName) => {
    if (!mockHistoricalRanks[teamName] || activeWeek <= 1) return 'stable';
    
    // Use mock data for demonstration
    const history = mockHistoricalRanks[teamName];
    if (!history || history.length < 2) return 'stable';
    
    // Compare current rank to previous rank
    const currentWeekIndex = Math.min(activeWeek - 1, history.length - 1);
    const prevWeekIndex = Math.max(0, currentWeekIndex - 1);
    
    if (history[currentWeekIndex] < history[prevWeekIndex]) return 'improved';
    if (history[currentWeekIndex] > history[prevWeekIndex]) return 'declined';
    return 'stable';
  };
  
  // Helper to get trend icon and badge
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improved':
        return {
          icon: '↗️',
          class: 'rising',
          badge: <span className="rank-badge badge-improved">↑ Rising</span>
        };
      case 'declined':
        return {
          icon: '↘️',
          class: 'falling',
          badge: <span className="rank-badge badge-declined">↓ Falling</span>
        };
      default:
        return {
          icon: '↔️',
          class: '',
          badge: <span className="rank-badge badge-stable">― Steady</span>
        };
    }
  };
  
  // Helper to create 3D tilt effect for cards
  const handleCardTilt = (e, elementId) => {
    const card = document.getElementById(elementId);
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = (centerY - y) / 10;
    const tiltY = (x - centerX) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
  };
  
  // Helper to reset card tilt
  const resetCardTilt = (elementId) => {
    const card = document.getElementById(elementId);
    if (card) {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
  };
  
  // Helper to get random achievement for top players
  const getPlayerAchievement = (index) => {
    const achievements = ['🔥', '🏆', '👑', '⭐', '💎'];
    // Only show for top 3
    if (index < 3) {
      return achievements[index];
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white relative overflow-hidden" ref={containerRef}>
      {/* Spotlight effect that follows cursor */}
      <motion.div 
        ref={spotlightRef}
        className={`spotlight ${spotlightActive ? 'spotlight-active' : ''}`}
        style={{ 
          x: mouseX, 
          y: mouseY,
          opacity: spotlightActive ? 1 : 0
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: spotlightActive ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-decor absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse-slow"></div>
        <div className="bg-decor absolute bottom-40 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl animate-pulse-slow"></div>
        <div className="bg-decor hidden lg:block absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-purple-400/5 blur-2xl animate-pulse-slow"></div>
        
        {/* Cyberpunk grid background */}
        <div className="cyberpunk-grid"></div>
        
        {/* Animated floating particles */}
        <FloatingParticles />
      </div>
      
      <motion.div 
        className="container mx-auto px-3 sm:px-4 py-6 sm:py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Enhanced interactive header */}
        <motion.div 
          className="relative mb-10 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            {[...Array(8)].map((_, i) => (
              <motion.div 
                key={`deco-${i}`}
                className="absolute rounded-full"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  delay: i * 0.2
                }}
                style={{
                  width: `${40 + i * 20}px`,
                  height: `${40 + i * 20}px`,
                  border: `1px solid rgba(59, 130, 246, ${0.3 - i * 0.03})`,
                  borderRadius: '50%'
                }}
              />
            ))}
          </div>
          
          <motion.h1 
            className="super-large-mobile-header text-5xl sm:text-5xl md:text-6xl font-bold mb-1 sm:mb-3 text-center relative z-10"
          >
            <div className="professional-header-wrapper px-4 py-2 glow-text">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200 shadow-text">
                Power Rankings
              </span>
              <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-blue-500 opacity-10 blur-sm whitespace-nowrap">
                Power Rankings
              </span>
              
              {/* Animated stars */}
              {[1, 2, 3, 4].map((num) => (
                <motion.div
                  key={`star-${num}`}
                  className="absolute text-yellow-300"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                    delay: num * 0.5
                  }}
                  style={{
                    top: `${Math.random() * 100 - 20}%`,
                    left: `${num * 25 - 10}%`,
                    fontSize: `${Math.random() * 14 + 10}px`
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>
          </motion.h1>
          
          {/* Season week counter */}
          <motion.div
            className="text-center mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 text-blue-200 text-sm">
              Season Week {CURRENT_WEEK} of 8
            </span>
          </motion.div>
        </motion.div>

        {/* Enhanced Division Tabs */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {['aa', 'aaa', 'majors'].map((division) => (
            <motion.button 
              key={division}
              className={`relative px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all duration-300 transform 
                ${activeTab === division 
                  ? 'neon-border scale-105 shadow-lg' 
                  : 'bg-black/30 hover:bg-black/50 border border-white/10'
                } overflow-hidden group division-tab w-[30%] sm:w-auto neon-button`}
              onClick={() => setActiveTab(division)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`relative z-10 ${activeTab === division ? 'text-white' : 'group-hover:text-blue-200 transition-colors'}`}>
                {division === 'aa' ? 'AA' : division === 'aaa' ? 'AAA' : 'MAJORS'}
              </span>
              {activeTab === division && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40 blur-sm"
                  layoutId="activeTab"
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                ></motion.div>
              )}
              
              {/* Pulse effect for active tab */}
              {activeTab === division && (
                <motion.div 
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-600/20"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                ></motion.div>
              )}
              
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </motion.button>
          ))}
        </motion.div>

        {/* Enhanced Week Selection with toggle for historical view */}
        <motion.div 
          className="flex flex-col items-center gap-4 mb-8"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
              <motion.button 
                key={week}
                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${activeWeek === week 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white glow-border' 
                    : 'bg-black/20 text-blue-300 hover:bg-black/40'
                  }`}
                onClick={() => setActiveWeek(week)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Week {week}
                {week === activeWeek && (
                  <motion.div 
                    className="absolute inset-0 rounded-md bg-blue-400/20"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2
                    }}
                  ></motion.div>
                )}
              </motion.button>
            ))}
          </div>
          
          {/* Toggle for historical view */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all
                ${showHistoricalView
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-black/30 text-blue-300 border border-white/10'
                }`}
              onClick={() => setShowHistoricalView(!showHistoricalView)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
              {showHistoricalView ? 'Hide Ranking History' : 'Show Ranking History'}
            </button>
          </motion.div>
        </motion.div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${activeTab}-${activeWeek}-${isLoading}-${error ? 'error' : 'content'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className={`transition-all duration-500 ${animateItems ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                {/* Enhanced loading spinner */}
                <motion.div 
                  className="relative w-20 h-20 mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                >
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
                  <motion.div 
                    className="absolute inset-0 rounded-full border-t-4 border-blue-500"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  ></motion.div>
                  <div className="absolute inset-2 rounded-full border-2 border-purple-500/20"></div>
                  <motion.div 
                    className="absolute inset-2 rounded-full border-t-2 border-purple-500"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  ></motion.div>
                </motion.div>
                <p className="text-blue-200 animate-pulse">Loading power rankings data...</p>
                <motion.p 
                  className="text-sm text-blue-300/70 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 1 }}
                >
                  Analyzing team performances...
                </motion.p>
              </div>
            ) : error ? (
              <motion.div 
                className="text-center py-10 px-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <div className="inline-block bg-red-900/30 p-6 rounded-lg mb-6 border border-red-500/30 glow-border">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <motion.h3 
                    className="text-xl font-bold text-red-300 mb-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    Error Loading Data
                  </motion.h3>
                </div>
                <p className="text-white/80 mb-8 max-w-md mx-auto">{error}</p>
                <motion.button 
                  onClick={() => {
                    setIsLoading(true);
                    setError(null);
                    // Force a new fetch by clearing cache for this item
                    const cacheKey = `power-rankings-${activeTab}-week${activeWeek}`;
                    localStorage.removeItem(cacheKey);
                    localStorage.removeItem(`${cacheKey}-timestamp`);
                    window.location.reload();
                  }} 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all shadow-lg neon-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </motion.div>
            ) : powerRankings?.error ? (
              <motion.div 
                className="text-center py-16 px-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <div className="inline-block bg-blue-900/30 p-6 rounded-lg mb-6 border border-blue-500/30 glow-border">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <motion.h3 
                    className="text-xl font-bold text-blue-300 mb-2 glow-text"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    Coming Soon!
                  </motion.h3>
                </div>
                <p className="text-white/80 max-w-2xl mx-auto">{powerRankings.error}</p>
                
                <motion.div 
                  className="mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-blue-300 mb-4">Explore other divisions or weeks:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {activeWeek > 1 && (
                      <motion.button 
                        onClick={() => setActiveWeek(activeWeek - 1)} 
                        className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 rounded-full transition-all shadow-lg flex items-center gap-2 neon-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Check Week {activeWeek - 1}
                      </motion.button>
                    )}
                    {activeTab !== 'majors' && (
                      <motion.button 
                        onClick={() => setActiveTab('majors')} 
                        className="px-4 py-2 bg-gradient-to-r from-purple-700 to-purple-600 rounded-full transition-all shadow-lg flex items-center gap-2 neon-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        View MAJORS
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <>
                {/* Historical View Toggle Content */}
                {showHistoricalView && powerRankings?.data?.teams?.length > 0 && (
                  <motion.div 
                    className="mb-8 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-5 overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-xl font-bold mb-4 glow-text">Ranking History</h3>
                    
                    <div className="space-y-6">
                      {powerRankings?.data?.teams?.slice(0, 5).map((team, index) => (
                        <div key={`history-${index}`} className="space-y-2">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-white/10 bg-gradient-to-br from-blue-900/50 to-purple-900/50">
                              <Image
                                src={`/logos/${team.team}.png`}
                                alt={team.team}
                                width={20}
                                height={20}
                                className="object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.innerHTML = `<span class="text-xs font-bold">${getTeamInitials(team.team)}</span>`;
                                  }
                                }}
                              />
                            </div>
                            <span className="font-medium text-sm">{team.team}</span>
                          </div>
                          
                          {/* History Chart - showing mock historical data */}
                          <div className="history-chart">
                            {mockHistoricalRanks[team.team] ? (
                              mockHistoricalRanks[team.team].map((rank, weekIndex) => (
                                <motion.div
                                  key={`chart-${team.team}-${weekIndex}`}
                                  className="history-bar"
                                  style={{ 
                                    height: `${40 - (rank * 5)}px`,
                                    backgroundColor: weekIndex + 1 === activeWeek 
                                      ? 'rgba(59, 130, 246, 1)' 
                                      : weekIndex + 1 > activeWeek
                                        ? 'rgba(100, 100, 100, 0.3)'
                                        : `rgba(${59 + (rank * 10)}, ${130 - (rank * 5)}, 246, 0.8)`
                                  }}
                                  data-week={`W${weekIndex + 1}`}
                                  data-rank={`#${rank}`}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${40 - (rank * 5)}px` }}
                                  transition={{ duration: 0.5, delay: weekIndex * 0.1 }}
                                />
                              ))
                            ) : (
                              // Placeholder bars if no historical data
                              [...Array(7)].map((_, weekIndex) => (
                                <motion.div
                                  key={`chart-placeholder-${team.team}-${weekIndex}`}
                                  className="history-bar"
                                  style={{ 
                                    height: '20px',
                                    backgroundColor: 'rgba(100, 100, 100, 0.3)'
                                  }}
                                  data-week={`W${weekIndex + 1}`}
                                  initial={{ height: 0 }}
                                  animate={{ height: '20px' }}
                                  transition={{ duration: 0.5, delay: weekIndex * 0.1 }}
                                />
                              ))
                            )}
                            {/* Current week indicator */}
                            <motion.div
                              className="history-bar"
                              style={{
                                height: `${40 - (index + 1) * 5}px`,
                                background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)'
                              }}
                              data-week={`NOW`}
                              data-rank={`#${index + 1}`}
                              initial={{ height: 0 }}
                              animate={{ height: `${40 - (index + 1) * 5}px` }}
                              transition={{ duration: 0.5, delay: 0.7 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              
                {/* Main Rankings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  {/* Teams Rankings with Enhanced 3D Cards */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden neon-border"
                  >
                    <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 py-4 px-5 flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Top Teams
                      </h3>
                      <span className="text-sm text-blue-300">{activeTab.toUpperCase()} Division</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {powerRankings?.data?.teams?.map((team, index) => {
                        const trend = getTeamTrend(team.team);
                        const trendInfo = getTrendIcon(trend);
                        
                        return (
                          <motion.div 
                            id={`team-card-${index}`}
                            key={`team-${index}`}
                            className="p-5 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors relative tilt-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + (index * 0.05), duration: 0.5 }}
                            onMouseMove={(e) => handleCardTilt(e, `team-card-${index}`)}
                            onMouseLeave={() => resetCardTilt(`team-card-${index}`)}
                            whileHover={{ scale: 1.01 }}
                          >
                            {/* Crown for first place */}
                            {index === 0 && (
                              <div className="crown">👑</div>
                            )}
                            
                            {/* Trend indicator */}
                            {trend !== 'stable' && (
                              <div className={trendInfo.class}>
                                {trendInfo.icon}
                              </div>
                            )}
                            
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 flex items-center justify-center text-lg font-bold
                                ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 glow-border' : 
                                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' : 
                                  index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100' :
                                  'bg-gradient-to-br from-blue-900 to-blue-800 text-blue-200'} 
                                rounded-full shadow-lg card-content`}
                              >
                                {index + 1}
                              </div>
                            </div>
                            
                            <div className="flex flex-grow items-center gap-3 card-content">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border ${index < 3 ? 'border-blue-400/30' : 'border-white/10'} bg-gradient-to-br from-blue-900/50 to-purple-900/50 shadow-inner`}>
                                <Image
                                  src={`/logos/${team.team}.png`}
                                  alt={team.team}
                                  width={45}
                                  height={45}
                                  className="object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.parentElement) {
                                      e.currentTarget.parentElement.innerHTML = `<span class="text-base font-bold">${getTeamInitials(team.team)}</span>`;
                                    }
                                  }}
                                />
                              </div>
                              
                              <div>
                                <div className="flex items-center">
                                  <Link href={`/teams/${encodeURIComponent(team.team)}`} className={`font-medium text-base sm:text-lg hover:text-blue-300 transition ${index === 0 ? 'glow-text' : ''}`}>
                                    {team.team}
                                  </Link>
                                  {index < 5 && trendInfo.badge}
                                </div>
                                <div className="text-sm text-blue-300 flex items-center gap-2">
                                  <span className="font-semibold">{team.points}</span> points
                                  
                                  {/* Fire icon for "hot" teams with high points */}
                                  {team.points > 85 && (
                                    <span className="text-amber-400 animate-pulse">🔥</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="hidden sm:flex flex-col items-end text-right card-content">
                              <span className="text-sm font-medium">
                                {formatRank(index + 1)} place
                              </span>
                              {index < 3 && (
                                <span className="text-xs text-blue-300 mt-1">
                                  {index === 0 ? 'Champion' : index === 1 ? 'Runner-up' : 'Top 3'}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  {/* Players Rankings with Enhanced 3D Cards */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden neon-border"
                  >
                    <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 py-4 px-5 flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Top Players
                      </h3>
                      <span className="text-sm text-blue-300">{activeTab.toUpperCase()} Division</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {powerRankings?.data?.players?.map((player, index) => {
                        const achievement = getPlayerAchievement(index);
                        
                        return (
                          <motion.div 
                            id={`player-card-${index}`}
                            key={`player-${index}`}
                            className="p-5 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors relative tilt-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + (index * 0.05), duration: 0.5 }}
                            onMouseMove={(e) => handleCardTilt(e, `player-card-${index}`)}
                            onMouseLeave={() => resetCardTilt(`player-card-${index}`)}
                            whileHover={{ scale: 1.01 }}
                          >
                            {/* Achievement badge */}
                            {achievement && (
                              <div className="achievement">{achievement}</div>
                            )}
                            
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 flex items-center justify-center text-lg font-bold
                                ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 glow-border' : 
                                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' : 
                                  index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100' :
                                  'bg-gradient-to-br from-blue-900 to-blue-800 text-blue-200'} 
                                rounded-full shadow-lg card-content`}
                              >
                                {index + 1}
                              </div>
                            </div>
                            
                            <div className="flex-grow card-content">
                              <div className={`font-medium text-base sm:text-lg ${index === 0 ? 'glow-text' : ''}`}>
                                {player.player}
                                {index === 0 && (
                                  <span className="ml-2">👑</span>
                                )}
                              </div>
                              <div className="text-sm text-blue-300 flex items-center">
                                <span className="font-semibold">{player.points}</span> points
                                
                                {/* MVP badge for top player */}
                                {index === 0 && (
                                  <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-yellow-600 to-amber-500 text-xs rounded-full text-white">
                                    MVP
                                  </span>
                                )}
                                
                                {/* Fire icon for "hot" players with high points */}
                                {player.points > 85 && (
                                  <span className="ml-2 text-amber-400 animate-pulse">🔥</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="hidden sm:flex flex-col items-end text-right card-content">
                              <span className="text-sm font-medium">
                                {formatRank(index + 1)} place
                              </span>
                              {index < 3 && (
                                <span className="text-xs text-blue-300 mt-1">
                                  {index === 0 ? 'All-Star' : index === 1 ? 'Elite' : 'Pro'}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
                
                {/* Data Timestamp */}
                {powerRankings?.data && !powerRankings.error && (
                  <div className="mt-6 text-center text-sm text-blue-300/70">
                    <div className="inline-flex items-center bg-blue-900/30 px-3 py-1.5 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Last updated: {
                        fetchStatus.cachedAt 
                          ? new Date(fetchStatus.cachedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'America/New_York' // EST/EDT timezone
                            })
                          : 'Just now'
                      }
                      {fetchStatus.fromCache && fetchStatus.fetchError && (
                        <span className="ml-1 text-amber-300">(using cached data)</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-medium text-white hover:from-blue-700 hover:to-purple-700 transition shadow-lg inline-block neon-button"
                  >
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Home
                    </span>
                  </Link>
                  
                  <Link
                    href="/standings"
                    className="px-6 py-3 bg-black/30 border border-white/10 rounded-full font-medium text-white hover:bg-black/50 hover:border-blue-400/30 transition shadow-lg inline-block neon-button"
                  >
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      View Standings
                    </span>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
