import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../api/supabaseClient';
import { GlassCard } from '../components/ui/GlassCard';
import { 
  Calendar, Image as ImageIcon, ChevronLeft, 
  Loader2, Clock, Play, Pause, RotateCcw, 
  FastForward, X, Sparkles 
} from 'lucide-react';
import { format } from 'date-fns';

// --- SUB-COMPONENT: TIMELAPSE PLAYER ---
const TimelapsePlayer = ({ photos, onClose }) => {
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
    <div className="fixed inset-0 z-[100] bg-spa-slate/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
      <button onClick={onClose} className="absolute top-10 right-6 text-white/40 hover:text-white transition-colors">
        <X size={32} />
      </button>

      <div className="w-full max-w-sm mb-8">
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.5em] text-center mb-6">
          Your Evolution
        </p>
        
        <GlassCard className="p-0 overflow-hidden border-white/20 aspect-[3/4] relative shadow-2xl">
          <img 
            src={photos[currentIndex].url} 
            alt="Evolution frame" 
            className="w-full h-full object-cover transition-opacity duration-200"
          />
          
          {/* Progress Bar Overlay */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
            <div 
              className="h-full bg-spa-gold transition-all duration-150" 
              style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }}
            />
          </div>
        </GlassCard>
        
        <div className="mt-8 text-center">
          <p className="text-white text-lg font-light italic">
            {format(new Date(photos[currentIndex].created_at), 'MMMM do')}
          </p>
          <p className="text-spa-gold text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">
            Day {currentIndex + 1} of {photos.length}
          </p>
        </div>
      </div>

      {/* Control Dock */}
      <div className="flex items-center gap-8 bg-white/5 p-6 rounded-full border border-white/10 backdrop-blur-md">
        <button onClick={restart} className="text-white/40 hover:text-white transition-colors">
          <RotateCcw size={20} />
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-spa-slate shadow-2xl active:scale-90 transition-transform"
        >
          {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
        </button>

        <button 
          onClick={() => setSpeed(prev => prev === 300 ? 150 : 300)} 
          className={`transition-colors ${speed === 150 ? 'text-spa-gold' : 'text-white/40'}`}
        >
          <FastForward size={20} />
        </button>
      </div>

      <p className="mt-8 text-white/20 text-[9px] uppercase tracking-[0.3em] font-bold">
        {speed === 150 ? '2.0x Fast' : '1.0x Normal'}
      </p>
    </div>
  );
};


// --- MAIN PAGE: PROGRESS GALLERY ---
const Progress = ({ onBack }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showTimelapse, setShowTimelapse] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase
        .from('skin_diary')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert image paths to signed/public URLs from Storage
      const photosWithUrls = data.map(photo => {
        const { data: urlData } = supabase.storage
          .from('diary-photos')
          .getPublicUrl(photo.image_path);
        
        return { ...photo, url: urlData.publicUrl };
      });

      setPhotos(photosWithUrls);
    } catch (err) {
      console.error("Gallery Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-spa-pink">
      <Loader2 className="animate-spin text-spa-gold mb-4" size={32} />
      <p className="text-[10px] uppercase tracking-widest text-spa-slate/40">Opening Journal...</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen pb-28 px-6 bg-spa-pink/10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-8 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/60 rounded-full text-spa-slate/40 hover:text-spa-gold transition-colors shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-light text-spa-slate italic leading-none">Journal</h1>
            <p className="text-[9px] uppercase tracking-widest text-spa-slate/40 mt-1">{photos.length} Total Entries</p>
          </div>
        </div>

        {/* TIMELAPSE TRIGGER */}
        {photos.length >= 2 && (
          <button 
            onClick={() => setShowTimelapse(true)}
            className="flex items-center gap-2 bg-spa-gold text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-spa-gold/20 active:scale-95 transition-transform"
          >
            <Sparkles size={14} /> Evolution
          </button>
        )}
      </div>

      {/* Grid View */}
      {photos.length === 0 ? (
        <div className="mt-32 text-center px-10">
          <div className="bg-white/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
            <ImageIcon className="text-spa-gold/40" />
          </div>
          <h3 className="text-lg font-medium text-spa-slate italic">Start your journey</h3>
          <p className="text-xs text-spa-slate/40 mt-2 leading-relaxed">
            Your daily rituals will appear here. Log your first photo to begin your evolution.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <button 
              key={photo.id} 
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square relative overflow-hidden rounded-2xl border border-white/60 group active:scale-95 transition-transform shadow-sm"
            >
              <img 
                src={photo.url} 
                alt="Entry" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-spa-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-1.5 right-1.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg text-[7px] font-black text-spa-gold uppercase border border-spa-gold/10">
                {photo.entry_type}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* LIGHTBOX DETAIL VIEW */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[110] bg-spa-slate/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 animate-fade-in">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-10 right-6 text-white/40 hover:text-white"
          >
            <X size={32} />
          </button>
          
          <GlassCard className="w-full max-w-sm p-0 overflow-hidden bg-white/10 border-white/20 shadow-2xl">
            <img src={selectedPhoto.url} className="w-full aspect-[3/4] object-cover" />
            <div className="p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-spa-gold" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase">
                  {format(new Date(selectedPhoto.created_at), 'MMMM do, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-spa-gold" />
                <span className="text-sm font-light italic text-white/70">
                  Captured during {selectedPhoto.entry_type} ritual
                </span>
              </div>
            </div>
          </GlassCard>
          
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="mt-12 py-4 px-12 bg-white text-spa-slate rounded-full font-bold text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          >
            Close Entry
          </button>
        </div>
      )}

      {/* TIMELAPSE PLAYER OVERLAY */}
      {showTimelapse && (
        <TimelapsePlayer 
          // Reverse so it plays oldest to newest for evolution
          photos={[...photos].reverse()} 
          onClose={() => setShowTimelapse(false)} 
        />
      )}
    </div>
  );
};

export default Progress;