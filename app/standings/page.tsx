"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StandingsPage() {
  const [progress, setProgress] = useState(0);
  const [loadingTexts, setLoadingTexts] = useState<string[]>([]);
  
  // Simulate development progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85; // Cap at 85% to show it's still in development
        }
        return prev + Math.random() * 5;
      });
    }, 1000);
    
    // Development progress log messages
    const texts = [
      "Initializing database structure...",
      "Creating team rankings algorithm...",
      "Setting up win/loss tracking system...",
      "Implementing division sorting...",
      "Building UI components...",
      "Integrating with match results...",
      "Testing data visualization..."
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
        
        {/* Animated code brackets floating in background */}
        <div className="absolute top-1/4 left-10 opacity-20 text-5xl animate-float-slow text-blue-400">{`{ }`}</div>
        <div className="absolute top-1/3 right-10 opacity-10 text-4xl animate-float-slow-reverse text-purple-400">{`[ ]`}</div>
        <div className="absolute bottom-1/4 left-1/3 opacity-15 text-6xl animate-float-medium text-blue-400">{`( )`}</div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-8 relative z-10">
        <div className="bg-black/40 backdrop-blur-md p-8 sm:p-12 rounded-2xl border border-white/10 shadow-xl max-w-3xl w-full">
          {/* Enhanced title with pulsing effect */}
          <div className="relative mb-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200 inline-block">
              Team Standings
            </h1>
            <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-xl animate-pulse-slow -z-10"></div>
          </div>
          
          {/* Development progress visualization */}
          <div className="mb-10">
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
          
          {/* 3D Trophy visualization */}
          <div className="relative w-40 h-40 mx-auto mb-10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse-slow"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Trophy Icon */}
              <svg className="w-24 h-24 text-yellow-300/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            
            {/* Rotating orbiting dot */}
            <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '8s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
          </div>
          
          {/* Dynamic progress log */}
          <div className="bg-black/30 rounded-xl border border-white/5 p-4 mb-8 h-48 overflow-y-auto scrollbar-thin font-mono text-sm">
            <p className="text-green-400 mb-2">$ initializing standings module...</p>
            {loadingTexts.map((text, index) => (
              <p key={index} className={`${index % 2 === 0 ? 'text-blue-300' : 'text-purple-300'} mb-1`}>
                $ {text}
                {index === loadingTexts.length - 1 && (
                  <span className="inline-block animate-pulse">_</span>
                )}
              </p>
            ))}
          </div>
          
          {/* Estimated timeline */}
          <div className="text-center mb-8">
            <p className="text-xl text-blue-100 mb-2">
              Estimated Release: <span className="text-purple-300 font-bold">A couple days</span>
            </p>
            <p className="text-blue-200 max-w-lg mx-auto">
              Our development team is working hard to bring you comprehensive standings with 
              team statistics, performance metrics, and interactive filters.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
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
    </div>
  );
}
