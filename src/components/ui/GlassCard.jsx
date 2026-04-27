import React from 'react';
import { twMerge } from 'tailwind-merge';

export const GlassCard = ({ children, className, hover = true }) => {
  return (
    <div className={twMerge(
      // The "Glass" Logic defined here instead of CSS
      "relative overflow-hidden rounded-3xl border border-white/40 bg-white/30 backdrop-blur-md shadow-xl",
      hover && "transition-transform duration-300 hover:scale-[1.01]",
      className
    )}>
      {children}
    </div>
  );
};