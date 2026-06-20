import React, { useRef } from 'react';
import Draggable from 'react-draggable'; // <-- NEW: The Physics Engine!

interface WindowProps {
  title: string;
  width?: string;
  children: React.ReactNode;
  onMinimize?: () => void;
}

export default function Window({ title, width = "w-full", children, onMinimize }: WindowProps) {
  // We need a reference point for the physics engine to track the window
  const nodeRef = useRef(null);

  return (
    <Draggable handle=".window-handle" nodeRef={nodeRef}>
      {/* We added absolute positioning capabilities and z-index so dragged windows float on top! */}
      <div ref={nodeRef} className={`${width} bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[3px] shadow-[2px_2px_5px_rgba(0,0,0,0.5)] flex flex-col relative z-20 hover:z-50 transition-shadow`}>
        
        {/* --- CLASSIC TITLE BAR (NOW DRAGGABLE) --- */}
        {/* We added the 'window-handle' class and cursor-grab physics here! */}
        <div className="window-handle bg-[#000080] text-white px-1 py-[2px] flex justify-between items-center cursor-grab active:cursor-grabbing select-none">
          <span className="font-bold text-[12px] tracking-wider pointer-events-none">{title}</span>
          
          {/* Window Controls */}
          <div className="flex gap-[2px]">
            {onMinimize && (
              <button 
                type="button"
                onClick={onMinimize}
                // We add onMouseDown to stop the drag physics from triggering when you just want to click minimize!
                onMouseDown={(e) => e.stopPropagation()} 
                className="w-4 h-4 bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[2px] text-black text-[10px] font-bold flex items-center justify-center leading-none pb-[4px] active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff]"
                title="Minimize"
              >
                _
              </button>
            )}
            <button 
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              className="w-4 h-4 bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[2px] text-black text-[10px] font-bold flex items-center justify-center leading-none active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff]"
              title="Close (Locked for Core Systems)"
            >
              X
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-2 cursor-default">
          {children}
        </div>
      </div>
    </Draggable>
  );
}