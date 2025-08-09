"use client"

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import FloatingParticles from '../components/FloatingParticles';
import '../header-size-fix.js';
import Image from 'next/image';

// Import our custom styles
import './power-rankings.css';

// Current week for default selection
const CURRENT_WEEK = 1; // Change this as the season progresses

export default function PowerRankingsPage() {
  // State variables
  const [activeTab, setActiveTab] = useState("majors");
  const [activeWeek, setActiveWeek] = useState(CURRENT_WEEK);
  const [powerRankings, setPowerRankings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animateItems, setAnimateItems] = useState(false);
  
  // Ref for the container
  const containerRef = useRef(null);
  
  // State for tracking data freshness
  const [fetchStatus, setFetchStatus] = useState({
    fromCache: false,
    cachedAt: null,
    fetchError: null,
    nextUpdateAt: null,
    lastScheduledUpdate: null
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
    
    return () => {};
  }, []);

  // Handle data fetching
  useEffect(() => {
    async function fetchPowerRankings() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Define cache key for potential fallback use
        const cacheKey = `power-rankings-${activeTab}-week${activeWeek}`;
        
        try {
          // Add timestamp parameter to prevent browser caching, but API will still respect hourly cache
          const response = await fetch(
            `/api/power-rankings?division=${activeTab}&week=${activeWeek}&initialLoad=true&_t=${Date.now()}`,
            { cache: 'no-store' }
          );
          const data = await response.json();
          
          if (response.ok) {
            setPowerRankings(data);
            
            // Set status information including refresh schedule from server
            setFetchStatus({
              fromCache: data.fromCache || false,
              cachedAt: data.cachedAt,
              fetchError: data.fetchError || null,
              nextUpdateAt: data.refreshInfo?.nextScheduledUpdate || null,
              lastScheduledUpdate: data.refreshInfo?.lastUpdated || null,
              formattedLastUpdated: data.refreshInfo?.formattedLastUpdated || null,
              nextUpdateFormatted: data.refreshInfo?.nextUpdateFormatted || null,
              refreshInterval: data.refreshInfo?.refreshInterval || "Hourly",
              minutesUntilNextUpdate: data.refreshInfo?.minutesUntilNextUpdate || 60
            });
            
            // Still save to localStorage as fallback for error cases
            try {
              localStorage.setItem(cacheKey, JSON.stringify(data));
              localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
            } catch (e) {
              console.warn("Error saving to cache:", e);
            }
          } else {
            throw new Error(data.error || "Failed to fetch power rankings");
          }
        } catch (err) {
          console.error("API fetch error:", err);
          // If API fails, try to use cached data as fallback
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            console.log("API fetch failed, falling back to cached data");
            try {
              const data = JSON.parse(cachedData);
              setPowerRankings(data);
              setFetchStatus({
                fromCache: true,
                cachedAt: parseInt(localStorage.getItem(`${cacheKey}-timestamp`), 10) || Date.now(),
                fetchError: "Using cached data due to API error",
                nextUpdateAt: null,
                lastScheduledUpdate: null
              });
            } catch (e) {
              throw new Error("Failed to load power rankings and cache is invalid");
            }
          } else {
            throw err; // No cached data available, throw the original error
          }
        }
      } catch (err) {
        console.error("Error fetching power rankings:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Fetch initial data
    fetchPowerRankings();
    
    // NO INTERVAL REFRESH - removing this code:
    // const refreshInterval = setInterval(() => {
    //   fetchPowerRankings();
    // }, 30000); // 30 seconds
    
    // Clean up interval on unmount
    // return () => clearInterval(refreshInterval);
  }, [activeTab, activeWeek]);

  // Add this useEffect after your existing ones
  useEffect(() => {
    // Don't run this on the server
    if (typeof window === 'undefined') return;
    
    // Only set up the interval if we have nextUpdateAt data
    if (!fetchStatus.nextUpdateAt) return;
    
    const nextUpdateTime = new Date(fetchStatus.nextUpdateAt).getTime();
    
    // Create an interval to update the "minutes until next update" counter
    const intervalId = setInterval(() => {
      const now = Date.now();
      const msUntilNextUpdate = Math.max(0, nextUpdateTime - now);
      const minutesUntilNextUpdate = Math.ceil(msUntilNextUpdate / 60000);
      
      setFetchStatus(prev => ({
        ...prev,
        minutesUntilNextUpdate
      }));
      
      // If it's time for the next update and the user is still on the page
      // (within 1 minute of the scheduled update)
      if (minutesUntilNextUpdate <= 0) {
        // Don't immediately fetch - wait 5 seconds to avoid hammering the API
        // if multiple clients hit exactly at the hour mark
        setTimeout(() => {
          // Fetch new data when the hour changes
          fetchPowerRankings();
        }, 5000);
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchStatus.nextUpdateAt]);

  // Helper function to get team initials
  const getTeamInitials = (teamName) => {
    if (!teamName) return '';
    return teamName.split(' ').map(word => word[0]).join('');
  };
  
  // Helper to handle image loading errors with fallbacks
  const handleImageError = (e, teamName, size = 'base') => {
    // First try an alternative approach - sometimes team names might have spaces or special characters
    const normalizedTeamName = teamName.replace(/\s+/g, '%20');
    
    // Try with the normalized name
    if (normalizedTeamName !== teamName) {
      e.currentTarget.src = `/logos/${normalizedTeamName}.png`;
      
      // Add another error handler for the second attempt
      e.currentTarget.onerror = () => {
        e.currentTarget.style.display = 'none';
        if (e.currentTarget.parentElement) {
          const fontSize = size === 'small' ? 'text-xs' : size === 'base' ? 'text-base' : 'text-lg';
          e.currentTarget.parentElement.innerHTML = `<span class="${fontSize} font-bold">${getTeamInitials(teamName)}</span>`;
        }
      };
    } else {
      // If name is already normalized, just show initials
      e.currentTarget.style.display = 'none';
      if (e.currentTarget.parentElement) {
        const fontSize = size === 'small' ? 'text-xs' : size === 'base' ? 'text-base' : 'text-lg';
        e.currentTarget.parentElement.innerHTML = `<span class="${fontSize} font-bold">${getTeamInitials(teamName)}</span>`;
      }
    }
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
    // Simplified to avoid hydration errors
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white relative overflow-hidden" ref={containerRef}>
      {/* Static glow effect instead of cursor spotlight for better performance */}
      <div className="fixed top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-blue-500/10 blur-3xl pointer-events-none opacity-50"></div>
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-decor absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="bg-decor absolute bottom-40 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
        <div className="bg-decor hidden lg:block absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-purple-400/5 blur-2xl"></div>
        
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
          className="relative mb-8 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        >
          <motion.h1 
            className="super-large-mobile-header text-5xl sm:text-5xl md:text-6xl font-bold mb-1 sm:mb-3 text-center relative z-10"
          >
            <div className="professional-header-wrapper px-4 py-2 glow-text">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200 shadow-text">
                Power Rankings
              </span>
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
          
          {/* Live update info - no last updated timestamp */}
          {powerRankings?.data && !powerRankings.error && (
            <div className="mt-6 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <div className="inline-flex items-center bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-blue-200">
                      Last updated: {fetchStatus.formattedLastUpdated || 'Just now'}
                    </span>
                    <span className="text-xs text-blue-300/70">
                      <strong>Data refreshes hourly</strong> - page refreshes don&apos;t update data
                    </span>
                  </div>
                </div>
                
                {/* Show next update time */}
                {fetchStatus.nextUpdateFormatted && (
                  <div className="text-xs bg-blue-900/20 px-3 py-1 rounded-lg text-blue-300/80">
                    Next data refresh: <span className="font-medium text-blue-200">{fetchStatus.nextUpdateFormatted} EST</span>
                    {fetchStatus.minutesUntilNextUpdate && (
                      <span className="ml-1">({fetchStatus.minutesUntilNextUpdate} {fetchStatus.minutesUntilNextUpdate === 1 ? 'minute' : 'minutes'} from now)</span>
                    )}
                  </div>
                )}
                
                {/* Show cached data notice if applicable */}
                {fetchStatus.fromCache && fetchStatus.fetchError && (
                  <div className="text-xs px-3 py-1 bg-amber-900/30 text-amber-300 rounded-full">
                    Using cached data - Unable to fetch latest rankings
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Enhanced Division Tabs */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          role="tablist"
          aria-label="Division Tabs"
        >
          {['aa', 'aaa', 'majors'].map((division) => (
            <motion.button 
              key={division}
              className={`relative px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all duration-300 transform 
                ${activeTab === division 
                  ? 'neon-border scale-105 shadow-lg' 
                  : 'bg-black/30 hover:bg-black/50 border border-white/10'
                } overflow-hidden group division-tab w-[30%] sm:w-auto neon-button`}
              onClick={() => {
                // Add a brief loading transition between tab changes
                setIsLoading(true);
                setTimeout(() => {
                  setActiveTab(division);
                  setIsLoading(false);
                }, 400);
              }}
              role="tab"
              aria-selected={activeTab === division}
              aria-controls={`${division}-panel`}
              id={`${division}-tab`}
            >
              <span className={`relative z-10 ${activeTab === division ? 'text-white' : 'group-hover:text-blue-200 transition-colors'}`}>
                {division === 'aa' ? 'AA' : division === 'aaa' ? 'AAA' : 'MAJORS'}
              </span>
              {activeTab === division && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40 blur-sm"></div>
              )}
              
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </motion.button>
          ))}
        </motion.div>

        {/* Enhanced Week Selection */}
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${activeWeek === week 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white glow-border' 
                    : 'bg-black/20 text-blue-300 hover:bg-black/40'
                  }`}
                onClick={() => {
                  // Add a brief loading transition between week changes
                  setIsLoading(true);
                  setTimeout(() => {
                    setActiveWeek(week);
                    setIsLoading(false);
                  }, 300);
                }}
              >
                Week {week}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div 
          key={`${activeTab}-${activeWeek}-${isLoading ? 'loading' : 'loaded'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`transition-all duration-500 ${animateItems ? 'opacity-100' : 'opacity-0 translate-y-10'}`}
          id={`${activeTab}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
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
                  <div className="absolute inset-0 rounded-full border-t-4 border-blue-500"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-purple-500/20"></div>
                  <div className="absolute inset-2 rounded-full border-t-2 border-purple-500"></div>
                </motion.div>
                <p className="text-blue-200">Loading power rankings data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 px-4">
                <div className="inline-block bg-red-900/30 p-6 rounded-lg mb-6 border border-red-500/30 glow-border">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-red-300 mb-2">Error Loading Data</h3>
                </div>
                <p className="text-white/80 mb-8 max-w-md mx-auto">{error}</p>
                <button 
                  onClick={() => {
                    setIsLoading(true);
                    setError(null);
                    // Don't clear cache, just try again with existing data
                    // Don't actually attempt to refresh data from the API
                    setTimeout(() => {
                      // Check for cached data
                      const cacheKey = `power-rankings-${activeTab}-week${activeWeek}`;
                      try {
                        const cachedData = localStorage.getItem(cacheKey);
                        if (cachedData) {
                          setPowerRankings(JSON.parse(cachedData));
                        }
                      } catch (e) {
                        console.error("Error retrieving from cache:", e);
                      }
                      setIsLoading(false);
                    }, 800); // Show loading animation briefly then return to same state
                  }} 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all shadow-lg neon-button"
                >
                  Load From Cache
                </button>
              </div>
            ) : powerRankings?.hardcodedFallback ? (
              <>
                {/* Main Rankings Grid with Fallback Warning Banner */}
                <div className="mb-6 p-4 bg-amber-900/30 border border-amber-500/30 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium text-amber-200">Showing temporary data - Rankings will be updated shortly</span>
                  </div>
                  <p className="text-amber-100/80 text-sm">
                    {powerRankings.hardcodedReason || "The system is temporarily using backup data. Full rankings will return shortly."}
                  </p>
                </div>
                
                {/* Display the hardcoded data in the normal format */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  {/* Teams Rankings */}
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
                          <div 
                            id={`team-card-${index}`}
                            key={`team-${index}`}
                            className="p-5 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors relative tilt-card"
                          >
                            {/* Crown for first place */}
                            {index === 0 && (
                              <div className="crown">👑</div>
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
                                  src={`/logos/${encodeURIComponent(team.team)}.png`}
                                  alt={team.team}
                                  width={45}
                                  height={45}
                                  className="object-contain"
                                  onError={(e) => handleImageError(e, team.team, 'base')}
                                  priority={index < 3} // Load top teams' logos with priority
                                />
                              </div>
                              
                              <div>
                                <div className="flex items-center">
                                  <Link href={`/teams/${encodeURIComponent(team.team)}`} className={`font-medium text-base sm:text-lg hover:text-blue-300 transition ${index === 0 ? 'glow-text' : ''}`}>
                                    {team.team}
                                  </Link>
                                </div>
                                <div className="text-sm text-blue-300 flex items-center gap-2">
                                  <span className="font-semibold">{team.points}</span> points
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
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  {/* Players Rankings */}
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
                        return (
                          <div 
                            id={`player-card-${index}`}
                            key={`player-${index}`}
                            className="p-5 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors relative tilt-card"
                          >
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
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </>
            ) : powerRankings?.error ? (
              <div className="text-center py-16 px-4">
                {/* Check if it's a credentials error */}
                {powerRankings.error.toLowerCase().includes('credentials') || 
                 powerRankings.error.toLowerCase().includes('authentication') ? (
                  <div className="inline-block bg-orange-900/30 p-6 rounded-lg mb-6 border border-orange-500/30 glow-border">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-orange-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-xl font-bold text-orange-300 mb-2 glow-text">Authentication Issue</h3>
                    <p className="text-orange-100/80 max-w-md mx-auto mb-4">
                      The server is unable to authenticate with the Google Sheets API. This is a temporary issue that the site administrator needs to fix.
                    </p>
                    
                    {/* Only show this in development mode */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-left bg-black/30 p-3 rounded mt-2 border border-orange-500/20">
                        <p className="text-orange-200 font-medium mb-1">Developer Note:</p>
                        <p className="text-orange-100/70 mb-1">
                          Check that the Google API credentials are properly set in your environment variables:
                        </p>
                        <ul className="list-disc list-inside text-orange-100/70 space-y-1">
                          <li>GOOGLE_CLIENT_EMAIL</li>
                          <li>GOOGLE_PRIVATE_KEY</li>
                          <li>POWER_RANKINGS_SHEET_ID</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="inline-block bg-blue-900/30 p-6 rounded-lg mb-6 border border-blue-500/30 glow-border">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-bold text-blue-300 mb-2 glow-text">Coming Soon!</h3>
                  </div>
                )}
                
                <p className="text-white/80 max-w-2xl mx-auto">
                  {/* Clean up error message for authentication issues */}
                  {powerRankings.error.toLowerCase().includes('credentials') || 
                   powerRankings.error.toLowerCase().includes('authentication') 
                    ? "Power rankings data is temporarily unavailable. Please check back soon." 
                    : powerRankings.error}
                </p>
                
                <div className="mt-10">
                  <p className="text-blue-300 mb-4">Explore other divisions or weeks:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {activeWeek > 1 && (
                      <button 
                        onClick={() => setActiveWeek(activeWeek - 1)} 
                        className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 rounded-full transition-all shadow-lg flex items-center gap-2 neon-button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Check Week {activeWeek - 1}
                      </button>
                    )}
                    {activeTab !== 'majors' && (
                      <button 
                        onClick={() => setActiveTab('majors')} 
                        className="px-4 py-2 bg-gradient-to-r from-purple-700 to-purple-600 rounded-full transition-all shadow-lg flex items-center gap-2 neon-button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        View MAJORS
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Main Rankings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  {/* Teams Rankings */}
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
                          <div 
                            id={`team-card-${index}`}
                            key={`team-${index}`}
                            className="p-5 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors relative tilt-card"
                          >
                            {/* Crown for first place */}
                            {index === 0 && (
                              <div className="crown">👑</div>
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
                                  src={`/logos/${encodeURIComponent(team.team)}.png`}
                                  alt={team.team}
                                  width={45}
                                  height={45}
                                  className="object-contain"
                                  onError={(e) => handleImageError(e, team.team, 'base')}
                                  priority={index < 3} // Load top teams' logos with priority
                                />
                              </div>
                              
                              <div>
                                <div className="flex items-center">
                                  <Link href={`/teams/${encodeURIComponent(team.team)}`} className={`font-medium text-base sm:text-lg hover:text-blue-300 transition ${index === 0 ? 'glow-text' : ''}`}>
                                    {team.team}
                                  </Link>
                                </div>
                                <div className="text-sm text-blue-300 flex items-center gap-2">
                                  <span className="font-semibold">{team.points}</span> points
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
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  {/* Players Rankings */}
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
                        return (
                          <div 
                            id={`player-card-${index}`}
                            key={`player-${index}`}
                            className="p-5 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors relative tilt-card"
                          >
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
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-medium text-white hover:from-blue-700 hover:to-purple-700 transition shadow-lg inline-block"
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
          className="px-6 py-3 bg-black/30 border border-white/10 rounded-full font-medium text-white hover:bg-black/50 hover:border-blue-400/30 transition shadow-lg inline-block"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            View Standings
          </span>
        </Link>
      </div>
    </div>
  );
}
