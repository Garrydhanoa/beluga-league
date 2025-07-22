"use client"

import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function PowerRankingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
      {/* Background decorative elements without the center circle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-decor absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="bg-decor absolute bottom-40 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
        {/* Circle in the middle removed */}
        <div className="bg-decor hidden lg:block absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-purple-400/5 blur-2xl"></div>
      </div>
      
      <Navigation />
      
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="bg-black/40 backdrop-blur-md p-12 rounded-2xl border border-white/10 shadow-xl max-w-2xl w-full text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-200">
            Power Rankings
          </h1>
          
          {/* Rest of your power rankings content */}
          
          <Link
            href="/"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-medium text-white hover:from-blue-600 hover:to-purple-700 transition shadow-lg inline-block mt-8"
          >
            Return to Home
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}