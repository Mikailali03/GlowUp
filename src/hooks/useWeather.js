import { useState, useEffect } from 'react';

export const useWeather = () => {
  const [data, setData] = useState({ temp: '--', condition: 'Loading...', spf: '30+' });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      // Using a free weather API (wttr.in) for simplicity, or use OpenWeather
      try {
        const res = await fetch(`https://wttr.in/${latitude},${longitude}?format=j1`);
        const json = await res.json();
        const current = json.current_condition[0];
        const uv = parseInt(current.uvIndex);

        setData({
          temp: `${current.temp_F}°F`,
          condition: current.weatherDesc[0].value,
          spf: uv > 5 ? '50+' : '30+' // Logic for SPF
        });
      } catch (e) {
        setData({ temp: '72°F', condition: 'Clear Sky', spf: '30+' });
      }
    });
  }, []);

  return data;
};