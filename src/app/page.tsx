"use client";

import Image from "next/image";
import useSWR from "swr";
import { useState, useEffect } from "react"; 
import Window from "../components/Window";
import Calendar from "../components/Calendar";
import { createClient } from "@supabase/supabase-js"; 

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  // --- NEW: Boot/Mounting State to calculate perfect center coordinates ---
  const [isMounted, setIsMounted] = useState(false);
  const [centerPos, setCenterPos] = useState({ x: 100, y: 100 });

  const { data: tasks, mutate: mutateTasks } = useSWR("http://localhost:8000/tasks/", fetcher);
  const { data: player, mutate: mutatePlayer } = useSWR("http://localhost:8000/tasks/player", fetcher);
  const { data: note, mutate: mutateNote } = useSWR("http://localhost:8000/notes/", fetcher); 
  const { data: financeData, mutate: mutateFinances } = useSWR("http://localhost:8000/finances/", fetcher);
  
  // THE FIX: Set terminal to true so ONLY Quests boots up open!
  const [windows, setWindows] = useState({
    terminal: { title: "Quest Terminal", isMinimized: true, icon: <ColorPixelIcon src="/Home.png" /> },
    quests: { title: "Active Quests", isMinimized: false, icon: <ColorPixelIcon src="/ChestTreasure.png" /> },
    notes: { title: "Brain Dump", isMinimized: true, icon: <ColorPixelIcon src="/Pencil.png" /> },
    calendar: { title: "Schedule Sync", isMinimized: true, icon: <ColorPixelIcon src="/Cloud.png" /> },
    finances: { title: "Financial Vault", isMinimized: true, icon: <ColorPixelIcon src="/Coin2.png" /> }
  });

  const toggleMinimize = (key: keyof typeof windows) => {
    setWindows(prev => ({ ...prev, [key]: { ...prev[key], isMinimized: !prev[key].isMinimized } }));
  };

  const launchApp = (key: keyof typeof windows) => {
    setWindows(prev => ({ ...prev, [key]: { ...prev[key], isMinimized: false } }));
    setIsStartMenuOpen(false); 
  };

  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("minion"); 
  const [isDaily, setIsDaily] = useState(false);
  const [dueDate, setDueDate] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number, xp: number } | null>(null);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [financeTitle, setFinanceTitle] = useState("");
  const [financeAmount, setFinanceAmount] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [isSubmittingFinance, setIsSubmittingFinance] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (note && noteText === "") setNoteText(note.content || ""); }, [note, noteText]);

  // THE FIX: Calculate true center of screen once on mount
  useEffect(() => {
    setIsMounted(true);
    // 450 is the width of the Active Quests window, 500 is its approx height
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

  const handleAddSubtask = (e: any) => { e.preventDefault(); if (subtaskInput.trim()) { setSubtasks([...subtasks, subtaskInput.trim()]); setSubtaskInput(""); } };
  const handleRemoveSubtask = (index: number) => setSubtasks(subtasks.filter((_, i) => i !== index));
  const handleCreateQuest = async (e: any) => {
    e.preventDefault(); if (!title.trim()) return; setIsSubmitting(true);
    await fetch("http://localhost:8000/tasks/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, difficulty, is_daily: isDaily, due_date: dueDate ? dueDate : null, subtasks: subtasks }) });
    setTitle(""); setDifficulty("minion"); setIsDaily(false); setDueDate(""); setSubtasks([]); mutateTasks(); setIsSubmitting(false);
  };
  const handleToggleSubtask = async (id: number) => { await fetch(`http://localhost:8000/tasks/subtasks/${id}`, { method: "PUT" }); mutateTasks(); };
  const handleCompleteQuest = async (id: string) => {
    const response = await fetch(`http://localhost:8000/tasks/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (data.error) { alert(`SYSTEM WARNING: ${data.error}`); return; }
    if (player && data.new_level > player.level) setLevelUpData({ level: data.new_level, xp: data.new_total_xp });
    mutateTasks(); mutatePlayer(); 
  };
  const handleSaveNote = async () => { setIsSavingNote(true); await fetch("http://localhost:8000/notes/", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: noteText }) }); mutateNote(); setIsSavingNote(false); };
  const handleAddFinance = async (e: any) => {
    e.preventDefault(); if (!financeTitle.trim() || !financeAmount) return; setIsSubmittingFinance(true);
    await fetch("http://localhost:8000/finances/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: financeTitle, amount: parseFloat(financeAmount), is_income: isIncome }) });
    setFinanceTitle(""); setFinanceAmount(""); setIsIncome(false); mutateFinances(); setIsSubmittingFinance(false);
  };
  const handleDeleteFinance = async (id: number) => { await fetch(`http://localhost:8000/finances/${id}`, { method: "DELETE" }); mutateFinances(); };

  if (!session) {
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
            <div className="flex flex-col gap-1"><label className="text-lg font-bold text-black">USER EMAIL:</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#dfdfdf] border-[2px] border-black text-black p-2 outline-none focus:bg-white" required/></div>
            <div className="flex flex-col gap-1"><label className="text-lg font-bold text-black">PASSPHRASE:</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#dfdfdf] border-[2px] border-black text-black p-2 outline-none focus:bg-white" required/></div>
            {authError && <p className="text-red-600 text-lg font-bold">ERROR: {authError}</p>}
            <button type="submit" className="mt-4 border-[2px] border-black bg-[#dfdfdf] text-black p-3 hover:bg-black hover:text-white transition-colors font-bold tracking-widest">BOOT SYSTEM</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden text-black bg-black">
      
      {/* --- DAY/NIGHT PARALLAX ENGINE --- */}
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

      {/* --- PURE DESKTOP ICONS --- */}
      <div className="absolute top-10 left-6 z-30 flex flex-col gap-8 items-center w-[100px]">
        {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
          const win = windows[key];
          return (
            <button 
              key={key} 
              onClick={() => toggleMinimize(key)}
              className={`flex flex-col items-center gap-2 group transition-all ${!win.isMinimized ? 'opacity-40' : 'opacity-100'}`}
            >
              {win.icon}
              <span 
                className="text-[14px] font-bold text-white tracking-wide text-center leading-tight drop-shadow-[0px_4px_4px_rgba(0,0,0,0.5)]"
                style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0px 2px 0 #000' }}
              >
                {win.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* THE DESKTOP WORKSPACE */}
      <div className="relative z-10 w-full h-[calc(100vh-48px)] overflow-hidden">
        
        {/* We only render the windows after the client has measured the screen (isMounted) */}
        {isMounted && !windows.terminal.isMinimized && (
          <Window title="Quest Terminal" defaultX={Math.max(20, centerPos.x - 400)} defaultY={Math.max(20, centerPos.y - 50)} defaultWidth={350} onMinimize={() => toggleMinimize("terminal")}>
            <form onSubmit={handleCreateQuest} className="flex flex-col gap-3 h-full min-h-0">
              <p className="font-bold border-b-[2px] border-black pb-1 text-2xl shrink-0">New Objective</p>
              <div className="flex flex-col gap-1 shrink-0"><label className="text-lg font-bold">Title:</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-1 text-xl border-[2px] border-black bg-white outline-none focus:bg-[#f0f0f0]" /></div>
              <div className="flex flex-col gap-1 shrink-0"><label className="text-lg font-bold">Difficulty:</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full p-1 text-xl border-[2px] border-black bg-white outline-none cursor-pointer focus:bg-[#f0f0f0]"><option value="minion">🟢 Minion</option><option value="elite">🟡 Elite</option><option value="boss">🔴 Boss Battle</option></select></div>
              <div className="flex flex-col gap-1 shrink-0"><label className="text-lg font-bold">Deadline:</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full p-1 text-xl border-[2px] border-black bg-white outline-none disabled:bg-[#dfdfdf] focus:bg-[#f0f0f0]" disabled={isDaily} /></div>
              
              <div className="flex flex-col gap-1 mt-1 border-t-[2px] border-dashed border-black pt-2 flex-1 min-h-0 overflow-hidden">
                <label className="text-lg font-bold shrink-0">Sub-Objectives:</label>
                <div className="flex gap-1 shrink-0"><input type="text" value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} className="flex-1 min-w-0 p-1 text-lg border-[2px] border-black bg-white outline-none focus:bg-[#f0f0f0]" disabled={isDaily}/>
                <button onClick={handleAddSubtask} disabled={isDaily || !subtaskInput.trim()} className="bg-[#5b7c99] hover:bg-black text-[#f9f6e6] px-4 rounded-none text-xl font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30 shrink-0">+</button></div>
                {subtasks.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1 p-1 overflow-y-auto bg-white border-[2px] border-black flex-1 min-h-0">
                    {subtasks.map((st, idx) => (<li key={idx} className="flex justify-between items-center text-xl bg-[#dfdfdf] px-2 py-1 border border-black shrink-0"><span className="truncate mr-2">- {st}</span><button onClick={() => handleRemoveSubtask(idx)} type="button" className="text-black font-bold hover:bg-black hover:text-white px-1">X</button></li>))}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 shrink-0"><input type="checkbox" id="daily-check" checked={isDaily} onChange={(e) => { setIsDaily(e.target.checked); if (e.target.checked) { setDueDate(""); setSubtasks([]); setSubtaskInput(""); } }} className="cursor-pointer w-4 h-4 border-[2px] border-black accent-[#5b7c99] rounded-none" disabled={isSubmitting}/><label htmlFor="daily-check" className="text-lg font-bold cursor-pointer">Register as Daily</label></div>
              <div className="mt-2 flex justify-end shrink-0"><button type="submit" disabled={!title.trim()} className="bg-[#5b7c99] hover:bg-black text-[#f9f6e6] px-6 py-2 text-xl font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30">Add Quest</button></div>
            </form>
          </Window>
        )}

        {isMounted && !windows.notes.isMinimized && (
          <Window title="Brain Dump" defaultX={Math.min(window.innerWidth - 450, centerPos.x + 350)} defaultY={Math.max(20, centerPos.y - 100)} defaultWidth={400} onMinimize={() => toggleMinimize("notes")}>
            <div className="flex flex-col gap-2 h-full min-h-0">
              <p className="font-bold border-b-[2px] border-black pb-1 text-2xl shrink-0">Scratchpad</p>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full flex-1 min-h-[150px] overflow-y-auto p-2 text-xl bg-white border-[2px] border-black outline-none resize-none focus:bg-[#f0f0f0] transition-colors text-black" placeholder="Notes..." />
              <div className="mt-1 flex justify-end shrink-0"><button onClick={handleSaveNote} disabled={isSavingNote} className="bg-[#5b7c99] hover:bg-black text-[#f9f6e6] px-6 py-1 text-xl font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30">Save</button></div>
            </div>
          </Window>
        )}

        {/* THE FIX: Active Quests drops precisely in the dead center of the screen! */}
        {isMounted && !windows.quests.isMinimized && (
          <Window title="Active Quests" defaultX={centerPos.x} defaultY={centerPos.y} defaultWidth={450} defaultHeight={500} onMinimize={() => toggleMinimize("quests")}>
            <div className="flex flex-col gap-2 h-full min-h-0 overflow-hidden">
              <p className="font-bold border-b-[2px] border-black pb-1 text-2xl shrink-0">Core Objectives</p>
              {tasks && tasks.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                  {tasks.map((task: Task) => (
                    <li key={task.id} className="flex flex-col gap-2 bg-white p-2 border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
                      <div className="flex items-start gap-3 group">
                        <button onClick={() => handleCompleteQuest(task.id)} className="w-6 h-6 mt-[2px] shrink-0 bg-[#dfdfdf] border-[2px] border-black hover:bg-[#5b7c99] transition-colors"></button>
                        <div className="flex flex-col leading-tight w-full min-w-0">
                          <span className="text-2xl font-bold text-black break-words">{task.title} {task.is_daily && <span className="ml-2 text-lg bg-[#5b7c99] text-[#f9f6e6] px-1 font-bold inline-block">DAILY</span>} {task.due_date && <span className="ml-2 text-lg bg-white text-black border-[2px] border-black px-1 font-bold inline-block">DUE: {task.due_date}</span>}</span>
                          <span className="text-lg font-bold text-black mt-1 border-t-[2px] border-black border-dashed pt-1 w-fit">REWARD: {task.xp_reward} XP</span>
                        </div>
                      </div>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="ml-8 pl-2 border-l-[2px] border-black flex flex-col gap-1.5 mt-2">
                          {task.subtasks.map((sub) => (<div key={sub.id} className="flex items-center gap-3"><input type="checkbox" checked={sub.is_completed} onChange={() => handleToggleSubtask(sub.id)} className="cursor-pointer w-4 h-4 accent-[#5b7c99] border-[2px] border-black shrink-0"/><span className={`text-xl font-bold break-words ${sub.is_completed ? 'line-through opacity-40 text-black' : 'text-black'}`}>{sub.title}</span></div>))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (<p className="text-xl py-4 opacity-50 text-center font-bold shrink-0">Clear.</p>)}
            </div>
          </Window>
        )}

        {isMounted && !windows.calendar.isMinimized && (
          <Window title="Schedule Sync" defaultX={Math.min(window.innerWidth - 500, centerPos.x + 100)} defaultY={centerPos.y + 50} defaultWidth={450} onMinimize={() => toggleMinimize("calendar")}>
            <div className="h-full overflow-auto flex-1 min-h-0">
              <Calendar tasks={tasks || []} />
            </div>
          </Window>
        )}

        {isMounted && !windows.finances.isMinimized && (
          <Window title="Financial Vault" defaultX={Math.max(20, centerPos.x - 200)} defaultY={Math.max(20, centerPos.y - 150)} defaultWidth={400} onMinimize={() => toggleMinimize("finances")}>
            <div className="flex flex-col gap-3 h-full min-h-0">
              <div className="bg-white p-3 text-center border-[2px] border-black shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)] shrink-0"><p className="text-lg tracking-widest uppercase font-bold text-black">Balance</p><p className="text-4xl font-bold tracking-widest text-black mt-1">{financeData ? `$${financeData.balance.toFixed(2)}` : "..."}</p></div>
              <form onSubmit={handleAddFinance} className="flex gap-2 items-end border-b-[2px] border-black pb-3 mt-2 shrink-0">
                <div className="flex flex-col gap-1 flex-1"><label className="text-lg font-bold text-black">Entry:</label><input type="text" value={financeTitle} onChange={(e) => setFinanceTitle(e.target.value)} className="w-full p-1 text-xl bg-white border-[2px] border-black outline-none focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}/></div>
                <div className="flex flex-col gap-1 w-[90px] shrink-0"><label className="text-lg font-bold text-black">Amt:</label><input type="number" step="0.01" value={financeAmount} onChange={(e) => setFinanceAmount(e.target.value)} className="w-full p-1 text-xl bg-white border-[2px] border-black outline-none focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}/></div>
                <div className="flex flex-col gap-1 w-[90px] shrink-0"><label className="text-lg font-bold text-black">Type:</label><select value={isIncome ? "income" : "expense"} onChange={(e) => setIsIncome(e.target.value === "income")} className="w-full p-1 text-xl bg-white border-[2px] border-black outline-none cursor-pointer focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}><option value="expense">Out</option><option value="income">In</option></select></div>
                <button type="submit" disabled={isSubmittingFinance || !financeTitle.trim() || !financeAmount} className="bg-[#dfdfdf] hover:bg-black hover:text-white text-black px-4 py-1 text-lg font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30 shrink-0">ADD</button>
              </form>
              <ul className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1 min-h-0">
                {financeData && financeData.transactions.map((t: Transaction) => (
                  <li key={t.id} className="flex justify-between items-center text-xl bg-white p-1 border-[2px] border-black group transition-colors shrink-0"><span className="truncate w-[180px] font-bold text-black">{t.title}</span><div className="flex items-center gap-2 shrink-0"><span className={`font-bold ${t.is_income ? "text-black" : "text-black"}`}>{t.is_income ? "+" : "-"}${t.amount.toFixed(2)}</span><button onClick={() => handleDeleteFinance(t.id)} className="text-xl text-white bg-black opacity-0 group-hover:opacity-100 font-bold hover:bg-white hover:text-black px-2 border-[2px] border-black">X</button></div></li>
                ))}
              </ul>
            </div>
          </Window>
        )}
      </div>

      {/* --- START MENU OVERLAY --- */}
      {isStartMenuOpen && (
        <div 
          className="fixed inset-0 z-[95]" 
          onClick={() => setIsStartMenuOpen(false)}
        ></div>
      )}

      {/* --- THE START MENU --- */}
      {isStartMenuOpen && (
        <div className="fixed bottom-[48px] left-0 z-[101] bg-[#dfdfdf] border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex min-h-[350px]">
          
          <div className="w-10 bg-[#5b7c99] flex flex-col justify-end items-center pb-2 border-r-[2px] border-black">
            <span className="text-white font-bold tracking-widest text-2xl drop-shadow-[1px_1px_0px_rgba(0,0,0,0.8)] whitespace-nowrap -rotate-90 mb-12">
              ZENITH OS
            </span>
          </div>

          <div className="flex flex-col flex-1 py-1 min-w-[220px] justify-between">
            <div className="flex flex-col">
              {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
                const win = windows[key];
                return (
                  <button 
                    key={key} 
                    onClick={() => launchApp(key as keyof typeof windows)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-black hover:text-white transition-colors text-black font-bold text-xl text-left group"
                  >
                    <div className="scale-75 origin-left">{win.icon}</div>
                    {win.title}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col border-t-[2px] border-black pt-1 mt-2">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#5b7c99] hover:text-white transition-colors text-black font-bold text-xl text-left group"
              >
                <div className="scale-75 origin-left">
                  <ColorPixelIcon src="/Power.png" />
                </div>
                Shut Down...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TASKBAR UPGRADE: System Tray & Start Toggle --- */}
      <div className="fixed bottom-0 left-0 w-full h-12 bg-[#dfdfdf] border-t-[2px] border-black flex items-center px-2 z-[100] justify-between shadow-[0px_-2px_10px_rgba(0,0,0,0.2)]">
        
        <div className="flex items-center gap-2 overflow-x-auto flex-1 pr-2">
          <button 
            onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
            className={`shrink-0 flex items-center gap-2 font-bold text-2xl px-3 py-1 border-[2px] border-black transition-all
              ${isStartMenuOpen 
                ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]' 
                : 'bg-white hover:bg-[#5b7c99] hover:text-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
              }`}
          >
            <div className={`w-4 h-4 border ${isStartMenuOpen ? 'bg-white border-black' : 'bg-black border-white'}`}></div>
            START
          </button>
          
          <div className="shrink-0 w-[2px] h-8 bg-black mx-1"></div>

          {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
            const win = windows[key];
            if (win.isMinimized) return null;

            return (
              <button 
                key={key}
                onClick={() => toggleMinimize(key)}
                className="shrink-0 px-3 py-1 h-9 text-xl font-bold min-w-[120px] max-w-[160px] truncate border-[2px] border-black flex items-center justify-center transition-all bg-[#5b7c99] text-white shadow-none translate-x-[2px] translate-y-[2px]"
              >
                {win.title}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 bg-white border-[2px] border-black flex items-center justify-center hover:bg-[#dfdfdf] transition-colors shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)] group"
            title="Toggle Day/Night"
          >
            <img 
              src={isDarkMode ? '/Sleep.png' : '/Sun.png'} 
              alt="theme toggle" 
              className="w-6 h-6 group-hover:scale-125 transition-transform duration-200" 
              style={{ imageRendering: 'pixelated' }} 
            />
          </button>

          {player && (
            <div className="flex items-center gap-2 bg-white border-[2px] border-black px-3 py-1 h-10 shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)] cursor-default">
              <span className="text-[16px] font-bold tracking-widest text-[#5b7c99]">LVL {player.level}</span>
              <div className="w-24 h-3 bg-[#dfdfdf] border-[1px] border-black p-[1px]"><div className="h-full bg-[#5b7c99] transition-all duration-500 ease-out" style={{ width: `${player.xp % 100}%` }}></div></div>
              <span className="text-[14px] font-bold text-black">{player.xp} XP</span>
            </div>
          )}
        </div>
      </div>

    </main>
  );
}