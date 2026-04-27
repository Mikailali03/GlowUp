import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { quizQuestions } from '../lib/quizData';
import { ChevronRight, Check, LogOut, Sparkles } from 'lucide-react';
import { supabase } from '../api/supabaseClient';

const Quiz = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tempSelection, setTempSelection] = useState([]);

  const currentQ = quizQuestions[step];

  const handleNext = () => {
    const finalAnswer = currentQ.type === 'multiple' ? tempSelection : answers[currentQ.id];
    const updatedAnswers = { ...answers, [currentQ.id]: finalAnswer };
    setAnswers(updatedAnswers);
    setTempSelection([]);

    if (step < quizQuestions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(updatedAnswers);
    }
  };

  const toggleMultiSelect = (val) => {
    setTempSelection(prev => 
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="max-w-md mx-auto pt-6 px-6 min-h-screen flex flex-col bg-spa-pink/20">
      {/* Quiz Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="text-spa-gold/60" size={16} />
          <span className="text-[10px] font-bold tracking-[0.3em] text-spa-slate uppercase">Assessment</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-spa-slate/30 hover:text-red-400 transition-colors text-[10px] uppercase tracking-widest font-bold"
        >
          Logout <LogOut size={14} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/40 h-1 rounded-full mb-10 overflow-hidden">
        <div 
          className="bg-spa-gold h-full transition-all duration-700 ease-out" 
          style={{ width: `${((step + 1) / quizQuestions.length) * 100}%` }} 
        />
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-light text-spa-slate italic mb-2">{currentQ.question}</h2>
        <p className="text-[10px] text-spa-slate/40 uppercase tracking-widest mb-8">
          {currentQ.type === 'multiple' ? "Select all that apply" : "Choose one option"}
        </p>

        <div className="space-y-4">
          {currentQ.type === 'number' ? (
            <input 
              type="number" 
              className="w-full bg-white/50 border border-white/60 rounded-2xl p-6 text-xl outline-none focus:ring-2 focus:ring-spa-gold/20"
              onChange={(e) => setAnswers({...answers, [currentQ.id]: e.target.value})}
              placeholder="Your age..."
            />
          ) : (
            currentQ.options.map((opt) => {
              const isSelected = currentQ.type === 'multiple' 
                ? tempSelection.includes(opt.value)
                : answers[currentQ.id] === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => currentQ.type === 'multiple' ? toggleMultiSelect(opt.value) : setAnswers({...answers, [currentQ.id]: opt.value})}
                  className="w-full text-left"
                >
                  <GlassCard className={`py-5 px-6 flex justify-between items-center transition-all duration-300 ${isSelected ? 'border-spa-gold bg-white/80 shadow-md translate-x-1' : 'border-white/40'}`}>
                    <span className={`text-lg font-light transition-colors ${isSelected ? 'text-spa-gold' : 'text-spa-slate'}`}>{opt.label}</span>
                    {isSelected ? <Check className="text-spa-gold" size={20} /> : <ChevronRight className="text-spa-slate/20" size={18} />}
                  </GlassCard>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="py-10">
        <button 
          onClick={handleNext}
          className="w-full py-5 bg-spa-gold text-white rounded-3xl font-bold shadow-lg shadow-spa-gold/20 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
          disabled={currentQ.type === 'multiple' ? tempSelection.length === 0 : !answers[currentQ.id]}
        >
          {step === quizQuestions.length - 1 ? "Reveal My Ritual" : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default Quiz;