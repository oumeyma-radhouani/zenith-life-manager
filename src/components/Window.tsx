import React, { useState } from 'react';
import { Rnd } from 'react-rnd';

interface WindowProps {
  title: string;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number | string;
  children: React.ReactNode;
  onMinimize?: () => void;
}

export default function Window({ title, defaultX = 50, defaultY = 50, defaultWidth = 400, defaultHeight = "auto", children, onMinimize }: WindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsMaximized(!isMaximized);
  };

  const WindowContent = (
    <>
      <div className="window-handle bg-[#5b7c99] border-b-[2px] border-black px-1 py-1 flex justify-between items-center cursor-grab active:cursor-grabbing select-none h-8 shrink-0">
        <button type="button" onMouseDown={(e) => e.stopPropagation()} className="w-5 h-5 border-[2px] border-black bg-[#dfdfdf] flex items-center justify-center hover:bg-black group"> 
          <div className="w-1.5 h-1.5 bg-black group-hover:bg-white"></div>
        </button>
        <span className="font-bold text-white text-xl tracking-widest pointer-events-none px-2 text-center flex-1 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">{title}</span>
        <div className="flex gap-1">
          {onMinimize && (
            <button type="button" onClick={onMinimize} onMouseDown={(e) => e.stopPropagation()} className="w-5 h-5 border-[2px] border-black bg-[#dfdfdf] flex items-center justify-center hover:bg-black group"> 
              <div className="w-2.5 h-[2px] bg-black group-hover:bg-white"></div>
            </button>
          )}
          <button type="button" onClick={toggleMaximize} onMouseDown={(e) => e.stopPropagation()} className="w-5 h-5 bg-[#dfdfdf] border-[2px] border-black text-black text-sm font-bold flex items-center justify-center hover:bg-black hover:text-white transition-colors" title={isMaximized ? "Restore" : "Maximize"}> 
            {isMaximized ? '❐' : '□'} 
          </button>
        </div>
      </div>
      
      {/* THE RESIZING FIX: Added strict overflow-hidden and min-h-0 flex rules to lock content inside */}
      <div className="p-4 cursor-default text-black bg-[#dfdfdf] flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className={`w-full h-full flex flex-col min-h-0 ${isMaximized ? "max-w-2xl mx-auto" : ""}`}>
          {children}
        </div>
      </div>
    </>
  );

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex justify-center items-center p-8 pb-20">
        <div className="w-full max-w-4xl h-full max-h-[700px] bg-[#dfdfdf] border-[2px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
          {WindowContent}
        </div>
      </div>
    );
  }

  return (
    <Rnd
      default={{ x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight }}
      minWidth={320}
      minHeight={250}
      bounds="parent" 
      dragHandleClassName="window-handle"
      className="bg-[#dfdfdf] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col z-20 hover:!z-[80] overflow-hidden"
    >
      {WindowContent}
    </Rnd>
  );
}