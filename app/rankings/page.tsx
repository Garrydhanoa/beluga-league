"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '../components/ImageWithFallback';

export default function PowerRankingsPage() {
  const [chartData, setChartData] = useState<number[]>([]);
  const [dataPoints, setDataPoints] = useState<{x: number, y: number}[]>([]);
  const [progress, setProgress] = useState(0);
  const [loadingTexts, setLoadingTexts] = useState<string[]>([]);
  
  // Create simulated power ranking data and development progress
  useEffect(() => {
    // Generate sample chart data
    const generateData = () => {
      const data: number[] = [];
      for (let i = 0; i < 10; i++) {
        data.push(Math.floor(Math.random() * 80) + 10);
      }
      return data;
    };
    
    // Generate data points for the animated chart
    const generateDataPoints = () => {
      const points: {x: number, y: number}[] = [];
      for (let i = 0; i < 12; i++) {
        points.push({
          x: i * 50,
          y: Math.floor(Math.random() * 80) + 20
        });
      }
      return points;
    };
    
    // Set initial data
    setChartData(generateData());
    setDataPoints(generateDataPoints());
    
    // Update data periodically to show the "analysis in progress"
    const dataInterval = setInterval(() => {
      setChartData(generateData());
      setDataPoints(prev => prev.map(point => ({
        ...point,
        y: Math.max(20, Math.min(100, point.y + (Math.random() * 10) - 5))
      })));
    }, 3000);
    
    // Simulate development progress (similar to standings page)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80; // Cap at 80% to show it's still in development
        }
        return prev + Math.random() * 4;
      });
    }, 1200);
    
    // Development progress log messages
    const texts = [
      "Initializing data models...",
      "Configuring ranking algorithms...",
      "Setting up performance metrics...",
      "Implementing team comparison logic...",
      "Building data visualizations...",
      "Testing statistical models...",
      "Optimizing calculation speed..."
    ];
    
    let textIndex = 0;
    const textInterval = setInterval(() => {
      if (textIndex < texts.length) {
        setLoadingTexts(prev => [...prev, texts[textIndex]]);
        textIndex++;
      } else {
        clearInterval(textInterval);
      }
    }, 1800);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-decor absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="bg-decor absolute bottom-40 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
        <div className="bg-decor hidden lg:block absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-purple-400/5 blur-2xl"></div>
        
        {/* Animated code brackets floating in background (like standings page) */}
        <div className="absolute top-1/4 left-10 opacity-20 text-5xl animate-float-slow text-blue-400">{`{ }`}</div>
        <div className="absolute top-1/3 right-10 opacity-10 text-4xl animate-float-slow-reverse text-purple-400">{`[ ]`}</div>
        <div className="absolute bottom-1/4 left-1/3 opacity-15 text-6xl animate-float-medium text-blue-400">{`( )`}</div>
        
        {/* Floating analytics symbols */}
        <div className="absolute top-1/4 left-[10%] text-4xl text-blue-500/20 animate-float-slow">📊</div>
        <div className="absolute top-1/3 right-[15%] text-5xl text-purple-500/20 animate-float-medium">📈</div>
        <div className="absolute bottom-1/4 left-[20%] text-4xl text-blue-500/20 animate-float-slow-reverse">📉</div>
      </div>
      
      <div className="container mx-auto px-4 py-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200">
                Power Rankings
              </span>
              <span className="absolute -inset-3 rounded-full bg-blue-500/10 blur-2xl -z-10"></span>
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Our advanced analytics system is currently under development
            </p>
          </div>
          
          {/* Development progress visualization (similar to standings page) */}
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
            
            {/* Terminal style progress log (similar to standings page) */}
            <div className="bg-black/30 rounded-xl border border-white/5 p-4 mb-6 h-40 overflow-y-auto scrollbar-thin font-mono text-sm">
              <p className="text-green-400 mb-2">$ initializing power rankings module...</p>
              {loadingTexts.map((text, index) => (
                <p key={index} className={`${index % 2 === 0 ? 'text-blue-300' : 'text-purple-300'} mb-1`}>
                  $ {text}
                  {index === loadingTexts.length - 1 && (
                    <span className="inline-block animate-pulse">_</span>
                  )}
                </p>
              ))}
            </div>
            
            {/* Estimated release timeline (similar to standings page) */}
            <div className="text-center">
              <p className="text-xl text-blue-100 mb-2">
                Estimated Release: <span className="text-purple-300 font-bold">A couple days</span>
              </p>
              <p className="text-blue-200 max-w-lg mx-auto">
                Our data science team is working hard to bring you comprehensive power rankings with advanced analytics and team comparisons.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left side - animated chart */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-6 relative overflow-hidden">
              <h2 className="text-xl font-bold mb-6 text-blue-300">Analysis in Progress</h2>
              
              {/* Chart content */}
              <div className="h-64 relative">
                {/* Grid lines */}
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="absolute w-full h-px bg-white/10"
                    style={{ top: `${i * 25}%` }}
                  ></div>
                ))}
                
                {/* Animated line chart */}
                <svg className="w-full h-full" viewBox="0 0 550 200" preserveAspectRatio="none">
                  {/* Performance line */}
                  <path
                    d={`M0,${200-dataPoints[0]?.y || 100} ${dataPoints.map((p, i) => `L${p.x},${200-p.y}`).join(' ')}`}
                    fill="none"
                    stroke="url(#blueGradient)"
                    strokeWidth="3"
                    className="animate-dash"
                    strokeDasharray="1000"
                    strokeDashoffset="1000"
                    style={{ animation: 'dash 10s linear forwards' }}
                  />
                  
                  {/* Data points */}
                  {dataPoints.map((point, i) => (
                    <circle 
                      key={i}
                      cx={point.x} 
                      cy={200-point.y} 
                      r="4" 
                      className="fill-blue-400"
                    />
                  ))}
                  
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Animated cursor */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div className="absolute h-full w-px bg-white/30 animate-scan"></div>
                </div>
              </div>
            </div>
            
            {/* Right side - data metrics */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-6 text-blue-300">Team Performance Metrics</h2>
              
              <div className="space-y-5">
                {/* Mock performance bars */}
                {["Offensive Rating", "Defensive Rating", "Shot Accuracy", "Team Chemistry"].map((metric, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-100">{metric}</span>
                      <span className="text-blue-300">{chartData[i] || 50}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${chartData[i] || 50}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 008-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing data...
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features coming soon section */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8 mb-10">
            <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">
              Features Coming Soon
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-blue-900/20 animate-pulse opacity-70">
                  <div className="text-2xl">⏳</div>
                  <div>
                    <h3 className="text-blue-200 font-bold mb-1">Loading Feature {i + 1}...</h3>
                    <p className="text-blue-100/80 text-sm">This feature is under development and will be available soon.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/" 
              className="relative group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full font-medium text-white transition-all transform hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Return to Home
              </span>
              <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 bg-gradient-to-r from-blue-700 to-purple-800 transition-transform duration-300"></span>
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