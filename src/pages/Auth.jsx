import React, { useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { GlassCard } from '../components/ui/GlassCard';
import { Sparkles, Mail, Lock, ArrowRight, UserPlus } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (isSignUp) {
      // SIGN UP LOGIC
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ text: 'Account created! Please log in with your credentials.', type: 'success' });
        setIsSignUp(false); // Redirect back to login mode
        setPassword(''); // Clear password for security
      }
    } else {
      // LOGIN LOGIC
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ text: error.message, type: 'error' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-spa-pink relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-spa-blue/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-spa-lavender/40 rounded-full blur-3xl" />

      <div className="mb-10 text-center z-10">
        <div className="bg-white p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-sm border border-spa-pink">
          <Sparkles className="text-spa-gold w-10 h-10" />
        </div>
        <h1 className="text-4xl font-light text-spa-slate tracking-tight">GlowUp</h1>
        <p className="text-spa-slate/50 italic mt-2">
          {isSignUp ? "Begin your radiance journey" : "Welcome back to your sanctuary"}
        </p>
      </div>

      <GlassCard className="w-full max-w-sm p-8 z-10">
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl text-xs text-center ${
            message.type === 'error' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-spa-slate/60 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-spa-slate/30" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 border border-white/60 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-spa-gold/20 transition-all text-spa-slate"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-spa-slate/60 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-spa-slate/30" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 border border-white/60 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-spa-gold/20 transition-all text-spa-slate"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-spa-gold text-white rounded-2xl font-semibold shadow-lg hover:shadow-spa-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Processing..." : (isSignUp ? "Create Account" : "Enter Sanctuary")}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/40 text-center">
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage({ text: '', type: '' });
            }}
            className="text-spa-slate/60 text-sm hover:text-spa-gold transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {isSignUp ? (
              <>Already have an account? <span className="font-semibold text-spa-gold underline underline-offset-4">Login</span></>
            ) : (
              <>New to GlowUp? <span className="font-semibold text-spa-gold underline underline-offset-4">Create Account</span></>
            )}
          </button>
        </div>
      </GlassCard>
      
      <p className="mt-8 text-[10px] text-spa-slate/30 uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} GlowUp Rituals
      </p>
    </div>
  );
};

export default Auth;