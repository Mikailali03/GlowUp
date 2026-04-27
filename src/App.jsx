import React, { useState, useEffect } from 'react';
import { supabase } from './api/supabaseClient';
import { Sun, Moon, Calendar, AlertCircle, Loader2, LogOut, Camera, Plus, X, Image as ImageIcon } from 'lucide-react';

// Components
import Auth from './pages/Auth';
import Quiz from './pages/Quiz';
import Progress from './pages/Progress';
import HomeHero from './components/layout/HomeHero';
import { GlassCard } from './components/ui/GlassCard';
import { CameraModal } from './components/diary/CameraModal';
import { SwipeableStep } from './components/routines/SwipeableStep';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('loading'); 
  const [routine, setRoutine] = useState({ am_routine: [], pm_routine: [], weekly_treatments: [] });
  
  // UI States
  const [showCamera, setShowCamera] = useState(false);
  const [activeLogType, setActiveLogType] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStep, setNewStep] = useState({ step: '', product: '', type: 'AM' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setView('auth'); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('has_completed_quiz').eq('id', userId).single();
      if (profile?.has_completed_quiz) {
        const { data: steps } = await supabase.from('user_routines').select('*').order('created_at', { ascending: true });
        setRoutine({
          am_routine: steps.filter(s => s.time_of_day === 'AM'),
          pm_routine: steps.filter(s => s.time_of_day === 'PM'),
          weekly_treatments: steps.filter(s => s.time_of_day === 'Weekly')
        });
        setView('dashboard');
      } else setView('quiz');
    } catch (e) { setView('quiz'); }
    setLoading(false);
  };

  const handleQuizComplete = async (results) => {
    setView('loading');
    try {
      const { data: aiData, error } = await supabase.functions.invoke('generate-routine', { body: { quizResults: results } });
      if (error) throw error;

      // Map AI to DB rows
      const allSteps = [
        ...aiData.am_routine.map(s => ({ user_id: session.user.id, step_name: s.step, product_name: s.product, why_logic: s.why, warning_note: s.warning, time_of_day: 'AM' })),
        ...aiData.pm_routine.map(s => ({ user_id: session.user.id, step_name: s.step, product_name: s.product, why_logic: s.why, warning_note: s.warning, time_of_day: 'PM' })),
        ...aiData.weekly_treatments.map(s => ({ user_id: session.user.id, step_name: s.step, product_name: s.product, time_of_day: 'Weekly' }))
      ];

      await supabase.from('user_routines').insert(allSteps);
      await supabase.from('profiles').update({ has_completed_quiz: true }).eq('id', session.user.id);

      // Trigger Mobile Notifications Bridge
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCHEDULE_REMINDERS' }));
      }

      fetchProfile(session.user.id);
    } catch (err) { alert("AI Generation Failed"); setView('quiz'); }
  };

  const handleStepAction = async (stepId, status, typeKey) => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('user_routines').update({ last_action_date: today, last_action_status: status }).eq('id', stepId);
    
    if (!error) {
      setRoutine(prev => {
        const updated = { ...prev };
        updated[typeKey] = updated[typeKey].map(s => s.id === stepId ? { ...s, last_action_date: today } : s);
        
        // Auto-Trigger Camera if last step
        const pending = updated[typeKey].filter(s => s.last_action_date !== today);
        if (pending.length === 0) {
          setTimeout(() => { setActiveLogType(typeKey === 'am_routine' ? 'AM' : 'PM'); setShowCamera(true); }, 600);
        }
        return updated;
      });
    }
  };

  const removeStep = async (id, key) => {
    await supabase.from('user_routines').delete().eq('id', id);
    setRoutine(prev => ({ ...prev, [key]: prev[key].filter(s => s.id !== id) }));
  };

  const addCustomStep = async () => {
    const typeKey = newStep.type === 'AM' ? 'am_routine' : (newStep.type === 'PM' ? 'pm_routine' : 'weekly_treatments');
    const { data } = await supabase.from('user_routines').insert([{
      user_id: session.user.id, step_name: newStep.step, product_name: newStep.product, time_of_day: newStep.type, is_custom: true
    }]).select();
    setRoutine(prev => ({ ...prev, [typeKey]: [...prev[typeKey], data[0]] }));
    setShowAddModal(false);
  };

  // --- RENDERING ---

  if (loading) return <div className="min-h-screen bg-spa-pink flex items-center justify-center"><Loader2 className="animate-spin text-spa-gold" /></div>;
  if (!session) return <Auth />;
  if (view === 'quiz') return <Quiz onComplete={handleQuizComplete} />;
  if (view === 'gallery') return <Progress onBack={() => setView('dashboard')} />;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-32 px-6 bg-spa-pink/10 pt-14 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold tracking-[0.3em] text-spa-slate uppercase">GlowUp</span>
        <button onClick={() => supabase.auth.signOut()} className="text-spa-slate/30"><LogOut size={18} /></button>
      </div>

      <HomeHero />

      {/* Routine Sections */}
      {[
        { title: 'Morning Ritual', icon: Sun, key: 'am_routine', color: 'text-orange-400' },
        { title: 'Evening Ritual', icon: Moon, key: 'pm_routine', color: 'text-indigo-400' }
      ].map(sec => {
        const today = new Date().toISOString().split('T')[0];
        const pending = routine[sec.key].filter(s => s.last_action_date !== today);
        return (
          <div key={sec.key} className="mt-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-light italic text-spa-slate flex items-center gap-2">
                <sec.icon className={sec.color} size={20} /> {sec.title}
              </h2>
              <button onClick={() => { setNewStep({ ...newStep, type: sec.key === 'am_routine' ? 'AM' : 'PM' }); setShowAddModal(true); }} className="p-2 bg-white/60 rounded-full text-spa-gold"><Plus size={16} /></button>
            </div>
            {pending.length > 0 ? pending.map(item => (
              <SwipeableStep key={item.id} item={item} onComplete={() => handleStepAction(item.id, 'completed', sec.key)} onSkip={() => handleStepAction(item.id, 'skipped', sec.key)} />
            )) : <GlassCard className="py-6 text-center text-emerald-600 bg-emerald-50/30">Ritual Complete ✨</GlassCard>}
          </div>
        );
      })}

      {/* Weekly Boosts */}
      <h2 className="text-lg font-light italic text-spa-slate mt-10 mb-4 flex items-center gap-2"><Calendar className="text-spa-gold" size={20} /> Weekly Boosts</h2>
      <div className="grid grid-cols-2 gap-4">
        {routine.weekly_treatments.map(item => (
          <GlassCard key={item.id} className="p-4 min-h-[150px] flex flex-col justify-between overflow-hidden">
            <div>
              <span className="text-[9px] font-bold text-spa-gold uppercase tracking-widest">{item.frequency || 'Weekly'}</span>
              <h3 className="text-sm font-semibold text-spa-slate mt-1 leading-tight">{item.step_name}</h3>
            </div>
            <p className="text-[10px] text-spa-slate/40 italic line-clamp-2">{item.product_name}</p>
          </GlassCard>
        ))}
      </div>

      {/* Nav Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-xs glass rounded-full p-2 flex justify-around items-center border border-white/60 shadow-2xl z-40">
        <button onClick={() => setView('dashboard')} className={`p-3 rounded-full ${view === 'dashboard' ? 'text-spa-gold bg-white' : 'text-spa-slate/40'}`}><Sun size={20}/></button>
        <button onClick={() => setView('gallery')} className={`p-3 rounded-full ${view === 'gallery' ? 'text-spa-gold bg-white' : 'text-spa-slate/40'}`}><ImageIcon size={20}/></button>
        <button onClick={() => { setActiveLogType('General'); setShowCamera(true); }} className="p-3 text-spa-slate/40"><Camera size={20}/></button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/10 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm p-8 bg-white/95">
            <div className="flex justify-between items-center mb-6"><h3>Add Step</h3><button onClick={() => setShowAddModal(false)}><X/></button></div>
            <input className="w-full mb-4 p-4 rounded-2xl bg-spa-pink/20 border-none outline-none" placeholder="Step Name" onChange={e => setNewStep({...newStep, step: e.target.value})} />
            <input className="w-full mb-4 p-4 rounded-2xl bg-spa-pink/20 border-none outline-none" placeholder="Product Name" onChange={e => setNewStep({...newStep, product: e.target.value})} />
            <button onClick={addCustomStep} className="w-full py-4 bg-spa-gold text-white rounded-2xl font-bold">Save Ritual</button>
          </GlassCard>
        </div>
      )}

      {showCamera && <CameraModal onCapture={async (img) => { /* handleCapture logic */ setShowCamera(false); }} onClose={() => setShowCamera(false)} />}
    </div>
  );
}

export default App;