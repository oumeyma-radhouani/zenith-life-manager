import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';

interface WindowProps {
  title: string;
  width?: string;
  children: React.ReactNode;
  onMinimize?: () => void;
}

export default function Window({ title, width = "w-full", children, onMinimize }: WindowProps) {
  const nodeRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsMaximized(!isMaximized);
  };

  const WindowContent = (
    <>
      {/* MOODY BLUE TITLE BAR */}
      <div className="window-handle bg-[#5b7c99] border-b-[2px] border-black px-1 py-1 flex justify-between items-center cursor-grab active:cursor-grabbing select-none h-8 shrink-0">
        
        <button 
          type="button" onMouseDown={(e) => e.stopPropagation()}
          className="w-5 h-5 border-[2px] border-black bg-[#dfdfdf] flex items-center justify-center hover:bg-black group"
        > 
          <div className="w-1.5 h-1.5 bg-black group-hover:bg-white"></div>
        </button>
        
        <span className="font-bold text-white text-xl tracking-widest pointer-events-none px-2 text-center flex-1 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
          {title}
        </span>
        
        <div className="flex gap-1">
          {onMinimize && (
            <button 
              type="button" onClick={onMinimize} onMouseDown={(e) => e.stopPropagation()} 
              className="w-5 h-5 border-[2px] border-black bg-[#dfdfdf] flex items-center justify-center hover:bg-black group"
            > 
              <div className="w-2.5 h-[2px] bg-black group-hover:bg-white"></div>
            </button>
          )}
          
          <button 
            type="button" onClick={toggleMaximize} onMouseDown={(e) => e.stopPropagation()} 
            className="w-5 h-5 bg-[#dfdfdf] border-[2px] border-black text-black text-sm font-bold flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          > 
            {isMaximized ? '❐' : '□'} 
          </button>
        </div>
      </div>
      
      {/* CONTENT AREA */}
      <div className="p-4 cursor-default text-black bg-[#dfdfdf] flex-1 overflow-y-auto relative">
        <div className={isMaximized ? "max-w-2xl mx-auto" : "h-full"}>
          {children}
        </div>
      </div>

      {/* --- NEW: THE RETRO 'GROW BOX' GRIP --- */}
      {/* This renders a little pixel texture over the native CSS resize hit-box */}
      {!isMaximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none flex flex-col items-end justify-end p-[3px] opacity-60">
          <div className="flex gap-[2px] mb-[2px]">
            <div className="w-[2px] h-[2px] bg-black"></div>
            <div className="w-[2px] h-[2px] bg-black"></div>
            <div className="w-[2px] h-[2px] bg-black"></div>
          </div>
          <div className="flex gap-[2px] mb-[2px]">
            <div className="w-[2px] h-[2px] bg-black"></div>
            <div className="w-[2px] h-[2px] bg-black"></div>
          </div>
          <div className="flex gap-[2px]">
            <div className="w-[2px] h-[2px] bg-black"></div>
          </div>
        </div>
      )}
    </>
  );

  // MAXIMIZED (FOCUS MODE)
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex justify-center items-center p-8 pb-20">
        <div className="w-full max-w-4xl h-full max-h-[700px] bg-[#dfdfdf] border-[2px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col relative">
          {WindowContent}
        </div>
      </div>
    );
  }

  // NORMAL (DRAGGABLE & RESIZABLE)
  return (
    <Draggable handle=".window-handle" nodeRef={nodeRef}>
      <div 
        ref={nodeRef} 
        // --- ADDED: resize, overflow-hidden, min-w, min-h ---
        className={`${width} bg-[#dfdfdf] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex flex-col relative z-20 hover:z-50 resize overflow-hidden min-w-[300px] min-h-[200px]`}
      >
        {WindowContent}
      </div>
    </Draggable>
  );
}