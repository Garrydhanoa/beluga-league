"use client"

import { useState } from 'react';

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  teamName?: string; // For generating team initials
};

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = "", 
  fallback,
  teamName
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  
  // Function to get team initials
  const getTeamInitials = (name: string) => {
    return name ? name.split(' ').map(word => word[0]).join('') : 'BL';
  };

  // Default fallback content if none provided
  const defaultFallback = teamName ? (
    <div className="rounded-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-blue-900/20 flex items-center justify-center w-full h-full">
      <span className="text-white font-bold text-xl opacity-80">
        {getTeamInitials(teamName)}
      </span>
    </div>
  ) : (
    <div className="bg-blue-900/20 flex items-center justify-center w-full h-full">
      <span className="text-white font-bold text-xl">BL</span>
    </div>
  );

  if (error) {
    return fallback ? <>{fallback}</> : defaultFallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}