"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Add this import
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

export default function Home() {
  // Your existing state and variables
  const teams = [
    "Acid Esports",
    "Alchemy Esports",
    "Archangels",
    // ...rest of your teams
  ];

  const [showVideo, setShowVideo] = useState(false);
  const [animateItems, setAnimateItems] = useState(false);

  // Keep your existing useEffects

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="bg-decor absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"
          data-speed="0.03"
        ></div>
        <div
          className="bg-decor absolute bottom-40 right-10 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"
          data-speed="0.05"
        ></div>
        {/* Removed the problematic element that was creating the tiny circle */}
        <div
          className="bg-decor hidden lg:block absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-purple-400/5 blur-2xl"
          data-speed="0.04"
        ></div>
        <svg
          className="bg-decor absolute -top-10 -left-10 text-blue-500/10 w-40 h-40 hidden sm:block"
          viewBox="0 0 200 200"
          data-speed="0.01"
        >
          <path
            fill="currentColor"
            d="M44.3,-76.2C58.4,-69.1,71.9,-59.3,79.4,-45.8C86.9,-32.2,88.2,-16.1,85.6,-1.5C83,13.2,76.5,26.3,68.3,38.2C60,50.1,50,60.8,37.7,70.2C25.5,79.7,12.8,87.9,-0.7,89C-14.1,90.1,-28.2,84.1,-40.6,75.4C-53,66.8,-63.6,55.5,-71.7,42.2C-79.7,28.9,-85.2,14.5,-85.9,-0.4C-86.6,-15.3,-82.4,-30.5,-73.8,-42.7C-65.1,-55,-51.8,-64.2,-37.8,-71.2C-23.8,-78.2,-11.9,-82.9,1.6,-85.8C15.1,-88.7,30.1,-89.8,44.3,-76.2Z"
            transform="translate(100 100)"
          />
        </svg>
        <svg
          className="bg-decor absolute -bottom-20 -right-20 text-purple-500/10 w-72 h-72 hidden sm:block"
          viewBox="0 0 200 200"
          data-speed="0.03"
        >
          <path
            fill="currentColor"
            d="M42.7,-73.4C54.9,-67.3,64.2,-54.9,71.5,-41.3C78.7,-27.7,83.8,-13.9,83.1,-0.4C82.5,13,76,26,68.6,38.5C61.2,51,52.8,63,41.2,70.7C29.5,78.4,14.7,81.7,0.2,81.4C-14.4,81.1,-28.7,77.2,-41.8,70.2C-54.8,63.3,-66.5,53.2,-73.6,40.4C-80.7,27.5,-83.2,13.8,-83.3,-0.1C-83.4,-13.9,-81.1,-27.8,-74.1,-39.7C-67.1,-51.5,-55.4,-61.4,-42.2,-67C-28.9,-72.6,-14.5,-74,0.3,-74.5C15.1,-75,30.2,-74.6,42.7,-68.4Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      {/* Replace your custom navigation with the shared component */}
      <Navigation />

      {/* The rest of your homepage content remains the same */}
      {/* Hero section */}
      <div className="relative">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-blue-900/30 to-black/50"></div>
        {/* Hero content */}
      </div>

      {/* Teams section */}

      {/* Features section */}

      {/* Footer - you might want to use your shared Footer component here too */}
      <Footer />
    </div>
  );
}

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
</a>;