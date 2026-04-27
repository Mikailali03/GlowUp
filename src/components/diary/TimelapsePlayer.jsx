import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, FastForward } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const TimelapsePlayer = ({ photos, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(300); // ms per frame
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= photos.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, photos.length, speed]);

  const restart = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-spa-slate/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-10 right-6 text-white/40 hover:text-white">
        <X size={32} />
      </button>

      <div className="w-full max-w-sm mb-8">
        <p className="text-white/60 text-[10px] uppercase tracking-[0.4em] text-center mb-4">
          Your Evolution
        </p>
        
        <GlassCard className="p-0 overflow-hidden border-white/20 aspect-[3/4] relative">
          <img 
            src={photos[currentIndex].url} 
            alt="Evolution frame" 
            className="w-full h-full object-cover"
          />
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
            <div 
              className="h-full bg-spa-gold transition-all duration-100" 
              style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }}
            />
          </div>
        </GlassCard>
        
        <div className="mt-6 text-center">
          <p className="text-white text-sm font-light italic">
            {new Date(photos[currentIndex].created_at).toLocaleDateString(undefined, { 
              month: 'long', day: 'numeric' 
            })}
          </p>
          <p className="text-spa-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
            Day {currentIndex + 1} of {photos.length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 bg-white/10 p-6 rounded-full border border-white/10">
        <button onClick={restart} className="text-white/60 hover:text-white">
          <RotateCcw size={20} />
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-spa-slate shadow-xl active:scale-90 transition-transform"
        >
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
        </button>

        <button 
          onClick={() => setSpeed(prev => prev === 300 ? 150 : 300)} 
          className={`transition-colors ${speed === 150 ? 'text-spa-gold' : 'text-white/60'}`}
        >
          <FastForward size={20} />
        </button>
      </div>

      <p className="mt-8 text-white/30 text-[10px] uppercase tracking-widest">
        {speed === 150 ? '2x Speed' : '1x Speed'}
      </p>
    </div>
  );
};