import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, ArrowRight, Quote } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const SwipeableStep = ({ item, onComplete, onSkip }) => {
  const x = useMotionValue(0);
  
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(243, 244, 246, 0.8)", "rgba(255, 255, 255, 0.3)", "rgba(209, 250, 229, 0.8)"]
  );
  
  const opacityLeft = useTransform(x, [50, 100], [0, 1]);
  const opacityRight = useTransform(x, [-100, -50], [1, 0]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) onComplete(item.id);
    else if (info.offset.x < -100) onSkip(item.id);
  };

  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-8 rounded-3xl">
        <motion.div style={{ opacity: opacityLeft }} className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
          <Check size={20} /> Complete
        </motion.div>
        <motion.div style={{ opacity: opacityRight }} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
          Skip <ArrowRight size={20} />
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, background }}
        className="relative z-10 cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <GlassCard className="p-5 border-white/60 bg-transparent">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-spa-gold font-bold">{item.step_name}</span>
            <h3 className="text-md font-medium text-spa-slate mt-1">{item.product_name}</h3>
            
            {/* The Why Logic Display */}
            {item.why_logic && (
              <div className="mt-2 flex gap-2">
                <Quote size={12} className="text-spa-gold/30 shrink-0 mt-1 rotate-180" />
                <p className="text-[11px] text-spa-slate/50 italic leading-snug">
                  {item.why_logic}
                </p>
              </div>
            )}

            {item.warning_note && (
               <p className="text-[10px] text-amber-600 mt-3 font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                 ⓘ {item.warning_note}
               </p>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};