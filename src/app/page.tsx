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

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { data: tasks, mutate: mutateTasks } = useSWR("http://localhost:8000/tasks/", fetcher);
  const { data: player, mutate: mutatePlayer } = useSWR("http://localhost:8000/tasks/player", fetcher);
  const { data: note, mutate: mutateNote } = useSWR("http://localhost:8000/notes/", fetcher); 
  const { data: financeData, mutate: mutateFinances } = useSWR("http://localhost:8000/finances/", fetcher);
  
  const [windows, setWindows] = useState({
    terminal: { title: "Quest Terminal", isMinimized: false, icon: "🎮" },
    quests: { title: "Active Quests", isMinimized: false, icon: "📋" },
    notes: { title: "Brain Dump", isMinimized: true, icon: "💭" },
    calendar: { title: "Schedule Sync", isMinimized: true, icon: "📅" },
    finances: { title: "Financial Vault", isMinimized: true, icon: "💎" }
  });

  const toggleMinimize = (key: keyof typeof windows) => {
    setWindows(prev => ({ ...prev, [key]: { ...prev[key], isMinimized: !prev[key].isMinimized } }));
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoggingIn(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setIsLoggingIn(false);
  };

  const handleLogout = async () => await supabase.auth.signOut();
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
      <main className="w-screen h-screen bg-[#dfdfdf] text-black text-xl flex flex-col items-center justify-center p-4" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #dfdfdf 25%, transparent 25%, transparent 75%, #dfdfdf 75%, #dfdfdf), repeating-linear-gradient(45deg, #dfdfdf 25%, #d0d0d0 25%, #d0d0d0 75%, #dfdfdf 75%, #dfdfdf)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}>
        <div className="w-[400px] border-[2px] border-black p-8 bg-white relative overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]">
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
      
      {/* PURE SKY BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image src="/sky.png" alt="Zenith OS Background" fill className="object-cover" priority />
      </div>

      <div className="absolute top-4 right-8 z-40">
        <button onClick={handleLogout} className="bg-white hover:bg-[#5b7c99] hover:text-white px-4 py-1 text-lg font-bold tracking-widest border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all">[ LOG OUT ]</button>
      </div>

      {/* SIDEBAR DESKTOP ICONS */}
      <div className="absolute top-10 left-6 z-30 flex flex-col gap-6 items-center">
        {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
          const win = windows[key];
          return (
            <button 
              key={key} 
              onClick={() => toggleMinimize(key)}
              className={`flex flex-col items-center gap-1 group transition-all ${!win.isMinimized ? 'opacity-50' : 'opacity-100 hover:scale-110'}`}
            >
              <div className={`w-14 h-14 bg-[#dfdfdf] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center text-3xl group-hover:bg-[#5b7c99] group-active:shadow-none group-active:translate-x-[3px] group-active:translate-y-[3px]`}>
                {win.icon}
              </div>
              <span className="text-[14px] font-bold text-black bg-white px-1 border-[2px] border-black">{win.title}</span>
            </button>
          )
        })}
      </div>

      {/* THE DESKTOP WORKSPACE */}
      <div className="relative z-10 w-full h-full p-8 flex justify-center items-start pt-32 gap-6">
        
        {/* COLUMN 1 */}
        <div className="flex flex-col gap-6 w-[350px]">
          {!windows.terminal.isMinimized && (
            <Window title="Quest Terminal" width="w-full" onMinimize={() => toggleMinimize("terminal")}>
              <form onSubmit={handleCreateQuest} className="flex flex-col gap-3">
                <p className="font-bold border-b-[2px] border-black pb-1 text-2xl">New Objective</p>
                <div className="flex flex-col gap-1"><label className="text-lg font-bold">Title:</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="p-1 text-xl border-[2px] border-black bg-white outline-none focus:bg-[#f0f0f0]" /></div>
                <div className="flex flex-col gap-1"><label className="text-lg font-bold">Difficulty:</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="p-1 text-xl border-[2px] border-black bg-white outline-none cursor-pointer focus:bg-[#f0f0f0]"><option value="minion">🟢 Minion</option><option value="elite">🟡 Elite</option><option value="boss">🔴 Boss Battle</option></select></div>
                <div className="flex flex-col gap-1"><label className="text-lg font-bold">Deadline:</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="p-1 text-xl border-[2px] border-black bg-white outline-none disabled:bg-[#dfdfdf] focus:bg-[#f0f0f0]" disabled={isDaily} /></div>
                
                <div className="flex flex-col gap-1 mt-1 border-t-[2px] border-dashed border-black pt-2">
                  <label className="text-lg font-bold">Sub-Objectives:</label>
                  <div className="flex gap-1"><input type="text" value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} className="flex-1 p-1 text-lg border-[2px] border-black bg-white outline-none focus:bg-[#f0f0f0]" disabled={isDaily}/>
                  <button onClick={handleAddSubtask} disabled={isDaily || !subtaskInput.trim()} className="bg-[#5b7c99] hover:bg-black text-[#f9f6e6] px-4 rounded-none text-xl font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30">+</button></div>
                  {subtasks.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1 p-1 max-h-[100px] overflow-y-auto bg-white border-[2px] border-black">
                      {subtasks.map((st, idx) => (<li key={idx} className="flex justify-between items-center text-xl bg-[#dfdfdf] px-2 py-1 border border-black"><span className="truncate mr-2">- {st}</span><button onClick={() => handleRemoveSubtask(idx)} type="button" className="text-black font-bold hover:bg-black hover:text-white px-1">X</button></li>))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2"><input type="checkbox" id="daily-check" checked={isDaily} onChange={(e) => { setIsDaily(e.target.checked); if (e.target.checked) { setDueDate(""); setSubtasks([]); setSubtaskInput(""); } }} className="cursor-pointer w-4 h-4 border-[2px] border-black accent-[#5b7c99] rounded-none" disabled={isSubmitting}/><label htmlFor="daily-check" className="text-lg font-bold cursor-pointer">Register as Daily</label></div>
                <div className="mt-2 flex justify-end"><button type="submit" disabled={!title.trim()} className="bg-[#5b7c99] hover:bg-black text-[#f9f6e6] px-6 py-2 text-xl font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30">Add Quest</button></div>
              </form>
            </Window>
          )}

          {!windows.notes.isMinimized && (
            <Window title="Brain Dump" width="w-full" onMinimize={() => toggleMinimize("notes")}>
              <div className="flex flex-col gap-2">
                <p className="font-bold border-b-[2px] border-black pb-1 text-2xl">Scratchpad</p>
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full h-[150px] p-2 text-xl bg-white border-[2px] border-black outline-none resize-none focus:bg-[#f0f0f0] transition-colors text-black" placeholder="Notes..." />
                <div className="mt-1 flex justify-end"><button onClick={handleSaveNote} disabled={isSavingNote} className="bg-[#5b7c99] hover:bg-black text-[#f9f6e6] px-6 py-1 text-xl font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30">Save</button></div>
              </div>
            </Window>
          )}
        </div>

        {/* COLUMN 2 */}
        {!windows.quests.isMinimized && (
          <Window title="Active Quests" width="w-[450px]" onMinimize={() => toggleMinimize("quests")}>
            <div className="flex flex-col gap-2 pr-1">
              <p className="font-bold border-b-[2px] border-black pb-1 text-2xl">Core Objectives</p>
              {tasks && tasks.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pr-3">
                  {tasks.map((task: Task) => (
                    <li key={task.id} className="flex flex-col gap-2 bg-white p-2 border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-start gap-3 group">
                        <button onClick={() => handleCompleteQuest(task.id)} className="w-6 h-6 mt-[2px] shrink-0 bg-[#dfdfdf] border-[2px] border-black hover:bg-[#5b7c99] transition-colors"></button>
                        <div className="flex flex-col leading-tight w-full">
                          <span className="text-2xl font-bold text-black">{task.title} {task.is_daily && <span className="ml-2 text-lg bg-[#5b7c99] text-[#f9f6e6] px-1 font-bold">DAILY</span>} {task.due_date && <span className="ml-2 text-lg bg-white text-black border-[2px] border-black px-1 font-bold">DUE: {task.due_date}</span>}</span>
                          <span className="text-lg font-bold text-black mt-1 border-t-[2px] border-black border-dashed pt-1 w-fit">REWARD: {task.xp_reward} XP</span>
                        </div>
                      </div>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="ml-8 pl-2 border-l-[2px] border-black flex flex-col gap-1.5 mt-2">
                          {task.subtasks.map((sub) => (<div key={sub.id} className="flex items-center gap-3"><input type="checkbox" checked={sub.is_completed} onChange={() => handleToggleSubtask(sub.id)} className="cursor-pointer w-4 h-4 accent-[#5b7c99] border-[2px] border-black"/><span className={`text-xl font-bold ${sub.is_completed ? 'line-through opacity-40 text-black' : 'text-black'}`}>{sub.title}</span></div>))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (<p className="text-xl py-4 opacity-50 text-center font-bold">Clear.</p>)}
            </div>
          </Window>
        )}

        {/* COLUMN 3 */}
        <div className="flex flex-col gap-6 w-[450px]">
          {!windows.calendar.isMinimized && (
            <Window title="Schedule Sync" width="w-full" onMinimize={() => toggleMinimize("calendar")}>
              <Calendar tasks={tasks || []} />
            </Window>
          )}

          {!windows.finances.isMinimized && (
            <Window title="Financial Vault" width="w-full" onMinimize={() => toggleMinimize("finances")}>
              <div className="flex flex-col gap-3">
                <div className="bg-white p-3 text-center border-[2px] border-black shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)]"><p className="text-lg tracking-widest uppercase font-bold text-black">Balance</p><p className="text-4xl font-bold tracking-widest text-black mt-1">{financeData ? `$${financeData.balance.toFixed(2)}` : "..."}</p></div>
                <form onSubmit={handleAddFinance} className="flex gap-2 items-end border-b-[2px] border-black pb-3 mt-2">
                  <div className="flex flex-col gap-1 flex-1"><label className="text-lg font-bold text-black">Entry:</label><input type="text" value={financeTitle} onChange={(e) => setFinanceTitle(e.target.value)} className="p-1 text-xl bg-white border-[2px] border-black outline-none focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}/></div>
                  <div className="flex flex-col gap-1 w-[90px]"><label className="text-lg font-bold text-black">Amt:</label><input type="number" step="0.01" value={financeAmount} onChange={(e) => setFinanceAmount(e.target.value)} className="p-1 text-xl bg-white border-[2px] border-black outline-none focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}/></div>
                  <div className="flex flex-col gap-1 w-[90px]"><label className="text-lg font-bold text-black">Type:</label><select value={isIncome ? "income" : "expense"} onChange={(e) => setIsIncome(e.target.value === "income")} className="p-1 text-xl bg-white border-[2px] border-black outline-none cursor-pointer focus:bg-[#f0f0f0] text-black" disabled={isSubmittingFinance}><option value="expense">Out</option><option value="income">In</option></select></div>
                  <button type="submit" disabled={isSubmittingFinance || !financeTitle.trim() || !financeAmount} className="bg-[#dfdfdf] hover:bg-black hover:text-white text-black px-4 py-1 text-lg font-bold border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30">ADD</button>
                </form>
                <ul className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1">
                  {financeData && financeData.transactions.map((t: Transaction) => (
                    <li key={t.id} className="flex justify-between items-center text-xl bg-white p-1 border-[2px] border-black group transition-colors"><span className="truncate w-[180px] font-bold text-black">{t.title}</span><div className="flex items-center gap-2"><span className={`font-bold ${t.is_income ? "text-black" : "text-black"}`}>{t.is_income ? "+" : "-"}${t.amount.toFixed(2)}</span><button onClick={() => handleDeleteFinance(t.id)} className="text-xl text-white bg-black opacity-0 group-hover:opacity-100 font-bold hover:bg-white hover:text-black px-2 border-[2px] border-black">X</button></div></li>
                  ))}
                </ul>
              </div>
            </Window>
          )}
        </div>
      </div>

      {/* --- TASKBAR UPGRADE: System Tray replaces the floating HUD --- */}
      <div className="fixed bottom-0 left-0 w-full h-12 bg-[#dfdfdf] border-t-[2px] border-black flex items-center px-2 z-[100] justify-between">
        
        {/* LEFT SIDE: Start Button & Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1 pr-2">
          <button className="shrink-0 flex items-center gap-2 font-bold text-2xl px-3 py-1 bg-white hover:bg-[#5b7c99] hover:text-white text-black border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
            <div className="w-4 h-4 bg-black border border-white"></div>
            START
          </button>
          
          <div className="shrink-0 w-[2px] h-8 bg-black mx-1"></div>

          {(Object.keys(windows) as Array<keyof typeof windows>).map((key) => {
            const win = windows[key];
            return (
              <button 
                key={key}
                onClick={() => toggleMinimize(key)}
                className={`shrink-0 px-3 py-1 h-9 text-xl font-bold min-w-[120px] max-w-[160px] truncate border-[2px] border-black flex items-center justify-center transition-all
                  ${!win.isMinimized 
                    ? 'bg-[#5b7c99] text-white shadow-none translate-x-[2px] translate-y-[2px]' 
                    : 'bg-white text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-[#dfdfdf]' 
                  }
                `}
              >
                {win.title}
              </button>
            )
          })}
        </div>

        {/* RIGHT SIDE: System Tray (Player Level) */}
        {player && (
          <div className="shrink-0 flex items-center gap-2 bg-white border-[2px] border-black px-3 py-1 h-9 shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)]">
            <span className="text-[16px] font-bold tracking-widest text-[#5b7c99]">LVL {player.level}</span>
            <div className="w-24 h-3 bg-[#dfdfdf] border-[1px] border-black p-[1px]"><div className="h-full bg-[#5b7c99] transition-all duration-500 ease-out" style={{ width: `${player.xp % 100}%` }}></div></div>
            <span className="text-[14px] font-bold text-black">{player.xp} XP</span>
          </div>
        )}
      </div>

    </main>
  );
}