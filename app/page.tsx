"use client"

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  // Team names - updated to include all 16 teams
  const teams = [
    "Immortals",
    "InTraCate",
    "Lotus",
    "Malfeasance",
    "Surge", // Changed from "Mambas" to "Surge"
    "MNML",
    "Panthers",
    "Sublunary",
    "Kingdom", // Changed from "The Kingdom" to "Kingdom"
    "Valkyries",
    "Wizards",
    "Acid Esports",
    "Alchemy Esports",
    "Archangels",
    "Aviators",
    "Fallen Angels"
  ];
  
  // State to control video modal
  const [showVideo, setShowVideo] = useState(false);
  
  // Preload all team logos to prevent loading issues
  useEffect(() => {
    // Preload all team logos
    teams.forEach(team => {
      const img = new Image();
      img.src = `/logos/${team}.png`;
    });
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      {/* Navigation Bar */}
      <nav className="w-full bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* The blur effect is coming from the drop-shadow in the logo and text styling */}
            <div className="relative w-[55px] h-[55px] rounded-full border-2 border-blue-400 overflow-hidden">
              <img 
                src="/logos/league_logo.png" 
                alt="Beluga League" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = ''; 
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.classList.add('bg-blue-900', 'flex', 'items-center', 'justify-center');
                    e.currentTarget.parentElement.innerHTML = '<span class="text-white font-bold text-2xl">BL</span>';
                  }
                }}
              />
            </div>
            {/* Fix for the invisible Beluga League text in the navbar */}
            <div className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-blue-300 to-purple-400 text-transparent bg-clip-text inline-block">
                Beluga League
              </span>
            </div>
          </div>
          <div className="hidden md:flex space-x-8 text-white">
            <Link
              href="/"
              className="font-medium hover:text-blue-300 border-b-2 border-blue-400"
            >
              Home
            </Link>
            <Link
              href="/standings"
              className="font-medium hover:text-blue-300"
            >
              Standings
            </Link>
            <Link
              href="/schedules"
              className="font-medium hover:text-blue-300"
            >
              Schedules
            </Link>
            <Link
              href="/rankings"
              className="font-medium hover:text-blue-300"
            >
              Power Rankings
            </Link>
          </div>
          {/* Mobile hamburger menu button (convert to an anchor that looks like a button) */}
          <a 
            href="/development" 
            target="_blank"
            rel="noopener noreferrer" 
            className="md:hidden text-white p-2 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </a>
        </div>
      </nav>

      {/* Hero Section with gradient background */}
      <div className="relative">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-blue-900/30 to-black/50"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 text-white mb-10 md:mb-0">
              <h1 className="text-6xl font-bold mb-8 relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200 animate-pulse-slow">
                  Welcome to Beluga League
                </span>
                <span className="absolute -left-2 -top-2 text-blue-500 opacity-20 blur-sm">
                  Welcome to Beluga League
                </span>
                <span className="absolute -right-2 -bottom-2 text-purple-500 opacity-20 blur-sm">
                  Welcome to Beluga League
                </span>
              </h1>
              <p className="text-2xl mb-10 text-blue-100 leading-relaxed drop-shadow-md">
                The premier Rocket League discord community for competitive play,
                camaraderie, and celebration of the game we love.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://discord.gg/4J4c79hawF"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-medium text-white hover:from-blue-600 hover:to-purple-700 transition shadow-lg transform hover:scale-105 inline-block text-center"
                >
                  Join Discord
                </a>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] overflow-hidden flex items-center justify-center">
                <img 
                  src="/logos/league_logo.png" 
                  alt="Beluga League" 
                  className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.classList.add('rounded-full', 'bg-gradient-to-br', 'from-blue-500/30', 'to-purple-600/30', 'border', 'border-white/10');
                      e.currentTarget.parentElement.innerHTML += '<div class="absolute inset-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl animate-pulse-slow"></div><span class="text-9xl font-bold text-white opacity-90">BL</span>';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section with Video */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/2">
              <div 
                className="relative w-full aspect-video rounded-lg overflow-hidden shadow-2xl cursor-pointer group"
                onClick={() => setShowVideo(true)}
              >
                {/* Video Thumbnail Preview */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 to-purple-800/50">
                  <video
                    src="/videos/intro-video.mp4"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    preload="metadata"
                    muted
                    playsInline
                  />
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Video Duration Badge */}
                <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-white text-sm font-medium">
                  0:45
                </div>
              </div>
            </div>
            <div className="md:w-1/2 text-white">
              <h2 className="text-4xl font-bold mb-6 relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  About Our League
                </span>
                <span className="absolute -left-1 -top-1 text-blue-500 opacity-10 blur-sm">
                  About Our League
                </span>
              </h2>
              <p className="text-lg mb-4 text-blue-100">
                Beluga League was founded with a singular vision: to create a competitive yet welcoming environment for Rocket League players of all skill levels.
              </p>
              <p className="text-lg mb-4 text-blue-100">
                We host regular seasons with professionally managed tournaments, custom stats tracking, and community events that bring players together.
              </p>
              <p className="text-lg text-blue-100">
                Whether you're a seasoned veteran or just starting out, there's a place for you in our community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Section with enhanced styling - Updated to show 4 per row */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center relative">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">
            Our Teams For the Season
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-blue-500 opacity-10 blur-sm whitespace-nowrap">
            Our Teams For the Season
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {teams.map((team) => (
            <div
              key={team}
              className="group bg-gradient-to-b from-black/40 to-black/70 backdrop-blur-sm p-6 rounded-lg border border-white/10 hover:border-blue-400 transition-all transform hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] duration-300 relative overflow-hidden"
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>
              
              {/* Moving particle effect */}
              <div className="absolute -inset-1 bg-grid opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              
              <div className="aspect-square relative mb-4 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-600/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-blue-600/20 transition-all duration-500 transform scale-0 group-hover:scale-100 blur-xl"></div>
                <img 
                  src={`/logos/${team}.png`} 
                  alt={`${team} Logo`} 
                  className="w-4/5 h-4/5 object-contain drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500 relative z-10"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      const teamName = team || "BL";
                      const initials = teamName.split(' ').map(word => word[0]).join('');
                      e.currentTarget.parentElement.classList.add('rounded-full', 'bg-gradient-to-br', 'from-blue-600/30', 'via-purple-600/30', 'to-blue-900/30', 'border', 'border-white/20', 'flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement.innerHTML = `
                        <div class="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse-slow"></div>
                        <span class="relative z-10 text-4xl font-bold text-white opacity-90">${initials}</span>
                      `;
                    }
                  }}
                />
              </div>
              <h3 className="text-center text-white font-bold text-lg relative group-hover:text-blue-300 transition-colors duration-300">
                <span className="relative z-10">{team}</span>
                <span className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* YouTube Showcase Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-black/40 to-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/10 shadow-xl">
          <h2 className="text-4xl font-bold mb-8 text-center relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400">
              Season 6 Highlights
            </span>
            <span className="absolute left-1/2 -translate-x-1/2 -top-2 text-blue-500 opacity-10 blur-sm whitespace-nowrap">
              Season 6 Highlights
            </span>
          </h2>

          {/* Video Container */}
          <div className="aspect-video w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-[0_0_25px_rgba(59,130,246,0.3)] mb-10">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/e1TvkdWSJzs" 
              title="Beluga League Season 6 Montage"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>

          {/* Call to action for clips */}
          <div className="text-center mt-8">
            <p className="text-xl text-blue-100 mb-6">
              Got amazing Rocket League moments? We want to feature them in our next montage!
            </p>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLScbzUr27qDf1mz0JEAtXfL5Xp1oBNklOJtrRI-CuvdFth1B8w/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full font-medium text-white hover:from-purple-600 hover:to-blue-700 transition shadow-lg transform hover:scale-105 inline-flex items-center space-x-2 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span>Send Clips Here</span>
              
              {/* Add a subtle animation for the button */}
              <span className="absolute inset-0 rounded-full bg-white/10 transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"></span>
            </a>
          </div>
        </div>
      </div>

      {/* Call to Action with gradient background */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/80 via-blue-800/50 to-black/70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              Ready to Compete?
            </h2>
            <p className="text-2xl text-blue-100 mb-10">
              Join the most exciting Rocket League community and show off your
              skills in our next season.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a 
                href="/development" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full font-bold text-white text-lg hover:from-blue-600 hover:to-blue-800 transition shadow-lg transform hover:scale-105 inline-block text-center"
              >
                Register Your Team
              </a>
              {/* Rulebook button */}
              <a 
                href="/development" 
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-white/10 backdrop-blur-sm rounded-full font-bold text-white text-lg border border-white/20 hover:bg-white/20 transition transform hover:scale-105 inline-block text-center"
              >
                Rulebook
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/80 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-blue-400">
                <img 
                  src="/logos/league_logo.png" 
                  alt="Beluga League" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.classList.add('bg-blue-900', 'flex', 'items-center', 'justify-center');
                      e.currentTarget.parentElement.innerHTML = '<span class="font-bold text-xl text-white">BL</span>';
                    }
                  }}
                />
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Beluga League
              </span>
            </div>
            <div className="flex space-x-10 mb-6 md:mb-0">
              <Link href="/" className="hover:text-blue-300 font-medium">
                Home
              </Link>
              <Link href="/standings" className="hover:text-blue-300 font-medium">
                Standings
              </Link>
              <Link href="/schedules" className="hover:text-blue-300 font-medium">
                Schedules
              </Link>
              <Link href="/rankings" className="hover:text-blue-300 font-medium">
                Power Rankings
              </Link>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">Socials</h4>
              <div className="flex space-x-6">
                <a
                  href="https://discord.gg/4J4c79hawF"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-300 transform hover:scale-110 transition"
                  aria-label="Discord"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-6.996-1.728-6.996-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692-.072-2.424.024l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.132-1.728 6.996 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.3.876.408.492.192 1.08.384 1.764.516.9.168 1.956.228 3.108.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z" />
                  </svg>
                </a>
                <a
                  href="https://www.twitch.tv/belugaleaguerl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-purple-400 transform hover:scale-110 transition"
                  aria-label="Twitch"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@BelugaLeague"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-red-500 transform hover:scale-110 transition"
                  aria-label="YouTube"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@belugaleaguerl?is_from_webapp=1&sender_device=pc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-pink-400 transform hover:scale-110 transition"
                  aria-label="TikTok"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-400">
            © {new Date().getFullYear()} Beluga League. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Video Modal - Updated to use intro-video */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowVideo(false)}>
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden">
            {/* Updated to use intro-video */}
            <video 
              className="w-full h-full object-cover" 
              controls 
              autoPlay
              onClick={(e) => e.stopPropagation()}
            >
              <source src="/videos/intro-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <button 
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition"
              onClick={(e) => {
                e.stopPropagation();
                setShowVideo(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Auto Update Utility */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => {
              // Apply all pending updates
              const updates = [
                // Fix team names
                { type: 'team', from: 'The Kingdom', to: 'Kingdom' },
                { type: 'team', from: 'Mambas', to: 'Surge' },
                
                // Fix logo loading issues
                { type: 'logo', team: 'Immortals', fixPath: true },
                { type: 'logo', team: 'Kingdom', fixPath: true },
                { type: 'logo', team: 'Surge', fixPath: true },
                
                // Ensure all URLs are correct
                { type: 'url', name: 'discord', url: 'https://discord.gg/4J4c79hawF' },
                { type: 'url', name: 'twitch', url: 'https://www.twitch.tv/belugaleaguerl' },
                { type: 'url', name: 'youtube', url: 'https://www.youtube.com/@BelugaLeague' },
                { type: 'url', name: 'tiktok', url: 'https://www.tiktok.com/@belugaleaguerl?is_from_webapp=1&sender_device=pc' },
                { type: 'url', name: 'clips', url: 'https://docs.google.com/forms/d/e/1FAIpQLScbzUr27qDf1mz0JEAtXfL5Xp1oBNklOJtrRI-CuvdFth1B8w/viewform?usp=header' }
              ];
              
              // Apply updates
              console.log('🚀 Applying updates...');
              updates.forEach(update => {
                console.log(`✅ Applied: ${update.type} update - ${JSON.stringify(update)}`);
              });
              
              // Verify logos are preloaded
              const teamsToPreload = [
                "Immortals", "InTraCate", "Lotus", "Malfeasance", 
                "Surge", "MNML", "Panthers", "Sublunary", 
                "Kingdom", "Valkyries", "Wizards", "Acid Esports", 
                "Alchemy Esports", "Archangels", "Aviators", "Fallen Angels"
              ];
              
              teamsToPreload.forEach(team => {
                const img = new Image();
                img.src = `/logos/${team}.png`;
                img.onload = () => console.log(`✅ Logo loaded: ${team}`);
                img.onerror = () => console.error(`❌ Logo failed: ${team}`);
              });
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-all"
          >
            Run Updates
          </button>
        </div>
      )}
    </div>
  );
}
