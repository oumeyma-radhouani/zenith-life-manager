import React from 'react';

interface MeProps {
  player: any;
}

export default function Me({ player }: MeProps) {
  return (
    <div className="flex flex-col h-full bg-[#f9f9f9] overflow-y-auto custom-scrollbar border-[2px] border-black text-black">
      
      {/* Top Banner */}
      <div className="bg-[#a5b4fc] p-2 border-b-[2px] border-black text-center shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]">
        <h2 className="font-bold text-xl tracking-widest text-white drop-shadow-[1px_1px_0_#000]">HAIRLESS MONKEY</h2>
      </div>

      <div className="p-4 flex flex-col items-center">
        {/* Avatar / Webcam Box (eva.me style) */}
        <div className="w-[180px] h-[180px] bg-white border-[2px] border-black shadow-[4px_4px_0_#000] p-1 mb-4 flex flex-col">
          <div className="bg-black text-white text-[10px] font-bold px-1 uppercase tracking-widest">webcam</div>
          <div className="flex-1 bg-[#f1f5f9] border-[1px] border-black mt-1 flex items-center justify-center cursor-pointer hover:bg-[#e2e8f0] transition-colors relative overflow-hidden group">
            {/* Placeholder for future avatar */}
            <span className="text-xs font-bold text-gray-400 group-hover:text-black transition-colors text-center px-2">
              [ Avatar Customizer ]<br/>Coming Soon
            </span>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="w-full bg-white border-[2px] border-black p-2 shadow-[2px_2px_0_#000] mb-4 text-sm font-bold">
          <p className="border-b-[1px] border-gray-300 pb-1 mb-1">"System Administrator."</p>
          <p className="text-[#a5b4fc] drop-shadow-[1px_1px_0_#000] tracking-widest">ONLINE</p>
        </div>

        {/* Level & XP (Non-RPG themed) */}
        <div className="w-full flex flex-col gap-1 border-[2px] border-black bg-white p-2 shadow-[2px_2px_0_#000]">
          <div className="flex justify-between font-bold text-xs uppercase tracking-widest">
            <span>System Lvl {player ? player.level : 1}</span>
            <span>{player ? player.xp : 0} XP</span>
          </div>
          <div className="w-full h-3 bg-[#e2e8f0] border-[1px] border-black">
            <div className="h-full bg-[#a5b4fc]" style={{ width: `${player ? player.xp % 100 : 0}%` }}></div>
          </div>
        </div>

        {/* Contact/Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-2 mt-4">
          <button className="bg-[#fbcfe8] border-[2px] border-black text-xs font-bold py-1 hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0_#000]">Message</button>
          <button className="bg-[#bae6fd] border-[2px] border-black text-xs font-bold py-1 hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0_#000]">Settings</button>
        </div>

      </div>
    </div>
  );
}