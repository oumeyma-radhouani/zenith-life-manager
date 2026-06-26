"use client";

import Image from "next/image";
import useSWR from "swr";
import { useState, useEffect } from "react"; 
import Window from "../components/Window";
import Calendar from "../components/Calendar";
import MusicPlayer from "../components/MusicPlayer";
import Me from "../components/Me"; // <-- Imported the new component
import { createClient } from "@supabase/supabase-js"; 
import { Rnd } from "react-rnd"; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ColorPixelIcon = ({ src }: { src: string }) => (
  <img 
    src={src} 
    alt="icon" 
    className="w-12 h-12 object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] group-hover:-translate-y-1 transition-transform duration-200 shrink-0" 
    style={{ imageRendering: 'pixelated' }}
  />
);

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [systemState, setSystemState] = useState<'login' | 'booting' | 'desktop'>('login');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [centerPos, setCenterPos] = useState({ x: 100, y: 100 });

  const { data: tasks, mutate: mutateTasks } = useSWR("http://localhost:8000/tasks/", fetcher);
  const { data: player, mutate: mutatePlayer } = useSWR("http://localhost:8000/tasks/player", fetcher);
  const { data: note, mutate: mutateNote } = useSWR("http://localhost:8000/notes/", fetcher); 
  const { data: financeData, mutate: mutateFinances } = useSWR("http://localhost:8000/finances/", fetcher);
  
  // Renamed the core windows to fit the aesthetic
  const [windows, setWindows] = useState({
    profile: { title: "me.exe", isMinimized: false, icon: <ColorPixelIcon src="/Home.png" /> },
    quests: { title: "Task Manager", isMinimized: false, icon: <ColorPixelIcon src="/ChestTreasure.png" /> },
    notes: { title: "Brain Dump", isMinimized: true, icon: <ColorPixelIcon src="/Pencil.png" /> },
    calendar: { title: "Schedule Sync", isMinimized: true, icon: <ColorPixelIcon src="/Cloud.png" /> },
    finances: { title: "Wallet", isMinimized: true, icon: <ColorPixelIcon src="/Coin2.png" /> },
    media: { title: "Media Player", isMinimized: true, icon: <ColorPixelIcon src="/CD.png" /> }
  });

  const toggleMinimize = (key: keyof typeof windows) => {
    setWindows(prev => ({ ...prev, [key]: { ...prev[key], isMinimized: !prev[key].isMinimized } }));
  };

  const launchApp = (key: keyof typeof windows) => {
    setWindows(prev => ({ ...prev, [key]: { ...prev[key], isMinimized: false } }));
    setIsStartMenuOpen(false); 
  };

  // Quick Add State (Difficulty repurposed as Category)
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("life"); 
  const [isDaily, setIsDaily] = useState(false);
  const [dueDate, setDueDate] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number, xp: number } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [financeTitle, setFinanceTitle] = useState("");
  const [financeAmount, setFinanceAmount] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [isSubmittingFinance, setIsSubmittingFinance] = useState(false);

  const [xpPopups, setXpPopups] = useState<{id: number, text: string, x: number, y: number}[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setSystemState('booting');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setSystemState(prev => prev === 'login' ? 'booting' : prev);
      } else {
        setSystemState('login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (systemState === 'booting') {
      const timer = setTimeout(() => {
        setSystemState('desktop');
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [systemState]);

  useEffect(() => { if (note && noteText === "") setNoteText(note.content || ""); }, [note, noteText]);

  useEffect(() => {
    setIsMounted(true);
    setCenterPos({
      x: Math.max(50, (window.innerWidth - 450) / 2),
      y: Math.max(50, (window.innerHeight - 500) / 2)
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoggingIn(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    setIsStartMenuOpen(false);
    await supabase.auth.signOut();
  };

  const handleCreateQuest = async (e: any) => {
    e.preventDefault(); if (!title.trim()) return; setIsSubmitting(true);
    // Sending 'category' into the 'difficulty' field to avoid DB migration
    await fetch("http://localhost:8000/tasks/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, difficulty: category, is_daily: isDaily, due_date: dueDate ? dueDate : null, subtasks: [] }) });
    setTitle(""); setCategory("life"); setIsDaily(false); setDueDate(""); mutateTasks(); setIsSubmitting(false);
  };

  const handleToggleSubtask = async (id: number) => { await fetch(`http://localhost:8000/tasks/subtasks/${id}`, { method: "PUT" }); mutateTasks(); };
  
  const handleCompleteQuest = async (task: any, e: React.MouseEvent) => {
    const popupId = Date.now();
    setXpPopups(prev => [...prev, { id: popupId, text: `+${task.xp_reward} XP`, x: e.clientX, y: e.clientY }]);
    setTimeout(() => {
      setXpPopups(prev => prev.filter(p => p.id !== popupId));
    }, 1200);

    const response = await fetch(`http://localhost:8000/tasks/${task.id}`, { method: "DELETE" });
    const data = await response.json();
    if (data.error) { alert(`SYSTEM WARNING: ${data.error}`); return; }
    
    if (player && data.new_level > player.level) {
      setLevelUpData({ level: data.new_level, xp: data.new_total_xp });
    }
    mutateTasks(); mutatePlayer(); 
  };
  
  const handleSaveNote = async () => { setIsSavingNote(true); await fetch("http://localhost:8000/notes/", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: noteText }) }); mutateNote(); setIsSavingNote(false); };
  const handleAddFinance = async (e: any) => {
    e.preventDefault(); if (!financeTitle.trim() || !financeAmount) return; setIsSubmittingFinance(true);
    await fetch("http://localhost:8000/finances/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: financeTitle, amount: parseFloat(financeAmount), is_income: isIncome }) });
    setFinanceTitle(""); setFinanceAmount(""); setIsIncome(false); mutateFinances(); setIsSubmittingFinance(false);
  };
  const handleDeleteFinance = async (id: number) => { await fetch(`http://localhost:8000/finances/${id}`, { method: "DELETE" }); mutateFinances(); };

  if (systemState === 'login') {
    return (
      <main className="relative w-screen h-screen overflow-hidden text-black text-xl flex flex-col items-center justify-center p-4 bg-[#6c42ab]">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 parallax-layer scale-[1.05] origin-bottom" style={{ backgroundImage: "url('/1_starry.png')" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/6_starry.png')", animation: "pan-left 300s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/2_starry.png')", animation: "pan-left 200s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/3_starry.png')", animation: "pan-left 150s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/4_starry.png')", animation: "pan-left 100s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/5_starry.png')", animation: "pan-left 60s linear infinite" }}></div>
        </div>

        <div className="w-[400px] border-[2px] border-black p-8 bg-white relative z-10 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <h1 className="text-5xl font-bold mb-2 tracking-widest text-center text-black">ZENITH OS</h1>
          <p className="text-lg mb-8 text-center border-b-[2px] border-black pb-2 tracking-widest uppercase">System Initialization</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
            <div className="flex flex-col gap-1"><label className="text-lg font-bold text-black">USER EMAIL:</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#dfdfdf] border-[2px] border-black text-black p-2 outline-none focus:bg-white" required disabled={isLoggingIn}/></div>
            <div className="flex flex-col gap-1"><label className="text-lg font-bold text-black">PASSPHRASE:</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#dfdfdf] border-[2px] border-black text-black p-2 outline-none focus:bg-white" required disabled={isLoggingIn}/></div>
            {authError && <p className="text-red-600 text-lg font-bold">ERROR: {authError}</p>}
            <button type="submit" disabled={isLoggingIn} className="mt-4 border-[2px] border-black bg-[#dfdfdf] text-black p-3 hover:bg-black hover:text-white transition-colors font-bold tracking-widest disabled:opacity-50">BOOT SYSTEM</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden text-black bg-black">
      
      {/* GLOBAL ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0px) scale(0.5); opacity: 1; }
          20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-80px) scale(1); opacity: 0; }
        }
        .animate-float-xp { animation: floatUp 1.2s ease-out forwards; }
        
        @keyframes modalDrop {
          0% { transform: translateY(-50px); opacity: 0; }
          100% { transform: translateY(0px); opacity: 1; }
        }
        .animate-modal { animation: modalDrop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        /* The Animated Pixel Background for Task Manager */
        @keyframes slide-bg {
          from { background-position: 0 0, 10px 10px; }
          to { background-position: -40px -40px, -30px -30px; }
        }
        .task-bg-animated {
          background-color: #f1f5f9;
          background-image: 
            repeating-linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0), 
            repeating-linear-gradient(45deg, #e2e8f0 25%, #f1f5f9 25%, #f1f5f9 75%, #e2e8f0 75%, #e2e8f0);
          background-position: 0 0, 10px 10px;
          background-size: 20px 20px;
          animation: slide-bg 15s linear infinite;
        }
      `}} />

      {/* RENDER FLOATING XP POPUPS */}
      {xpPopups.map((popup) => (
        <div key={popup.id} className="fixed pointer-events-none z-[9999] animate-float-xp font-bold text-2xl text-[#facc15]" style={{ left: popup.x - 20, top: popup.y - 20, textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
          {popup.text}
        </div>
      ))}

      {/* LEVEL UP MODAL */}
      {levelUpData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="animate-modal bg-white border-[4px] border-black p-8 shadow-[12px_12px_0_rgba(0,0,0,1)] flex flex-col items-center max-w-md text-center">
            <h2 className="text-5xl font-bold text-[#facc15] mb-2" style={{ textShadow: '3px 3px 0 #000' }}>LEVEL UP!</h2>
            <p className="text-2xl font-bold text-black mb-6">You have reached <span className="text-[#5b7c99]">Level {levelUpData.level}</span>.</p>
            <div className="w-24 h-24 bg-[#dfdfdf] border-[2px] border-black flex items-center justify-center text-4xl mb-6 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)]">
              🎉
            </div>
            <button onClick={() => setLevelUpData(null)} className="bg-[#5b7c99] text-white font-bold text-xl px-8 py-3 border-[2px] border-black shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-1 active:shadow-none transition-all">
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {systemState === 'booting' && (
        <div className="fixed inset-0 z-[9998] pointer-events-auto cursor-wait flex flex-col justify-between bg-transparent">
          <style dangerouslySetInnerHTML={{__html: `
            .crt-top { animation: slide-out-top 0.7s 0.3s steps(12, end) forwards; }
            .crt-bottom { animation: slide-out-bottom 0.7s 0.3s steps(12, end) forwards; }
            .crt-flash { animation: flash-bang 0.3s forwards; }
            @keyframes flash-bang { 0% { background: #000; opacity: 1; } 40% { background: #fff; opacity: 1; } 100% { background: transparent; opacity: 0; } }
            @keyframes slide-out-top { 0% { height: 50vh; opacity: 1; } 99% { height: 0vh; opacity: 1; } 100% { height: 0vh; opacity: 0; display: none; } }
            @keyframes slide-out-bottom { 0% { height: 50vh; opacity: 1; } 99% { height: 0vh; opacity: 1; } 100% { height: 0vh; opacity: 0; display: none; } }
          `}} />
          <div className="crt-top w-full h-[50vh] bg-black border-b-[4px] border-white shadow-[0_10px_40px_#1ca3ec] z-20"></div>
          <div className="crt-bottom w-full h-[50vh] bg-black border-t-[4px] border-white shadow-[0_-10px_40px_#1ca3ec] z-20"></div>
          <div className="crt-flash absolute inset-0 z-30 pointer-events-none bg-black"></div>
        </div>
      )}

      <div className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-1000 ease-in-out ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#1ca3ec]'}`}>
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isDarkMode ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/1.png')" }}></div>
          <div className="absolute inset-0 parallax-layer opacity-90" style={{ backgroundImage: "url('/2.png')", animation: "pan-left 180s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/3.png')", animation: "pan-left 120s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/4.png')", animation: "pan-left 60s linear infinite" }}></div>
        </div>
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/1_dark.png')" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/2_dark.png')", animation: "pan-left 300s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/3_dark.png')", animation: "pan-left 120s linear infinite" }}></div>
          <div className="absolute inset-0 parallax-layer" style={{ backgroundImage: "url('/4_dark.png')", animation: "pan-left 60s linear infinite" }}></div>
        </div>
      </div>

      <div className="absolute top-10 left-6 z-30 flex flex-col gap-8 items-center w-[100px]">
        {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
          const win = windows[key];
          return (
            <button key={key} onClick={() => toggleMinimize(key)} className={`flex flex-col items-center gap-2 group transition-all ${!win.isMinimized ? 'opacity-40' : 'opacity-100'}`}>
              {win.icon}
              <span className="text-[14px] font-bold text-white tracking-wide text-center leading-tight drop-shadow-[0px_4px_4px_rgba(0,0,0,0.5)]" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0px 2px 0 #000' }}>{win.title}</span>
            </button>
          )
        })}
      </div>

      <div className="relative z-10 w-full h-[calc(100vh-48px)] overflow-hidden">
        
        {/* THE NEW me.exe COMPONENT */}
        {isMounted && !windows.profile.isMinimized && (
          <Window title="me.exe" defaultX={Math.max(20, centerPos.x - 400)} defaultY={Math.max(20, centerPos.y - 100)} defaultWidth={280} defaultHeight={420} onMinimize={() => toggleMinimize("profile")}>
            <Me player={player} />
          </Window>
        )}

        {/* --- REBUILT TASK MANAGER (No dropdowns, internal animated background) --- */}
        {isMounted && !windows.quests.isMinimized && (
          <Window title="Task Manager" defaultX={centerPos.x - 50} defaultY={centerPos.y - 50} defaultWidth={500} defaultHeight={550} onMinimize={() => toggleMinimize("quests")}>
            <div className="flex flex-col h-full min-h-0 bg-white">
              
              {/* Quick Add Bar (No Dropdowns) */}
              <div className="bg-white border-b-[2px] border-black p-3 shrink-0 shadow-[0_4px_0_rgba(0,0,0,0.1)] z-10">
                <form onSubmit={handleCreateQuest} className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2">
                    <input 
                      type="text" placeholder="Type task here..." value={title} onChange={(e) => setTitle(e.target.value)} 
                      className="flex-1 bg-white border-[2px] border-black px-2 py-1 text-lg font-bold outline-none placeholder:text-gray-400 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] focus:bg-[#f8fafc]"
                    />
                    <button type="submit" disabled={!title.trim() || isSubmitting} className="bg-black text-white px-4 py-1 text-lg font-bold hover:bg-[#a5b4fc] hover:text-black transition-colors disabled:opacity-50 border-[2px] border-black shadow-[2px_2px_0_#000] active:translate-y-[2px] active:shadow-none">
                      ADD
                    </button>
                  </div>
                  
                  {/* Category Buttons (Replaces the `<select>` dropdown) */}
                  <div className="flex gap-2 text-xs font-bold uppercase tracking-widest overflow-x-auto">
                    <button type="button" onClick={() => setCategory("life")} className={`border-[2px] border-black px-2 py-1 transition-colors ${category === "life" ? 'bg-[#fbcfe8] shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]' : 'bg-white hover:bg-gray-100'}`}>Life</button>
                    <button type="button" onClick={() => setCategory("work")} className={`border-[2px] border-black px-2 py-1 transition-colors ${category === "work" ? 'bg-[#bae6fd] shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]' : 'bg-white hover:bg-gray-100'}`}>Work</button>
                    <button type="button" onClick={() => setCategory("study")} className={`border-[2px] border-black px-2 py-1 transition-colors ${category === "study" ? 'bg-[#fef08a] shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]' : 'bg-white hover:bg-gray-100'}`}>Study</button>
                    <button type="button" onClick={() => setCategory("art")} className={`border-[2px] border-black px-2 py-1 transition-colors ${category === "art" ? 'bg-[#e9d5ff] shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]' : 'bg-white hover:bg-gray-100'}`}>Art</button>
                    
                    <div className="w-[1px] h-full bg-gray-300 mx-1"></div>
                    
                    <button type="button" onClick={() => setIsDaily(!isDaily)} className={`border-[2px] border-black px-2 py-1 transition-colors ${isDaily ? 'bg-[#10b981] text-white shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]' : 'bg-white hover:bg-gray-100'}`}>
                      {isDaily ? 'Daily' : 'One-off'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Task Canvas with Animated Background */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 task-bg-animated">
                <div className="relative z-10 flex flex-col gap-6">
                  
                  {/* Daily Routines */}
                  {tasks && tasks.filter((t: any) => t.is_daily).length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="inline-block bg-black text-white border-[2px] border-black px-2 py-1 mb-2 w-fit shadow-[2px_2px_0_rgba(255,255,255,1)]">
                        <h2 className="font-bold text-sm tracking-widest uppercase">ROUTINES</h2>
                      </div>
                      <div className="flex flex-col gap-2">
                        {tasks.filter((t: any) => t.is_daily).map((task: any) => (
                          <div key={task.id} className="flex justify-between items-center bg-white border-[2px] border-black p-2 shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] transition-all">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input type="checkbox" onChange={(e) => handleCompleteQuest(task, e as unknown as React.MouseEvent)} className="appearance-none shrink-0 w-5 h-5 border-[2px] border-black bg-white cursor-pointer checked:bg-black checked:after:content-['✓'] checked:after:text-white checked:after:font-bold checked:after:flex checked:after:items-center checked:after:justify-center checked:after:h-full transition-colors hover:bg-gray-200" />
                              <span className="font-bold text-md text-black truncate">{task.title}</span>
                            </label>
                            <span className="px-1.5 py-0.5 text-[10px] font-bold border-[2px] border-black bg-[#f1f5f9] text-black uppercase">{task.difficulty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Tasks */}
                  <div className="flex flex-col gap-2">
                    <div className="inline-block bg-white text-black border-[2px] border-black px-2 py-1 mb-2 w-fit shadow-[2px_2px_0_#000]">
                      <h2 className="font-bold text-sm tracking-widest uppercase">TO-DO LIST</h2>
                    </div>
                    {tasks && tasks.filter((t: any) => !t.is_daily).length > 0 ? tasks.filter((t: any) => !t.is_daily).map((task: any) => (
                      <div key={task.id} className="flex flex-col bg-white border-[2px] border-black p-2 shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] transition-all">
                        <div className="flex items-center justify-between gap-4">
                          <label className="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden">
                            <input type="checkbox" onChange={(e) => handleCompleteQuest(task, e as unknown as React.MouseEvent)} className="appearance-none shrink-0 w-5 h-5 border-[2px] border-black bg-white cursor-pointer checked:bg-black checked:after:content-['✓'] checked:after:text-white checked:after:font-bold checked:after:flex checked:after:items-center checked:after:justify-center checked:after:h-full transition-colors hover:bg-gray-200" />
                            <span className="font-bold text-md text-black truncate">{task.title}</span>
                          </label>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold border-[2px] border-black bg-[#f1f5f9] text-black uppercase">{task.difficulty}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-black font-bold text-sm italic bg-white p-2 border-[2px] border-black w-fit">Nothing to do!</p>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </Window>
        )}

        {isMounted && !windows.notes.isMinimized && (
          <Window title="Brain Dump" defaultX={Math.min(window.innerWidth - 450, centerPos.x + 350)} defaultY={Math.max(20, centerPos.y - 100)} defaultWidth={400} defaultHeight={400} onMinimize={() => toggleMinimize("notes")}>
            <div className="flex flex-col gap-2 h-full min-h-0">
              <p className="font-bold border-b-[2px] border-black pb-1 text-2xl shrink-0">Scratchpad</p>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 text-xl bg-white border-[2px] border-black outline-none resize-none focus:bg-[#f0f0f0] transition-colors text-black" placeholder="Notes..." />
              <div className="mt-1 flex justify-end shrink-0"><button onClick={handleSaveNote} disabled={isSavingNote} className="bg-black hover:bg-[#a5b4fc] hover:text-black text-white px-6 py-1 text-xl font-bold border-[2px] border-black shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">Save</button></div>
            </div>
          </Window>
        )}

        {isMounted && !windows.calendar.isMinimized && (
          <Window title="Schedule Sync" defaultX={Math.min(window.innerWidth - 500, centerPos.x + 100)} defaultY={centerPos.y + 50} defaultWidth={450} defaultHeight={450} onMinimize={() => toggleMinimize("calendar")}>
            <div className="h-full w-full overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <Calendar tasks={tasks || []} />
            </div>
          </Window>
        )}

        {isMounted && !windows.finances.isMinimized && (
          <Window title="Wallet" defaultX={Math.max(20, centerPos.x - 200)} defaultY={Math.max(20, centerPos.y - 150)} defaultWidth={400} defaultHeight={450} onMinimize={() => toggleMinimize("finances")}>
            <div className="flex flex-col gap-3 h-full min-h-0">
              <div className="bg-white p-3 text-center border-[2px] border-black shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] shrink-0"><p className="text-lg tracking-widest uppercase font-bold text-black">Balance</p><p className="text-4xl font-bold tracking-widest text-black mt-1">{financeData ? `$${financeData.balance.toFixed(2)}` : "..."}</p></div>
              <form onSubmit={handleAddFinance} className="flex gap-2 items-end border-b-[2px] border-black pb-3 mt-2 shrink-0">
                <div className="flex flex-col gap-1 flex-1"><label className="text-sm font-bold uppercase text-black">Entry:</label><input type="text" value={financeTitle} onChange={(e) => setFinanceTitle(e.target.value)} className="w-full p-1 text-md bg-white border-[2px] border-black outline-none focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}/></div>
                <div className="flex flex-col gap-1 w-[80px] shrink-0"><label className="text-sm font-bold uppercase text-black">Amt:</label><input type="number" step="0.01" value={financeAmount} onChange={(e) => setFinanceAmount(e.target.value)} className="w-full p-1 text-md bg-white border-[2px] border-black outline-none focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}/></div>
                <div className="flex flex-col gap-1 w-[80px] shrink-0"><label className="text-sm font-bold uppercase text-black">Type:</label><select value={isIncome ? "income" : "expense"} onChange={(e) => setIsIncome(e.target.value === "income")} className="w-full p-1 text-md bg-white border-[2px] border-black outline-none cursor-pointer focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}><option value="expense">Out</option><option value="income">In</option></select></div>
                <button type="submit" disabled={isSubmittingFinance || !financeTitle.trim() || !financeAmount} className="bg-black text-white hover:bg-[#a5b4fc] hover:text-black px-3 py-1 text-md font-bold border-[2px] border-black shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30 shrink-0">ADD</button>
              </form>
              <ul className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
                {financeData && financeData.transactions.map((t: Transaction) => (
                  <li key={t.id} className="flex justify-between items-center text-md bg-white p-1 border-[2px] border-black group transition-colors shrink-0"><span className="truncate w-[180px] font-bold text-black">{t.title}</span><div className="flex items-center gap-2 shrink-0"><span className={`font-bold ${t.is_income ? "text-black" : "text-black"}`}>{t.is_income ? "+" : "-"}${t.amount.toFixed(2)}</span><button onClick={() => handleDeleteFinance(t.id)} className="text-md text-white bg-black opacity-0 group-hover:opacity-100 font-bold hover:bg-[#ef4444] px-2 border-[2px] border-black">X</button></div></li>
                ))}
              </ul>
            </div>
          </Window>
        )}

        {isMounted && !windows.media.isMinimized && (
          <Rnd default={{ x: Math.max(20, centerPos.x - 300), y: Math.max(20, centerPos.y - 150), width: 340, height: "auto" }} bounds="parent" dragHandleClassName="player-drag-handle" className="z-50 hover:!z-[80]">
            <MusicPlayer onMinimize={() => toggleMinimize("media")} />
          </Rnd>
        )}

      </div>

      {isStartMenuOpen && <div className="fixed inset-0 z-[95]" onClick={() => setIsStartMenuOpen(false)}></div>}

      {isStartMenuOpen && (
        <div className="fixed bottom-[48px] left-0 z-[101] bg-[#dfdfdf] border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex min-h-[350px]">
          <div className="w-10 bg-black flex flex-col justify-end items-center pb-2 border-r-[2px] border-black">
            <span className="text-white font-bold tracking-widest text-2xl whitespace-nowrap -rotate-90 mb-12">ZENITH OS</span>
          </div>
          <div className="flex flex-col flex-1 py-1 min-w-[220px] justify-between">
            <div className="flex flex-col">
              {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
                const win = windows[key];
                return (
                  <button key={key} onClick={() => launchApp(key as keyof typeof windows)} className="flex items-center gap-3 px-4 py-2 hover:bg-[#a5b4fc] transition-colors text-black font-bold text-xl text-left group">
                    <div className="scale-75 origin-left">{win.icon}</div>{win.title}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col border-t-[2px] border-black pt-1 mt-2">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 hover:bg-[#ef4444] hover:text-white transition-colors text-black font-bold text-xl text-left group">
                <div className="scale-75 origin-left"><ColorPixelIcon src="/Power.png" /></div>Shut Down
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full h-12 bg-[#dfdfdf] border-t-[2px] border-black flex items-center px-2 z-[100] justify-between shadow-[0px_-2px_10px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2 overflow-x-auto flex-1 pr-2">
          <button onClick={() => setIsStartMenuOpen(!isStartMenuOpen)} className={`shrink-0 flex items-center gap-2 font-bold text-xl px-3 py-1 border-[2px] border-black transition-all ${isStartMenuOpen ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-white hover:bg-[#a5b4fc] text-black shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'}`}>
            <div className={`w-4 h-4 border ${isStartMenuOpen ? 'bg-white border-black' : 'bg-black border-white'}`}></div>START
          </button>
          <div className="shrink-0 w-[2px] h-8 bg-black mx-1"></div>
          {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
            const win = windows[key];
            if (win.isMinimized) return null;
            return (
              <button key={key} onClick={() => toggleMinimize(key)} className="shrink-0 px-3 py-1 h-9 text-sm font-bold min-w-[120px] max-w-[160px] truncate border-[2px] border-black flex items-center justify-center transition-all bg-white text-black shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] hover:bg-[#a5b4fc]">{win.title}</button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 bg-white border-[2px] border-black flex items-center justify-center hover:bg-[#e2e8f0] transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)] group" title="Toggle Day/Night">
            <img src={isDarkMode ? '/Sleep.png' : '/Sun.png'} alt="theme toggle" className="w-6 h-6 group-hover:scale-125 transition-transform duration-200" style={{ imageRendering: 'pixelated' }} />
          </button>
          {player && (
            <div className="flex items-center gap-2 bg-white border-[2px] border-black px-3 py-1 h-10 shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] cursor-default">
              <span className="text-[12px] font-bold tracking-widest text-black">LVL {player.level}</span>
              <div className="w-16 h-3 bg-[#e2e8f0] border-[1px] border-black p-[1px]"><div className="h-full bg-[#a5b4fc] transition-all duration-500 ease-out" style={{ width: `${player.xp % 100}%` }}></div></div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}