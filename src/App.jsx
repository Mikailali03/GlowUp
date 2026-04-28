import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './api/supabaseClient';

// UI Components
import Auth from './pages/Auth';
import Quiz from './pages/Quiz';
import Progress from './pages/Progress';
import HomeHero from './components/layout/HomeHero';
import { CameraModal } from './components/diary/CameraModal';
import { GlassCard } from './components/ui/GlassCard';
import { SwipeableStep } from './components/routines/SwipeableStep';

// Icons
import { 
  Sun, Moon, Calendar, AlertCircle, Loader2, LogOut, 
  Camera, Trash2, Plus, ChevronDown, ChevronUp, X, 
  CheckCircle2, Image as ImageIcon, Sparkles
} from 'lucide-react';

function App() {
  // --- AUTH & VIEW STATE ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('loading'); // loading, auth, quiz, dashboard, gallery
  
  // --- DATA STATE ---
  const [routine, setRoutine] = useState({ am_routine: [], pm_routine: [], weekly_treatments: [] });
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // --- UI MODALS ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [activeLogType, setActiveLogType] = useState(null);
  const [newStep, setNewStep] = useState({ step: '', product: '', type: 'AM' });

  // --- 1. FETCH PROFILE & ROUTINES (The "Healing" Logic) ---
  const fetchProfile = useCallback(async (userId) => {
    try {
      // Check if user has finished the quiz
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('has_completed_quiz')
        .eq('id', userId)
        .maybeSingle();

      if (pError) throw pError;

      if (profile?.has_completed_quiz) {
        // Fetch the actual relational routine steps
        const { data: routineData, error: rError } = await supabase
          .from('user_routines')
          .select('*')
          .order('created_at', { ascending: true });

        if (rError) throw rError;

        if (routineData && routineData.length > 0) {
          // AI is done! Organize and show dashboard
          setRoutine({
            am_routine: routineData.filter(r => r.time_of_day === 'AM'),
            pm_routine: routineData.filter(r => r.time_of_day === 'PM'),
            weekly_treatments: routineData.filter(r => r.time_of_day === 'Weekly')
          });
          setIsAiGenerating(false);
          setView('dashboard');
        } else {
          // Quiz is done, but no routines yet = AI is still processing in background
          setIsAiGenerating(true);
          setView('dashboard');
          // Re-check in 3 seconds (The "Healing" Polling)
          setTimeout(() => fetchProfile(userId), 3000);
        }
      } else {
        setView('quiz');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setView('quiz');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 2. AUTH LISTENER ---
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
  }, [fetchProfile]);

  // --- 3. ACTIONS ---
  const handleQuizComplete = async (results) => {
  setView('loading');
  try {
    // 1. Mark intent in DB
    const { error: pError } = await supabase
      .from('profiles')
      .update({ has_completed_quiz: true, last_quiz_results: results })
      .eq('id', session.user.id);
    
    if (pError) throw pError;

    // 2. Trigger AI (We DO await it now just to catch immediate errors)
    const { data, error: funcError } = await supabase.functions.invoke('generate-routine', {
      body: { quizResults: results, userId: session.user.id }
    });

    if (funcError) {
      // If it fails immediately, show the error
      const errJson = await funcError.context.json();
      throw new Error(errJson.error || "AI failed to start");
    }

    // 3. Start the polling dashboard
    setView('dashboard');
    fetchProfile(session.user.id);
  } catch (err) {
    console.error("Quiz Error:", err.message);
    alert(`Error: ${err.message}`);
    // If it fails, let them try the quiz again
    setView('quiz'); 
  }
};

  const handleStepAction = async (stepId, status, typeKey) => {
    const today = new Date().toISOString().split('T')[0];
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
        const ritualType = typeKey === 'am_routine' ? 'AM' : 'PM';
        const pending = updated[typeKey].filter(s => s.last_action_date !== today);
        if (pending.length === 0) {
          setTimeout(() => { setActiveLogType(ritualType); setShowCamera(true); }, 600);
        }
        return updated;
      });
    }
  };

  const removeStep = async (id, typeKey) => {
    const { error } = await supabase.from('user_routines').delete().eq('id', id);
    if (!error) {
      setRoutine(prev => ({ ...prev, [typeKey]: prev[typeKey].filter(s => s.id !== id) }));
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
      const key = dbType === 'AM' ? 'am_routine' : (dbType === 'PM' ? 'pm_routine' : 'weekly_treatments');
      setRoutine(prev => ({ ...prev, [key]: [...prev[key], data[0]] }));
      setShowAddModal(false);
      setNewStep({ step: '', product: '', type: 'AM' });
    }
  };

  // --- DASHBOARD SUB-COMPONENTS ---
  const RoutineSection = ({ title, icon: Icon, steps, colorClass, typeKey, typeLabel }) => {
    const today = new Date().toISOString().split('T')[0];
    const pending = steps.filter(s => s.last_action_date !== today);
    const completed = steps.filter(s => s.last_action_date === today);

    return (
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6 px-1">
          <div className="flex items-center gap-2">
            <Icon className={colorClass} size={20} />
            <h2 className="text-lg font-light italic text-spa-slate">{title}</h2>
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
          <GlassCard className="bg-emerald-50/30 border-emerald-100/50 py-8 text-center">
            <CheckCircle2 className="text-emerald-600 mx-auto mb-2" />
            <p className="text-emerald-800 text-sm font-medium">Ritual Complete</p>
          </GlassCard>
        )}
      </div>
    );
  };

  // --- RENDER LOGIC ---
  if (loading) return <div className="min-h-screen bg-spa-pink flex items-center justify-center"><Loader2 className="animate-spin text-spa-gold" /></div>;
  if (!session) return <Auth />;
  if (view === 'quiz') return <Quiz onComplete={handleQuizComplete} />;
  if (view === 'gallery') return <Progress onBack={() => setView('dashboard')} />;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-32 px-6 bg-spa-pink/10 animate-fade-in relative">
      <div className="flex justify-between items-center pt-14 mb-2">
        <span className="text-[10px] font-bold tracking-[0.3em] text-spa-gold uppercase">GlowUp</span>
        <button onClick={() => supabase.auth.signOut()} className="text-spa-slate/30"><LogOut size={18} /></button>
      </div>

      <HomeHero />

      {/* THE DASHBOARD CONTENT */}
      {isAiGenerating ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin mx-auto text-spa-gold mb-4" />
          <h3 className="text-xl font-light italic text-spa-slate">Curating your glow...</h3>
          <p className="text-[10px] text-spa-slate/40 uppercase tracking-widest mt-2 px-10 leading-relaxed">
            Our aesthetician is finalizing your custom routine. It will appear here in just a moment.
          </p>
        </div>
      ) : (
        <>
          <RoutineSection title="Morning Ritual" icon={Sun} steps={routine.am_routine} colorClass="text-orange-400" typeKey="am_routine" typeLabel="AM" />
          <RoutineSection title="Evening Ritual" icon={Moon} steps={routine.pm_routine} colorClass="text-indigo-400" typeKey="pm_routine" typeLabel="PM" />
          
          <h2 className="text-xl font-light text-spa-slate italic mt-12 mb-4 px-1">Weekly Boosts</h2>
          <div className="grid grid-cols-2 gap-4">
            {routine.weekly_treatments.map((item) => (
              <GlassCard key={item.id} className="p-5 border-spa-gold/10 bg-spa-gold/5 flex flex-col justify-between min-h-[150px]">
                <div className="flex justify-between">
                  <span className="text-[9px] font-bold text-spa-gold uppercase tracking-widest">{item.time_of_day}</span>
                  <button onClick={() => removeStep(item.id, 'weekly_treatments')}><Trash2 size={12} className="text-spa-slate/20"/></button>
                </div>
                <h3 className="text-sm font-semibold text-spa-slate mt-1 leading-tight">{item.step_name}</h3>
                <p className="text-[10px] text-spa-slate/50 italic mt-2 line-clamp-2">{item.product_name}</p>
              </GlassCard>
            ))}
            <button onClick={() => { setNewStep({...newStep, type: 'Weekly'}); setShowAddModal(true); }} className="border-2 border-dashed border-spa-gold/10 rounded-3xl flex flex-col items-center justify-center text-spa-gold/40 h-[150px]"><Plus/></button>
          </div>
        </>
      )}

      {/* BOTTOM NAV DOCK */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-xs glass rounded-full p-2 flex justify-around items-center border border-white/60 shadow-2xl z-40">
        <button onClick={() => setView('dashboard')} className={`p-3 rounded-full ${view === 'dashboard' ? 'bg-white shadow-sm text-spa-gold' : 'text-spa-slate/40'}`}><Sun size={20}/></button>
        <button onClick={() => setShowCamera(true)} className="p-3 text-spa-slate/40"><Camera size={20}/></button>
        <button onClick={() => setView('gallery')} className={`p-3 rounded-full ${view === 'gallery' ? 'bg-white shadow-sm text-spa-gold' : 'text-spa-slate/40'}`}><ImageIcon size={20}/></button>
      </div>

      {/* MODALS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-spa-slate/20 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm bg-white p-8">
            <div className="flex justify-between mb-6">
              <h3 className="text-xl font-light italic">Add {newStep.type} Step</h3>
              <button onClick={() => setShowAddModal(false)}><X/></button>
            </div>
            <div className="space-y-4">
              <input className="w-full bg-spa-pink/10 border p-4 rounded-2xl" placeholder="Step Name" onChange={e => setNewStep({...newStep, step: e.target.value})} />
              <input className="w-full bg-spa-pink/10 border p-4 rounded-2xl" placeholder="Product" onChange={e => setNewStep({...newStep, product: e.target.value})} />
              <button onClick={addCustomStep} className="w-full py-4 bg-spa-gold text-white rounded-2xl font-bold shadow-lg">Save Ritual</button>
            </div>
          </GlassCard>
        </div>
      )}

      {showCamera && <CameraModal onClose={() => setShowCamera(false)} onCapture={(img) => { /* logic to save photo */ setShowCamera(false); }} />}
    </div>
  );
}

export default App;