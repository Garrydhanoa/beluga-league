"use client"

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  // Team names - updated to include all 16 teams
  const teams = [
    "Immortals",
    "InTraCate",
    "Lotus",
    "Malfeasance",
    "Mambas",
    "MNML",
    "Panthers",
    "Sublunary",
    "The Kingdom",
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
                  e.currentTarget.parentElement.classList.add('bg-blue-900', 'flex', 'items-center', 'justify-center');
                  e.currentTarget.parentElement.innerHTML = '<span class="text-white font-bold text-2xl">BL</span>';
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
                    e.currentTarget.parentElement.classList.add('rounded-full', 'bg-gradient-to-br', 'from-blue-500/30', 'to-purple-600/30', 'border', 'border-white/10');
                    e.currentTarget.parentElement.innerHTML += '<div class="absolute inset-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl animate-pulse-slow"></div><span class="text-9xl font-bold text-white opacity-90">BL</span>';
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
              className="bg-gradient-to-b from-black/40 to-black/70 backdrop-blur-sm p-6 rounded-lg border border-white/10 hover:border-blue-400 transition transform hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] duration-300"
            >
              <div className="aspect-square relative mb-4 flex items-center justify-center overflow-hidden">
                <img 
                  src={`/logos/${team}.png`} 
                  alt={`${team} Logo`} 
                  className="w-4/5 h-4/5 object-contain drop-shadow-lg"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.classList.add('rounded-full', 'bg-gradient-to-br', 'from-blue-600/20', 'via-purple-600/20', 'to-blue-900/20');
                    e.currentTarget.parentElement.innerHTML = `<span class="text-4xl font-bold text-white opacity-80">${team.split(' ').map(word => word[0]).join('')}</span>`;
                  }}
                />
              </div>
              <h3 className="text-center text-white font-bold text-lg relative">
                <span className="relative z-10">{team}</span>
                <span className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </h3>
            </div>
          ))}
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
                    e.currentTarget.parentElement.classList.add('bg-blue-900', 'flex', 'items-center', 'justify-center');
                    e.currentTarget.parentElement.innerHTML = '<span class="font-bold text-xl text-white">BL</span>';
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
            <div className="flex space-x-6">
              <a
                href="/development"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transform hover:scale-110 transition"
              >
                <svg
                  className="w-7 h-7"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="/development"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transform hover:scale-110 transition"
              >
                <svg
                  className="w-7 h-7"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="/development"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transform hover:scale-110 transition"
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
    </div>
  );
}
