"use client";

import Image from "next/image";
import useSWR from "swr";
import Window from "../components/Window";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data: tasks, error, isLoading } = useSWR("http://localhost:8000/tasks/", fetcher);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image 
          src="/sky.png" 
          alt="Zenith OS Sky Background"
          fill
          className="object-cover"
          priority 
        />
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
      </div>

      {/* App Layer */}
      <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
        
        <Window title="System Status" width="w-[500px]">
          <div className="flex flex-col gap-2">
            <p className="font-bold border-b border-[#808080] pb-1">
              Active Quests Log
            </p>
            
            {isLoading && <p className="text-[13px] italic">Establishing secure connection to database vault...</p>}
            
            {error && <p className="text-[13px] text-red-600 font-bold">CRITICAL ERROR: Failed to fetch tasks.</p>}
            
            {tasks && tasks.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-2">
                {tasks.map((task: any) => (
                  <li key={task.id} className="text-[13px] flex items-start gap-2">
                    <span className="font-bold text-[#000080]">[ID: {task.id}]</span> 
                    <span>
                      {task.title} 
                      <span className="text-[#808080] ml-2">({task.xp_reward} XP)</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              !isLoading && <p className="text-[13px]">No active tasks found in the database.</p>
            )}
            
            <div className="mt-4 flex justify-end">
              <button className="bg-[#c0c0c0] px-6 py-1 text-[13px] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] active:pt-[5px] active:pl-[5px] active:pb-[3px] active:pr-[3px] focus:outline-dotted focus:outline-1 focus:outline-black focus:-outline-offset-4">
                Refresh
              </button>
            </div>
          </div>
        </Window>
        
      </div>
    </main>
  );
}