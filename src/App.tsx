/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, Settings, Play, Pause, RotateCcw, Trophy, Eye, EyeOff } from 'lucide-react';

type BugType = 'cricket' | 'beetle' | 'fly';

interface BugInstance {
  id: number;
  type: BugType;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
}

interface Splat {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export default function App() {
  const [bugs, setBugs] = useState<BugInstance[]>([]);
  const [splats, setSplats] = useState<Splat[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLizardMode, setIsLizardMode] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  
  const nextBugId = useRef(0);
  const nextSplatId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnBug = useCallback(() => {
    if (!isPlaying) return;
    if (bugs.length > 10 + difficulty * 2) return;

    const types: BugType[] = ['cricket', 'beetle', 'fly'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let speed = 2 + Math.random() * 3 + difficulty;
    let size = 30 + Math.random() * 20;
    let color = '#000000';

    if (type === 'cricket') {
      speed *= 1.5;
      size *= 0.8;
      color = '#8B4513'; // Brown
    } else if (type === 'beetle') {
      speed *= 0.6;
      size *= 1.4;
      color = '#1a1a1a'; // Dark grey/black
    } else if (type === 'fly') {
      speed *= 1.2;
      size *= 0.9;
      color = '#4a4a4a';
    }

    // Spawn from edges
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    const padding = 50;
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (side === 0) { // Top
      x = Math.random() * width;
      y = -padding;
    } else if (side === 1) { // Right
      x = width + padding;
      y = Math.random() * height;
    } else if (side === 2) { // Bottom
      x = Math.random() * width;
      y = height + padding;
    } else { // Left
      x = -padding;
      y = Math.random() * height;
    }

    // Target a random point on screen to calculate initial angle
    const targetX = Math.random() * width;
    const targetY = Math.random() * height;
    const angle = Math.atan2(targetY - y, targetX - x) * (180 / Math.PI);

    const newBug: BugInstance = {
      id: nextBugId.current++,
      type,
      x,
      y,
      angle,
      speed,
      size,
      color
    };

    setBugs(prev => [...prev, newBug]);
  }, [isPlaying, bugs.length, difficulty]);

  // Spawning interval
  useEffect(() => {
    const interval = setInterval(spawnBug, 1500 / difficulty);
    return () => clearInterval(interval);
  }, [spawnBug, difficulty]);

  // Movement and cleanup
  useEffect(() => {
    if (!isPlaying) return;

    const moveInterval = setInterval(() => {
      setBugs(prevBugs => {
        return prevBugs
          .map(bug => {
            // Add some randomness to movement (erratic for flies)
            let angleChange = (Math.random() - 0.5) * 5;
            if (bug.type === 'fly') angleChange = (Math.random() - 0.5) * 20;
            
            const newAngle = bug.angle + angleChange;
            const rad = newAngle * (Math.PI / 180);
            return {
              ...bug,
              x: bug.x + Math.cos(rad) * bug.speed,
              y: bug.y + Math.sin(rad) * bug.speed,
              angle: newAngle
            };
          })
          .filter(bug => {
            // Remove if far off screen
            const padding = 200;
            return (
              bug.x > -padding &&
              bug.x < window.innerWidth + padding &&
              bug.y > -padding &&
              bug.y < window.innerHeight + padding
            );
          });
      });
    }, 16);

    return () => clearInterval(moveInterval);
  }, [isPlaying]);

  const handleCatch = (id: number, x: number, y: number, color: string, size: number) => {
    setBugs(prev => prev.filter(b => b.id !== id));
    setScore(prev => prev + 1);
    
    const newSplat: Splat = {
      id: nextSplatId.current++,
      x,
      y,
      color,
      size: size * 1.2
    };
    
    setSplats(prev => [...prev, newSplat]);
    
    // Remove splat after some time
    setTimeout(() => {
      setSplats(prev => prev.filter(s => s.id !== newSplat.id));
    }, 2000);
  };

  const resetGame = () => {
    setBugs([]);
    setSplats([]);
    setScore(0);
    setIsPlaying(true);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden select-none touch-none ${isLizardMode ? 'cursor-none' : ''}`}
      style={{
        background: 'radial-gradient(circle at center, var(--color-vibrant-bg-start) 0%, var(--color-vibrant-bg-end) 100%)'
      }}
    >
      {/* Background Splats */}
      <AnimatePresence>
        {splats.map(splat => (
          <motion.div
            key={splat.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none rounded-full blur-sm"
            style={{
              left: splat.x,
              top: splat.y,
              width: splat.size,
              height: splat.size,
              backgroundColor: splat.color,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </AnimatePresence>

      {/* The Bugs */}
      {bugs.map(bug => (
        <BugComponent 
          key={bug.id} 
          bug={bug} 
          onCatch={handleCatch} 
        />
      ))}

      {/* UI Overlay */}
      {!isLizardMode && (
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="bg-vibrant-score-bg px-8 py-4 rounded-[100px] shadow-[0_8px_0_rgba(0,0,0,0.1)] flex flex-col items-center">
              <span className="text-[14px] text-vibrant-score-label uppercase tracking-[1px] font-bold mb-1">Bugs Caught</span>
              <span className="text-[48px] text-vibrant-score-value font-black leading-none">{score.toString().padStart(3, '0')}</span>
            </div>
          </div>

          <div className="flex gap-3 pointer-events-auto items-start">
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-vibrant-pill-bg px-6 py-3 rounded-[100px] shadow-[0_6px_0_var(--color-vibrant-pill-shadow)] text-vibrant-pill-text font-bold text-[18px] hover:translate-y-[2px] hover:shadow-[0_4px_0_var(--color-vibrant-pill-shadow)] active:translate-y-[6px] active:shadow-none transition-all"
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button 
                onClick={resetGame}
                className="bg-vibrant-pill-bg px-6 py-3 rounded-[100px] shadow-[0_6px_0_var(--color-vibrant-pill-shadow)] text-vibrant-pill-text font-bold text-[18px] hover:translate-y-[2px] hover:shadow-[0_4px_0_var(--color-vibrant-pill-shadow)] active:translate-y-[6px] active:shadow-none transition-all"
              >
                RESET
              </button>
            </div>
            <button 
              onClick={() => setIsLizardMode(true)}
              className="bg-vibrant-dark px-6 py-3 rounded-[100px] text-white font-bold text-[16px] uppercase tracking-[1px] hover:bg-black transition-colors"
            >
              Lizard Mode
            </button>
          </div>
        </div>
      )}

      {/* Lizard Mode Hint (Briefly shown or hidden) */}
      {isLizardMode && (
        <button 
          onClick={() => setIsLizardMode(false)}
          className="absolute bottom-6 right-6 p-4 bg-black/20 backdrop-blur-sm rounded-full opacity-20 hover:opacity-100 transition-opacity"
        >
          <Eye className="w-6 h-6" />
        </button>
      )}

      {/* Start/Pause Overlay */}
      {!isPlaying && !isLizardMode && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-vibrant-score-bg p-12 rounded-[60px] shadow-[0_12px_0_rgba(0,0,0,0.2)] text-center max-w-md mx-4">
            <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase text-vibrant-score-value">PAUSED</h1>
            <p className="text-vibrant-score-label mb-8 font-bold">Lizards need breaks too. Tap play to continue hunting!</p>
            <button 
              onClick={() => setIsPlaying(true)}
              className="w-full py-6 bg-vibrant-pill-bg shadow-[0_8px_0_var(--color-vibrant-pill-shadow)] text-vibrant-pill-text font-black text-2xl rounded-[100px] transition-all transform hover:translate-y-[2px] hover:shadow-[0_6px_0_var(--color-vibrant-pill-shadow)] active:translate-y-[8px] active:shadow-none flex items-center justify-center gap-3"
            >
              RESUME
            </button>
            
            <div className="mt-8 flex flex-col gap-4">
              <label className="text-xs font-bold uppercase tracking-widest text-vibrant-score-label opacity-60">Difficulty</label>
              <div className="flex gap-2">
                {[1, 2, 3].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-3 rounded-[100px] font-bold transition-all ${
                      difficulty === d 
                        ? 'bg-vibrant-dark text-white' 
                        : 'bg-vibrant-pill-bg/20 text-vibrant-pill-text hover:bg-vibrant-pill-bg/40'
                    }`}
                  >
                    {d === 1 ? 'Easy' : d === 2 ? 'Med' : 'Hard'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BugProps {
  key?: React.Key;
  bug: BugInstance;
  onCatch: (id: number, x: number, y: number, color: string, size: number) => void;
}

function BugComponent({ bug, onCatch }: BugProps) {
  const isGold = bug.type === 'beetle'; // Let's make beetles gold for this theme
  const bugColor = isGold ? 'var(--color-vibrant-bug-gold)' : 'var(--color-vibrant-bug-red)';

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: bug.x,
        top: bug.y,
        width: bug.size * 1.5,
        height: bug.size * 1.8,
        transform: `translate(-50%, -50%) rotate(${bug.angle + 90}deg)`,
      }}
      onPointerDown={() => onCatch(bug.id, bug.x, bug.y, bugColor, bug.size)}
    >
      <div className="relative w-full h-full flex justify-center items-center">
        {/* Legs (Simplified for theme) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="w-[110%] h-[10%] bg-vibrant-dark rounded-full rotate-15" />
          <div className="w-[110%] h-[10%] bg-vibrant-dark rounded-full -rotate-15" />
          <div className="w-[110%] h-[10%] bg-vibrant-dark rounded-full rotate-45" />
          <div className="w-[110%] h-[10%] bg-vibrant-dark rounded-full -rotate-45" />
        </div>

        {/* Bug Body */}
        <div 
          className="relative w-[60%] h-[80%] rounded-full border-[4px] border-vibrant-dark shadow-[inset_-10px_-10px_0_rgba(0,0,0,0.15)] overflow-hidden"
          style={{ backgroundColor: bugColor }}
        >
          {/* Center Line */}
          <div className="absolute top-0 left-1/2 w-[4px] h-full bg-vibrant-dark -translate-x-1/2" />
          
          {/* Spots */}
          {!isGold && (
            <>
              <div className="absolute top-[15%] left-[15%] w-[20%] h-[15%] bg-vibrant-dark rounded-full" />
              <div className="absolute top-[45%] left-[20%] w-[20%] h-[15%] bg-vibrant-dark rounded-full" />
              <div className="absolute top-[15%] right-[15%] w-[20%] h-[15%] bg-vibrant-dark rounded-full" />
              <div className="absolute top-[45%] right-[20%] w-[20%] h-[15%] bg-vibrant-dark rounded-full" />
            </>
          )}

          {/* Gold Shine */}
          {isGold && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[40%] h-[40%] bg-white rounded-full opacity-60 blur-[2px]" />
            </div>
          )}
        </div>

        {/* Bug Head */}
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[40%] h-[30%] bg-vibrant-dark rounded-t-[40%]" />
        
        {/* Antennae */}
        <div className="absolute top-[-5%] left-[35%] w-[15%] h-[15%] border-t-2 border-r-2 border-vibrant-dark rounded-tr-full -rotate-45" />
        <div className="absolute top-[-5%] right-[35%] w-[15%] h-[15%] border-t-2 border-l-2 border-vibrant-dark rounded-tl-full rotate-45" />
      </div>
    </motion.div>
  );
}
