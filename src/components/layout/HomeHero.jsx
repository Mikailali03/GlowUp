import React, { useState, useEffect } from 'react';
import { Sun, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

const affirmations = [
  "You are worthy of the time it takes to heal.",
  "Your self-care is a priority, not a luxury.",
  "Radiate confidence from the inside out.",
  "Be gentle with yourself; you are blooming.",
  "Your glow starts from within.",
  "Consistency is your superpower."
];

const HomeHero = () => {
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', spf: '30+', city: 'Sanctuary' });
  const [affirmation] = useState(affirmations[Math.floor(Math.random() * affirmations.length)]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // IP-based location for city name
        const res = await fetch('https://ipapi.co/json/');
        const loc = await res.json();
        
        // Simple weather fetch (wttr.in is great for quick dashboarding)
        const wRes = await fetch(`https://wttr.in/${loc.city}?format=j1`);
        const wJson = await wRes.json();
        
        setWeather({
          temp: `${wJson.current_condition[0].temp_F}°F`,
          condition: wJson.current_condition[0].weatherDesc[0].value,
          city: loc.city || 'Local Area',
          spf: parseInt(wJson.current_condition[0].uvIndex) > 5 ? '50+' : '30+'
        });
      } catch (e) {
        setWeather(prev => ({ ...prev, city: 'Nearby', condition: 'Clear Skies', temp: '72°F' }));
      }
    };
    fetchWeather();
  }, []);

  return (
    <div className="space-y-8 pt-4">
      {/* Intention / Affirmation Section */}
      <div className="text-center py-6 animate-fade-in">
        <div className="flex justify-center mb-3">
          <Sparkles className="text-spa-gold/30" size={20} />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-spa-slate/40 mb-2">Today's Intention</p>
        <h1 className="text-2xl font-light text-spa-slate italic leading-relaxed px-4">
          "{affirmation}"
        </h1>
      </div>

      {/* Weather & SPF Widget */}
      <div className="glass rounded-3xl p-6 flex items-center justify-between shadow-sm border border-white/60">
        <div className="flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-2xl">
            <Sun className="text-orange-400" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] text-spa-slate/40 uppercase tracking-widest mb-1 font-bold">
              <MapPin size={10} className="text-spa-gold/60" /> {weather.city}
            </div>
            <p className="font-medium text-spa-slate text-lg">{weather.temp} • {weather.condition}</p>
          </div>
        </div>
        
        <div className="text-right pl-6 border-l border-white/60">
          <div className="flex items-center gap-1 text-spa-gold font-bold justify-end">
            <ShieldCheck size={18} />
            <span>SPF {weather.spf}</span>
          </div>
          <p className="text-[10px] text-spa-slate/40 uppercase tracking-tighter font-medium">Recommended</p>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;