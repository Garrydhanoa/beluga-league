"use client";

import React, { useState, useEffect } from 'react';

export default function FloatingParticles() {
  const [particles, setParticles] = useState([]);
  
  // Only generate particles after component is mounted on the client
  useEffect(() => {
    const newParticles = Array(20).fill(0).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${Math.random() * 10 + 10}s`,
      delay: `${Math.random() * 5}s`
    }));
    
    setParticles(newParticles);
  }, []);
  
  return (
    <div className="absolute inset-0">
      {particles.map((particle) => (
        <div 
          key={particle.id}
          className="absolute w-1 h-1 rounded-full bg-blue-400/30 animate-float"
          style={{
            top: particle.top,
            left: particle.left,
            animationDuration: particle.duration,
            animationDelay: particle.delay
          }}
        ></div>
      ))}
    </div>
  );
}
