import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export const ConflictModal = ({ conflict, onConfirm, onCancel }) => {
  if (!conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
      <GlassCard className="max-w-sm bg-white/90 border-red-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-spa-slate mb-2">Safety Warning</h3>
          <p className="text-spa-slate/70 mb-6">
            <span className="font-bold text-red-500">{conflict.newActive}</span> in this product shouldn't be used with 
            <span className="font-bold text-red-500"> {conflict.existingActive}</span> (found in your {conflict.existingProductName}). 
            This can cause severe irritation.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className="w-full py-3 bg-red-500 text-white rounded-2xl font-medium shadow-lg"
            >
              Add Anyway (Not Recommended)
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-3 bg-spa-slate/10 text-spa-slate rounded-2xl font-medium"
            >
              Choose different product
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};