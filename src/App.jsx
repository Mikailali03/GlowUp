import React, { useState, useEffect } from 'react';
import { supabase } from './api/supabaseClient';
import { 
  Sun, Moon, Calendar, AlertCircle, Loader2, LogOut, 
  Camera, Trash2, Plus, X, Image as ImageIcon, CheckCircle2 
} from 'lucide-react';

// Components
import Auth from './pages/Auth';
import Quiz from './pages/Quiz';
import Progress from './pages/Progress';
import HomeHero from './components/layout/HomeHero';
import { GlassCard } from './components/ui/GlassCard';
import { CameraModal } from './components/diary/CameraModal';
import { SwipeableStep } from './components/routines/SwipeableStep';

function App() {
  // --- STATE ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('loading'); // loading, quiz, dashboard, gallery
  const [routine, setRoutine] = useState({ am_routine: [], pm_routine: [], weekly_treatments: [] });
  
  // Modals & UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [activeLogType, setActiveLogType] = useState(null);
  const [newStep, setNewStep] = useState({ step: '', product: '', type: 'AM' });

  const today = new Date().toISOString().split('T')[0];

  // --- AUTH & PROFILE SYNC ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setLoading(false);
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('has_completed_quiz').eq('id', userId).maybeSingle();
      
      if (profile?.has_completed_quiz) {
        const { data: routineData } = await supabase
          .from('user_routines')
          .select('*')
          .order('created_at', { ascending: true });

        setRoutine({
          am_routine: routineData.filter(r => r.time_of_day === 'AM'),
          pm_routine: routineData.filter(r => r.time_of_day === 'PM'),
          weekly_treatments: routineData.filter(r => r.time_of_day === 'Weekly')
        });
        setView('dashboard');
      } else {
        setView('quiz');
      }
    } catch (err) {
      setView('quiz');
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleQuizComplete = async (results) => {
    setView('loading');
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-routine', {
        body: { quizResults: results }
      });

      if (aiError) throw aiError;

      const prepare = (list, time) => list.map(s => ({
        user_id: session.user.id,
        step_name: s.step,
        product_name: s.product,
        why_logic: s.why,
        warning_note: s.warning,
        time_of_day: time
      }));

      const allSteps = [
        ...prepare(aiData.am_routine, 'AM'),
        ...prepare(aiData.pm_routine, 'PM'),
        ...prepare(aiData.weekly_treatments, 'Weekly')
      ];

      await supabase.from('user_routines').insert(allSteps);
      await supabase.from('profiles').update({ has_completed_quiz: true }).eq('id', session.user.id);

      fetchProfile(session.user.id);
    } catch (err) {
      alert("AI Consultation failed. Please try again.");
      setView('quiz');
    }
  };

  const handleStepAction = async (stepId, status, typeKey) => {
    const { error } = await supabase
      .from('user_routines')
      .update({ last_action_date: today, last_action_status: status })
      .eq('id', stepId);

    if (!error) {
      setRoutine(prev => {
        const updated = { ...prev };
        updated[typeKey] = updated[typeKey].map(s => 
          s.id === stepId ? { ...s, last_action_date: today, last_action_status: status } : s
        );

        // Check if Ritual is finished to trigger camera
        const pending = updated[typeKey].filter(s => s.last_action_date !== today);
        if (pending.length === 0) {
          const ritualLabel = typeKey === 'am_routine' ? 'AM' : 'PM';
          setTimeout(() => { setActiveLogType(ritualLabel); setShowCamera(true); }, 600);
        }
        return updated;
      });
    }
  };

  const removeStep = async (stepId, typeKey) => {
    const { error } = await supabase.from('user_routines').delete().eq('id', stepId);
    if (!error) {
      setRoutine(prev => ({
        ...prev,
        [typeKey]: prev[typeKey].filter(s => s.id !== stepId)
      }));
    }
  };

  const addCustomStep = async () => {
    const dbType = newStep.type;
    const { data, error } = await supabase.from('user_routines').insert([{
      user_id: session.user.id,
      step_name: newStep.step,
      product_name: newStep.product,
      time_of_day: dbType,
      is_custom: true
    }]).select();

    if (!error) {
      const typeKey = dbType === 'AM' ? 'am_routine' : (dbType === 'PM' ? 'pm_routine' : 'weekly_treatments');
      setRoutine(prev => ({ ...prev, [typeKey]: [...prev[typeKey], data[0]] }));
      setShowAddModal(false);
      setNewStep({ step: '', product: '', type: 'AM' });
    }
  };

  const handleCapture = async (imageData) => {
    try {
      const res = await fetch(imageData);
      const blob = await res.blob();
      const path = `${session.user.id}/${Date.now()}.jpg`;

      await supabase.storage.from('diary-photos').upload(path, blob);
      await supabase.from('skin_diary').insert([{
        user_id: session.user.id,
        image_path: path,
        entry_type: activeLogType
      }]);

      setShowCamera(false);
      alert("Sanctuary log complete. Consistency is your glow.");
    } catch (err) {
      alert("Failed to save ritual photo.");
    }
  };

  // --- RENDER HELPERS ---
  const RoutineSection = ({ title, icon: Icon, steps, colorClass, typeKey, typeLabel }) => {
    const pending = steps.filter(s => s.last_action_date !== today);
    const completed = steps.filter(s => s.last_action_date === today);

    return (
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6 px-1">
          <div className="flex items-center gap-2">
            <Icon className={colorClass} size={20} />
            <h2 className="text-xl font-light italic text-spa-slate">{title}</h2>
          </div>
          <button 
            onClick={() => { setNewStep({ ...newStep, type: typeLabel }); setShowAddModal(true); }}
            className="p-2 bg-white/60 rounded-full text-spa-gold shadow-sm border border-white"
          >
            <Plus size={16} />
          </button>
        </div>

        {pending.length > 0 ? (
          <div className="space-y-1">
            {pending.map((item) => (
              <SwipeableStep 
                key={item.id}
                item={item}
                onComplete={() => handleStepAction(item.id, 'completed', typeKey)}
                onSkip={() => handleStepAction(item.id, 'skipped', typeKey)}
              />
            ))}
          </div>
        ) : (
          <GlassCard className="bg-emerald-50/30 border-emerald-100/50 py-10 text-center">
            <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={32} />
            <p className="text-emerald-800 text-sm font-medium uppercase tracking-widest">Ritual Finished</p>
          </GlassCard>
        )}
      </div>
    );
  };

  // --- VIEWS ---
  if (loading) return <div className="min-h-screen bg-spa-pink flex items-center justify-center"><Loader2 className="animate-spin text-spa-gold" /></div>;
  if (!session) return <Auth />;
  if (view === 'quiz') return <Quiz onComplete={handleQuizComplete} />;
  if (view === 'gallery') return <Progress onBack={() => setView('dashboard')} />;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-32 px-6 bg-spa-pink/10 animate-fade-in relative">
      <div className="flex justify-between items-center pt-8 mb-4">
        <span className="text-[10px] font-bold tracking-[0.3em] text-spa-slate uppercase">GlowUp Sanctuary</span>
        <button onClick={() => supabase.auth.signOut()} className="text-spa-slate/30 hover:text-red-400"><LogOut size={18} /></button>
      </div>

      <HomeHero />

      <RoutineSection title="Morning Ritual" icon={Sun} steps={routine.am_routine} colorClass="text-orange-400" typeKey="am_routine" typeLabel="AM" />
      <RoutineSection title="Evening Ritual" icon={Moon} steps={routine.pm_routine} colorClass="text-indigo-400" typeKey="pm_routine" typeLabel="PM" />

      {/* Weekly Boosts Grid */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="text-spa-gold" size={20} />
            <h2 className="text-xl font-light italic text-spa-slate">Weekly Boosts</h2>
          </div>
          <button onClick={() => { setNewStep({ ...newStep, type: 'Weekly' }); setShowAddModal(true); }} className="p-2 bg-white/60 rounded-full text-spa-gold shadow-sm border border-white">
            <Plus size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {routine.weekly_treatments.map((item) => (
            <GlassCard key={item.id} className="p-5 min-h-[160px] flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-spa-gold uppercase tracking-widest">Weekly</span>
                <button onClick={() => removeStep(item.id, 'weekly_treatments')} className="opacity-0 group-hover:opacity-100 text-red-300 transition-opacity"><Trash2 size={12}/></button>
              </div>
              <h3 className="text-sm font-semibold text-spa-slate leading-tight">{item.step_name}</h3>
              <p className="text-[10px] text-spa-slate/40 italic line-clamp-2">{item.product_name}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <button onClick={() => setView('quiz')} className="w-full mt-24 mb-10 text-[10px] text-spa-slate/20 uppercase tracking-[0.4em] hover:text-spa-gold transition-colors">Retake Skin Assessment</button>

      {/* MODALS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-spa-slate/20 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm bg-white/95 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-light italic">New Ritual Step</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} className="text-spa-slate/30" /></button>
            </div>
            <div className="space-y-5">
              <input className="w-full bg-spa-pink/10 border-white p-4 rounded-2xl outline-none" placeholder="Step (e.g. Cleanser)" value={newStep.step} onChange={e => setNewStep({...newStep, step: e.target.value})} />
              <input className="w-full bg-spa-pink/10 border-white p-4 rounded-2xl outline-none" placeholder="Product Name" value={newStep.product} onChange={e => setNewStep({...newStep, product: e.target.value})} />
              <button onClick={addCustomStep} className="w-full py-4 bg-spa-gold text-white rounded-3xl font-bold mt-4 shadow-lg active:scale-95 transition-transform">Add to Ritual</button>
            </div>
          </GlassCard>
        </div>
      )}

      {showCamera && <CameraModal onCapture={handleCapture} onClose={() => setShowCamera(false)} />}

      {/* Navigation Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[80%] max-w-xs glass rounded-full p-2 flex justify-around items-center border border-white/60 shadow-2xl z-40">
        <button onClick={() => setView('dashboard')} className={`p-3 rounded-full transition-all ${view === 'dashboard' ? 'text-spa-gold bg-white/80 shadow-sm' : 'text-spa-slate/40'}`}><Sun size={20}/></button>
        <button onClick={() => setView('gallery')} className={`p-3 rounded-full transition-all ${view === 'gallery' ? 'text-spa-gold bg-white/80 shadow-sm' : 'text-spa-slate/40'}`}><ImageIcon size={20}/></button>
        <button onClick={() => setShowCamera(true)} className="p-3 text-spa-slate/40 hover:text-spa-gold transition-colors"><Camera size={20}/></button>
      </div>
    </div>
  );
}

export default App;