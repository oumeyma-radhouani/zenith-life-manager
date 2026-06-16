import React from "react";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function Window({ title, children, width = "w-[400px]" }: WindowProps) {
  return (
    <div className={`${width} bg-[#c0c0c0] p-[2px] border-t-2 border-l-2 border-t-[#ffffff] border-l-[#ffffff] border-b-2 border-r-2 border-b-[#000000] border-r-[#000000] text-black`}>
      
      {/* Inner Frame: Lighter gray top/left, Darker gray bottom/right */}
      <div className="border-t-[1px] border-l-[1px] border-t-[#dfdfdf] border-l-[#dfdfdf] border-b-[1px] border-r-[1px] border-b-[#808080] border-r-[#808080] p-[2px]">
        
        {/* Title Bar: Classic Solid Navy Blue */}
        <div className="bg-[#000080] text-white px-1 py-[2px] flex justify-between items-center text-xs font-bold tracking-wider select-none">
          <span className="ml-1">{title}</span>
          
          {/* Retro Window Controls */}
          <div className="flex gap-[2px]">
            {/* Minimize Button */}
            <button className="w-[16px] h-[14px] bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[1px] flex items-center justify-center active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] active:p-[1px]">
              <span className="block w-[8px] h-[2px] bg-black mt-2"></span>
            </button>
            {/* Maximize Button */}
            <button className="w-[16px] h-[14px] bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[1px] flex items-center justify-center active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] active:p-[1px]">
              <span className="block w-[8px] h-[8px] border-[1px] border-black border-t-[2px]"></span>
            </button>
            {/* Close Button */}
            <button className="w-[16px] h-[14px] bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-[1px] flex items-center justify-center text-black text-[9px] font-bold active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff] active:pt-[2px] active:pl-[2px]">
              X
            </button>
          </div>
        </div>

        {/* Window Body */}
        <div className="p-3 text-sm">
          {children}
        </div>

      </div>
    </div>
  );
}