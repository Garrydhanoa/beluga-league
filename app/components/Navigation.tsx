"use client"

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Check if the current path matches the link
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="w-full bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <div className="relative w-[45px] h-[45px] md:w-[55px] md:h-[55px] rounded-full border-2 border-blue-400 overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/40 transition-all duration-300"></div>
              <img 
                src="/logos/league_logo.png" 
                alt="Beluga League" 
                className="w-full h-full object-cover relative z-10 transition-transform duration-300 group-hover:scale-110"
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
          </Link>
          <Link href="/">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-blue-300 to-purple-400 text-transparent bg-clip-text inline-block">
                Beluga League
              </span>
            </div>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 rounded-lg bg-black/20 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex space-x-8 text-white">
          <Link
            href="/"
            className={`font-medium ${isActive('/') ? 'text-blue-300 border-b-2 border-blue-400' : 'hover:text-blue-300 transition-colors duration-300 relative group'}`}
          >
            Home
            {!isActive('/') && <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>}
            {isActive('/') && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"></span>}
          </Link>
          <Link
            href="/schedules"
            className={`font-medium ${isActive('/schedules') ? 'text-blue-300 border-b-2 border-blue-400' : 'hover:text-blue-300 transition-colors duration-300 relative group'}`}
          >
            Schedules
            {!isActive('/schedules') && <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>}
            {isActive('/schedules') && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"></span>}
          </Link>
          <Link
            href="/standings"
            className={`font-medium ${isActive('/standings') ? 'text-blue-300 border-b-2 border-blue-400' : 'hover:text-blue-300 transition-colors duration-300 relative group'}`}
          >
            Standings
            {!isActive('/standings') && <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>}
            {isActive('/standings') && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"></span>}
          </Link>
          <Link
            href="/rankings"
            className={`font-medium ${isActive('/rankings') ? 'text-blue-300 border-b-2 border-blue-400' : 'hover:text-blue-300 transition-colors duration-300 relative group'}`}
          >
            Power Rankings
            {!isActive('/rankings') && <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>}
            {isActive('/rankings') && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400"></span>}
          </Link>
        </div>
      </div>
      
      {/* Mobile Navigation Menu - Slide down animation */}
      <div 
        className={`md:hidden bg-black/80 backdrop-blur-md border-b border-white/10 absolute w-full z-50 transform transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col space-y-3 pb-3">
            <Link
              href="/"
              className={`font-medium py-2 ${isActive('/') ? 'text-blue-300 border-l-2 pl-2 border-blue-400' : 'hover:text-blue-300'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/schedules"
              className={`font-medium py-2 ${isActive('/schedules') ? 'text-blue-300 border-l-2 pl-2 border-blue-400' : 'hover:text-blue-300'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Schedules
            </Link>
            <Link
              href="/standings"
              className={`font-medium py-2 ${isActive('/standings') ? 'text-blue-300 border-l-2 pl-2 border-blue-400' : 'hover:text-blue-300'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Standings
            </Link>
            <Link
              href="/rankings"
              className={`font-medium py-2 ${isActive('/rankings') ? 'text-blue-300 border-l-2 pl-2 border-blue-400' : 'hover:text-blue-300'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Power Rankings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}