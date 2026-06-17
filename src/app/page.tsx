"use client";

import Image from "next/image";
import useSWR from "swr";
import { useState, useEffect } from "react"; 
import Window from "../components/Window";
import Calendar from "../components/Calendar"; // <-- NEW: Imported the Calendar!

// --- TYPESCRIPT BLUEPRINT ---
interface Task {
  id: string;
  title: string;
  xp_reward: number;
  is_daily: boolean;
  due_date: string | null; 
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data: tasks, error, isLoading, mutate: mutateTasks } = useSWR("http://localhost:8000/tasks/", fetcher);
  const { data: player, mutate: mutatePlayer } = useSWR("http://localhost:8000/tasks/player", fetcher);
  const { data: note, mutate: mutateNote } = useSWR("http://localhost:8000/notes/", fetcher); 
  
  // --- TASK STATE ---
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("minion"); 
  const [isDaily, setIsDaily] = useState(false);
  const [dueDate, setDueDate] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number, xp: number } | null>(null);

  // --- NOTE STATE ---
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (note && noteText === "") {
      setNoteText(note.content || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    await fetch("http://localhost:8000/tasks/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title, 
        difficulty, 
        is_daily: isDaily,
        due_date: dueDate ? dueDate : null 
      }),
    });

    setTitle(""); 
    setDifficulty("minion"); 
    setIsDaily(false); 
    setDueDate(""); 
    mutateTasks(); 
    setIsSubmitting(false);
  };

  const handleCompleteQuest = async (id: string) => {
    const response = await fetch(`http://localhost:8000/tasks/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    
    if (player && data.new_level > player.level) {
      setLevelUpData({ level: data.new_level, xp: data.new_total_xp });
    }
    
    mutateTasks(); 
    mutatePlayer(); 
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    await fetch("http://localhost:8000/notes/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText }),
    });
    mutateNote();
    setIsSavingNote(false);
  };

  return (
    <main className="relative w-screen h-screen overflow-x-hidden overflow-y-auto pb-10">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image src="/sky.png" alt="Zenith OS Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
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
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[600px] bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[3px] p-2 flex flex-col gap-1 z-20 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] text-black">
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
        <div className="flex flex-col gap-6">
          
          {/* WINDOW 1: The Quest Terminal */}
          <Window title="Quest Terminal" width="w-[320px]">
            <form onSubmit={handleCreateQuest} className="flex flex-col gap-3">
              <p className="font-bold border-b border-[#808080] pb-1">Register New Quest</p>
              
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold">Quest Title:</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-1 text-[13px] border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 bg-white outline-none focus:bg-blue-50"
                  placeholder="e.g. Finish Math Homework"
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

              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="daily-check"
                  checked={isDaily}
                  onChange={(e) => {
                    setIsDaily(e.target.checked);
                    if (e.target.checked) setDueDate(""); 
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

          {/* WINDOW 3: The Scratchpad (Moved under the terminal!) */}
          <Window title="Brain Dump" width="w-[320px]">
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
              <ul className="mt-2 flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2">
                {tasks.map((task: Task) => (
                  <li key={task.id} className="text-[13px] flex items-start gap-2 group">
                    <button 
                      onClick={() => handleCompleteQuest(task.id)}
                      className="w-4 h-4 mt-[2px] shrink-0 bg-white border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 flex items-center justify-center hover:bg-green-200 active:bg-green-400 active:border-t-[#000000] active:border-l-[#000000]"
                      title="Complete Quest"
                    ></button>
                    
                    <div className="flex flex-col leading-tight">
                      <span>
                        {task.title} 
                        {task.is_daily && <span className="ml-2 text-[10px] bg-[#000080] text-white px-1 py-[1px] tracking-wider font-bold">DAILY</span>}
                        {task.due_date && <span className="ml-2 text-[10px] bg-red-600 text-white px-1 py-[1px] tracking-wider font-bold">DUE: {task.due_date}</span>}
                      </span>
                      <span className="text-[11px] text-[#808080] font-bold">REWARD: {task.xp_reward} XP</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              !isLoading && <p className="text-[13px]">No active quests.</p>
            )}
          </div>
        </Window>

        {/* COLUMN 3: The Future */}
        <Window title="Schedule Sync" width="w-[500px]">
          <Calendar tasks={tasks || []} />
        </Window>

      </div>
    </main>
  );
}