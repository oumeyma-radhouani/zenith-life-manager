"use client";

import Image from "next/image";
import useSWR from "swr";
import { useState, useEffect } from "react"; 
import Window from "../components/Window";
import Calendar from "../components/Calendar";
import { createClient } from "@supabase/supabase-js"; // <-- NEW: Security Tool

// --- SYSTEM SECURITY KEYS (NOW SECURED!) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TYPESCRIPT BLUEPRINTS ---
interface Subtask { id: number; title: string; is_completed: boolean; }
interface Task { id: string; title: string; xp_reward: number; is_daily: boolean; due_date: string | null; subtasks?: Subtask[]; }
interface Transaction { id: number; title: string; amount: number; is_income: boolean; }

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  // --- AUTHENTICATION STATE ---
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { data: tasks, error, isLoading, mutate: mutateTasks } = useSWR("http://localhost:8000/tasks/", fetcher);
  const { data: player, mutate: mutatePlayer } = useSWR("http://localhost:8000/tasks/player", fetcher);
  const { data: note, mutate: mutateNote } = useSWR("http://localhost:8000/notes/", fetcher); 
  const { data: financeData, mutate: mutateFinances } = useSWR("http://localhost:8000/finances/", fetcher);
  
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

  // --- AUTHENTICATION LISTENER ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (note && noteText === "") setNoteText(note.content || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  // --- LOGIN FUNCTION ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) setAuthError(error.message);
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- SYSTEM LOGIC (TASKS, NOTES, FINANCES) ---
  const handleAddSubtask = (e: React.MouseEvent) => {
    e.preventDefault();
    if (subtaskInput.trim()) { setSubtasks([...subtasks, subtaskInput.trim()]); setSubtaskInput(""); }
  };

  const handleRemoveSubtask = (index: number) => { setSubtasks(subtasks.filter((_, i) => i !== index)); };

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    await fetch("http://localhost:8000/tasks/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, difficulty, is_daily: isDaily, due_date: dueDate ? dueDate : null, subtasks: subtasks }),
    });
    setTitle(""); setDifficulty("minion"); setIsDaily(false); setDueDate(""); setSubtasks([]); 
    mutateTasks(); setIsSubmitting(false);
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    await fetch(`http://localhost:8000/tasks/subtasks/${subtaskId}`, { method: "PUT" }); mutateTasks(); 
  };

  const handleCompleteQuest = async (id: string) => {
    const response = await fetch(`http://localhost:8000/tasks/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (data.error) { alert(`SYSTEM WARNING: ${data.error}`); return; }
    if (player && data.new_level > player.level) { setLevelUpData({ level: data.new_level, xp: data.new_total_xp }); }
    mutateTasks(); mutatePlayer(); 
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    await fetch("http://localhost:8000/notes/", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: noteText }) });
    mutateNote(); setIsSavingNote(false);
  };

  const handleAddFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeTitle.trim() || !financeAmount) return;
    setIsSubmittingFinance(true);
    await fetch("http://localhost:8000/finances/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: financeTitle, amount: parseFloat(financeAmount), is_income: isIncome }),
    });
    setFinanceTitle(""); setFinanceAmount(""); setIsIncome(false); mutateFinances(); setIsSubmittingFinance(false);
  };

  const handleDeleteFinance = async (id: number) => {
    await fetch(`http://localhost:8000/finances/${id}`, { method: "DELETE" }); mutateFinances();
  };

  // ==========================================
  // VIEW 1: THE LOGIN TERMINAL
  // ==========================================
  if (!session) {
    return (
      <main className="w-screen h-screen bg-black text-[#00ff00] font-mono flex flex-col items-center justify-center p-4">
        <div className="w-[400px] border-2 border-[#00ff00] p-8 shadow-[0_0_20px_rgba(0,255,0,0.3)] bg-black/90 relative overflow-hidden">
          {/* Retro scanline effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20"></div>
          
          <h1 className="text-3xl font-bold mb-2 tracking-widest text-center animate-pulse">ZENITH OS</h1>
          <p className="text-[10px] mb-8 text-center border-b border-[#00ff00] pb-2 tracking-widest uppercase">Unauthorized Access Prohibited</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-wider">IDENTIFICATION (EMAIL):</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black border border-[#00ff00] text-[#00ff00] p-2 outline-none focus:bg-[#002200] focus:shadow-[0_0_10px_#00ff00] transition-all"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-wider">SECURITY PASSPHRASE:</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border border-[#00ff00] text-[#00ff00] p-2 outline-none focus:bg-[#002200] focus:shadow-[0_0_10px_#00ff00] transition-all"
                required
              />
            </div>
            
            {authError && <p className="text-red-500 text-[11px] mt-1 font-bold animate-pulse">ERROR: {authError}</p>}
            
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="mt-4 border-2 border-[#00ff00] p-3 hover:bg-[#00ff00] hover:text-black transition-colors font-bold tracking-widest disabled:opacity-50"
            >
              {isLoggingIn ? "VERIFYING CREDENTIALS..." : "INITIALIZE LOGIN"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: THE SECURE DESKTOP
  // ==========================================
  return (
    <main className="relative w-screen h-screen overflow-x-hidden overflow-y-auto pb-10 text-black">
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image src="/sky.png" alt="Zenith OS Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
      </div>

      {/* --- NEW: SYSTEM LOGOUT BUTTON --- */}
      <div className="absolute top-4 right-8 z-50">
        <button 
          onClick={handleLogout}
          className="bg-[#c0c0c0] px-4 py-1 text-[11px] font-bold tracking-widest border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] shadow-[2px_2px_5px_rgba(0,0,0,0.5)]"
        >
          [ SYSTEM LOGOUT ]
        </button>
      </div>

      {levelUpData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="animate-bounce">
            <Window title="SYSTEM OVERRIDE" width="w-[350px]">
              <div className="flex flex-col items-center gap-4 p-4 text-center bg-[#c0c0c0]">
                <h2 className="text-2xl font-bold tracking-widest text-[#000080]">LEVEL UP!</h2>
                <div className="bg-white border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 p-4 w-full">
                  <p className="text-[14px]">You have reached <span className="font-bold text-green-600">Level {levelUpData.level}</span>.</p>
                  <p className="text-[12px] text-[#808080] mt-1">Total XP: {levelUpData.xp}</p>
                </div>
                <button 
                  onClick={() => setLevelUpData(null)}
                  className="mt-2 bg-[#c0c0c0] px-8 py-2 font-bold text-[14px] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[3px] active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] active:pt-[9px] active:pl-[9px] active:pb-[7px] active:pr-[7px]"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </Window>
          </div>
        </div>
      )}

      {player && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[600px] bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[3px] p-2 flex flex-col gap-1 z-20 shadow-[4px_4px_10px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-end font-bold text-sm px-1">
            <span className="tracking-widest">PLAYER LEVEL {player.level}</span>
            <span className="text-[11px] text-[#000080]">{player.xp} TOTAL XP</span>
          </div>
          <div className="w-full h-6 bg-[#000000] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-[2px] p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-[#000080] to-[#1084d0] transition-all duration-500 ease-out"
              style={{ width: `${player.xp % 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* The Desktop Layout */}
      <div className="relative z-10 w-full p-8 flex justify-center items-start pt-32 gap-6 flex-wrap max-w-[1400px] mx-auto">
        
        {/* COLUMN 1: Inputs & Memory */}
        <div className="flex flex-col gap-6 w-[320px]">
          
          <Window title="Quest Terminal" width="w-full">
            <form onSubmit={handleCreateQuest} className="flex flex-col gap-3">
              <p className="font-bold border-b border-[#808080] pb-1">Register New Quest</p>
              
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold">Quest Title:</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-1 text-[13px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 bg-white outline-none focus:bg-blue-50"
                  placeholder="e.g. App Presentation"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold">Difficulty Level:</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="p-1 text-[13px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 bg-white outline-none cursor-pointer focus:bg-blue-50"
                  disabled={isSubmitting}
                >
                  <option value="minion">🟢 Minion (10 XP)</option>
                  <option value="elite">🟡 Elite (30 XP)</option>
                  <option value="boss">🔴 Boss Battle (100 XP)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#808080] group-[&:not(:disabled)]:text-black">
                  Deadline (Optional):
                </label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="p-1 text-[13px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 bg-white outline-none focus:bg-blue-50 disabled:bg-[#e0e0e0] disabled:cursor-not-allowed"
                  disabled={isSubmitting || isDaily} 
                />
              </div>

              <div className="flex flex-col gap-1 mt-1 border-t border-dashed border-[#808080] pt-2">
                <label className="text-[12px] font-bold">Sub-Objectives (Optional):</label>
                <div className="flex gap-1">
                  <input 
                    type="text" 
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    className="flex-1 p-1 text-[12px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 bg-white outline-none"
                    placeholder="e.g. Write slide deck"
                    disabled={isSubmitting || isDaily}
                  />
                  <button 
                    onClick={handleAddSubtask}
                    disabled={isSubmitting || isDaily || !subtaskInput.trim()}
                    className="bg-[#c0c0c0] px-2 text-[12px] font-bold border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                {subtasks.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-1 bg-white border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 p-1 max-h-[80px] overflow-y-auto">
                    {subtasks.map((st, idx) => (
                      <li key={idx} className="flex justify-between items-center text-[11px] bg-blue-50 px-1 border border-blue-200">
                        <span className="truncate mr-2">- {st}</span>
                        <button onClick={() => handleRemoveSubtask(idx)} type="button" className="text-red-600 font-bold hover:bg-red-200 px-1">X</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="daily-check"
                  checked={isDaily}
                  onChange={(e) => {
                    setIsDaily(e.target.checked);
                    if (e.target.checked) {
                      setDueDate(""); 
                      setSubtasks([]);
                      setSubtaskInput("");
                    }
                  }}
                  className="cursor-pointer border-2 border-black"
                  disabled={isSubmitting}
                />
                <label htmlFor="daily-check" className="text-[12px] font-bold cursor-pointer">
                  Register as Daily Habit
                </label>
              </div>

              <div className="mt-2 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="bg-[#c0c0c0] px-4 py-1 text-[13px] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] active:pt-[5px] active:pl-[5px] active:pb-[3px] active:pr-[3px] disabled:opacity-50 disabled:active:border-t-[#ffffff] disabled:active:border-l-[#ffffff]"
                >
                  {isSubmitting ? "Transmitting..." : "Add Quest"}
                </button>
              </div>
            </form>
          </Window>

          <Window title="Brain Dump" width="w-full">
            <div className="flex flex-col gap-2">
              <p className="font-bold border-b border-[#808080] pb-1">System Scratchpad</p>
              <textarea 
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full h-[150px] p-2 text-[13px] bg-[#ffffe0] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 outline-none resize-none focus:bg-[#fffacd]"
                placeholder="Jot down random thoughts, code syntax, or grocery lists here..."
              />
              <div className="mt-1 flex justify-end">
                <button 
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="bg-[#c0c0c0] px-4 py-1 text-[13px] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] active:pt-[5px] active:pl-[5px] active:pb-[3px] active:pr-[3px] disabled:opacity-50 disabled:active:border-t-[#ffffff] disabled:active:border-l-[#ffffff]"
                >
                  {isSavingNote ? "Writing to Vault..." : "Save Note"}
                </button>
              </div>
            </div>
          </Window>

        </div>

        {/* COLUMN 2: The Present */}
        <Window title="Active Quests" width="w-[400px]">
          <div className="flex flex-col gap-2">
            <p className="font-bold border-b border-[#808080] pb-1">Current Objectives</p>
            
            {isLoading && <p className="text-[13px] italic">Accessing vault...</p>}
            {error && <p className="text-[13px] text-red-600 font-bold">CRITICAL ERROR</p>}
            
            {tasks && tasks.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
                {tasks.map((task: Task) => (
                  <li key={task.id} className="flex flex-col gap-1 border-b border-dashed border-[#c0c0c0] pb-2 last:border-0">
                    <div className="flex items-start gap-2 group">
                      <button 
                        onClick={() => handleCompleteQuest(task.id)}
                        className="w-4 h-4 mt-[2px] shrink-0 bg-white border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 flex items-center justify-center hover:bg-green-200 active:bg-green-400 active:border-t-[#000000] active:border-l-[#000000]"
                        title="Complete Quest"
                      ></button>
                      
                      <div className="flex flex-col leading-tight w-full">
                        <span>
                          {task.title} 
                          {task.is_daily && <span className="ml-2 text-[10px] bg-[#000080] text-white px-1 py-[1px] tracking-wider font-bold">DAILY</span>}
                          {task.due_date && <span className="ml-2 text-[10px] bg-red-600 text-white px-1 py-[1px] tracking-wider font-bold">DUE: {task.due_date}</span>}
                        </span>
                        <span className="text-[11px] text-[#808080] font-bold">REWARD: {task.xp_reward} XP</span>
                      </div>
                    </div>

                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="ml-6 pl-2 border-l-2 border-[#808080] flex flex-col gap-1 mt-1">
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={sub.is_completed}
                              onChange={() => handleToggleSubtask(sub.id)}
                              className="cursor-pointer border border-[#808080]"
                            />
                            <span className={`text-[12px] ${sub.is_completed ? 'line-through text-[#808080]' : 'text-black'}`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              !isLoading && <p className="text-[13px]">No active quests.</p>
            )}
          </div>
        </Window>

        {/* COLUMN 3: The Future & Finances */}
        <div className="flex flex-col gap-6 w-[500px]">
          
          <Window title="Schedule Sync" width="w-full">
            <Calendar tasks={tasks || []} />
          </Window>

          <Window title="Financial Vault" width="w-full">
            <div className="flex flex-col gap-3">
              <div className="bg-black text-[#00ff00] p-3 text-center border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2">
                <p className="text-[10px] text-[#00cc00] tracking-widest uppercase">Current Balance</p>
                <p className="text-3xl font-bold tracking-widest">
                  {financeData ? `$${financeData.balance.toFixed(2)}` : "LOADING..."}
                </p>
              </div>

              <form onSubmit={handleAddFinance} className="flex gap-2 items-end border-b border-[#808080] pb-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[11px] font-bold">Ledger Entry:</label>
                  <input 
                    type="text" 
                    value={financeTitle}
                    onChange={(e) => setFinanceTitle(e.target.value)}
                    placeholder="e.g. Steam Sale"
                    className="p-1 text-[12px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 outline-none"
                    disabled={isSubmittingFinance}
                  />
                </div>
                
                <div className="flex flex-col gap-1 w-[80px]">
                  <label className="text-[11px] font-bold">Amount:</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={financeAmount}
                    onChange={(e) => setFinanceAmount(e.target.value)}
                    placeholder="0.00"
                    className="p-1 text-[12px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 outline-none"
                    disabled={isSubmittingFinance}
                  />
                </div>

                <div className="flex flex-col gap-1 w-[80px]">
                  <label className="text-[11px] font-bold">Type:</label>
                  <select 
                    value={isIncome ? "income" : "expense"}
                    onChange={(e) => setIsIncome(e.target.value === "income")}
                    className="p-1 text-[12px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 outline-none cursor-pointer"
                    disabled={isSubmittingFinance}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmittingFinance || !financeTitle.trim() || !financeAmount}
                  className="bg-[#c0c0c0] px-3 py-1 text-[12px] font-bold border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] disabled:opacity-50"
                >
                  ADD
                </button>
              </form>

              <ul className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1">
                {financeData && financeData.transactions.map((t: Transaction) => (
                  <li key={t.id} className="flex justify-between items-center text-[12px] bg-white p-1 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-[1px] group">
                    <span className="truncate w-[200px]">{t.title}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${t.is_income ? "text-green-600" : "text-red-600"}`}>
                        {t.is_income ? "+" : "-"}${t.amount.toFixed(2)}
                      </span>
                      <button 
                        onClick={() => handleDeleteFinance(t.id)}
                        className="text-[10px] text-red-600 opacity-0 group-hover:opacity-100 font-bold hover:bg-red-100 px-1"
                      >
                        X
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

            </div>
          </Window>
          
        </div>
      </div>
    </main>
  );
}