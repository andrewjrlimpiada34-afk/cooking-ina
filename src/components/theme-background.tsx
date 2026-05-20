'use client';

import React, { useState, useEffect } from 'react';
import { Fish } from 'lucide-react';

export function ThemeBackground() {
  const [smokeParticles, setSmokeParticles] = useState<any[]>([]);

  useEffect(() => {
    // Generate random particle styles only after the component mounts on the client
    // to avoid hydration mismatches between server and client.
    const particles = [...Array(15)].map(() => ({
      left: `${Math.random() * 100}%`,
      width: `${100 + Math.random() * 200}px`,
      height: `${100 + Math.random() * 200}px`,
      animationDuration: `${10 + Math.random() * 15}s`,
      animationDelay: `${-Math.random() * 20}s`,
    }));
    setSmokeParticles(particles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Seafood Theme Elements */}
      <div className="seafood-element absolute inset-0">
        {/* Animated Waves */}
        <div className="absolute bottom-0 w-[200%] h-48 opacity-20 wave-layer">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-primary">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113,-1.11,1200,0V120H0Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 w-[200%] h-64 opacity-10 wave-layer" style={{ animationDelay: '-5s', animationDuration: '15s' }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-accent">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113,-1.11,1200,0V120H0Z"></path>
          </svg>
        </div>

        {/* Swimming Fish */}
        <div className="absolute top-[20%] left-0 w-full">
          <Fish className="w-8 h-8 text-primary/10" style={{ animation: 'fish-swim 20s linear infinite' }} />
        </div>
        <div className="absolute top-[40%] left-0 w-full">
          <Fish className="w-6 h-6 text-accent/10" style={{ animation: 'fish-swim 25s linear infinite', animationDelay: '-10s' }} />
        </div>
        <div className="absolute top-[70%] left-0 w-full">
          <Fish className="w-10 h-10 text-primary/5" style={{ animation: 'fish-swim 30s linear infinite', animationDelay: '-5s' }} />
        </div>

        {/* Scuttling Crabs at the bottom */}
        <div className="absolute bottom-4 left-10 opacity-20" style={{ animation: 'crab-scuttle 4s ease-in-out infinite' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
            <path d="M12 2C8.13 2 5 5.13 5 9v3h14V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v1H7V9c0-2.76 2.24-5 5-5zM4 14v2h2v-2H4zm14 0v2h2v-2h-2zM2 17v2h2v-2H2zm18 0v2h2v-2h-2zM4 20v2h2v-2H4zm14 0v2h2v-2h-2z" />
          </svg>
        </div>
        <div className="absolute bottom-6 right-20 opacity-20" style={{ animation: 'crab-scuttle 3.5s ease-in-out infinite', animationDelay: '-1s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
            <path d="M12 2C8.13 2 5 5.13 5 9v3h14V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v1H7V9c0-2.76 2.24-5 5-5zM4 14v2h2v-2H4zm14 0v2h2v-2h-2zM2 17v2h2v-2H2zm18 0v2h2v-2h-2zM4 20v2h2v-2H4zm14 0v2h2v-2h-2z" />
          </svg>
        </div>
      </div>

      {/* Grilled Theme Elements */}
      <div className="grilled-element absolute inset-0">
        {smokeParticles.map((style, i) => (
          <div 
            key={i}
            className="smoke-particle absolute bottom-0 bg-white/5 blur-3xl rounded-full"
            style={style}
          />
        ))}
      </div>
    </div>
  );
}
