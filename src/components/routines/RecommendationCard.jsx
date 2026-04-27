import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Plus, ExternalLink, Info } from 'lucide-react';

export const RecommendationCard = ({ product, onAdd }) => {
  return (
    <GlassCard className="mb-4">
      <div className="p-5 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-spa-gold font-bold">
              {product.time} • {product.category}
            </span>
          </div>
          <h3 className="text-lg font-medium text-spa-slate">{product.name}</h3>
          <p className="text-sm text-spa-slate/60 mb-4">{product.brand}</p>
          
          <div className="flex gap-2">
            <button 
              onClick={() => onAdd(product)}
              className="flex items-center gap-2 bg-white/60 hover:bg-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Add to Routine
            </button>
            <a 
              href={product.link} 
              target="_blank" 
              className="p-2 bg-white/40 rounded-xl text-spa-slate/60 hover:text-spa-gold"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>
        
        {product.actives.length > 0 && (
          <div className="flex flex-col items-end">
             <div className="bg-spa-blue/50 p-2 rounded-lg text-[10px] font-bold text-blue-600">
               ACTIVES: {product.actives.join(', ')}
             </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};