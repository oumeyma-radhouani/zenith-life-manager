"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
interface Task {
  id: string;
  title: string;
  due_date: string | null;
}

export default function Calendar({ tasks = [] }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- THE CALENDAR MATH ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthStart); // Get the 6-week grid end
  const endGridDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endGridDate
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col gap-2 text-black">
      {/* Calendar Header Controls */}
      <div className="flex justify-between items-center bg-[#000080] text-white p-1 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2">
        <button onClick={prevMonth} className="px-2 bg-[#c0c0c0] text-black font-bold border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff]">
          &lt;
        </button>
        <span className="font-bold tracking-widest text-[14px]">
          {format(currentDate, "MMMM yyyy").toUpperCase()}
        </span>
        <button onClick={nextMonth} className="px-2 bg-[#c0c0c0] text-black font-bold border-t-[#ffffff] border-l-[#ffffff] border-b-[#000000] border-r-[#000000] border-2 active:border-t-[#000000] active:border-l-[#000000] active:border-b-[#ffffff] active:border-r-[#ffffff]">
          &gt;
        </button>
      </div>

      {/* The Grid */}
      <div className="grid grid-cols-7 border-t-[#808080] border-l-[#808080] border-b-[#ffffff] border-r-[#ffffff] border-2 bg-white">
        {/* Days of the Week */}
        {weekDays.map((day) => (
          <div key={day} className="text-center font-bold text-[11px] bg-[#c0c0c0] border-b-[#808080] border-r-[#808080] border-[1px] py-1">
            {day}
          </div>
        ))}

        {/* The Actual Dates */}
        {calendarDays.map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          // Find all tasks due on this specific square!
          const daysTasks = tasks.filter((t) => t.due_date === dateStr);
          
          return (
            <div 
              key={idx} 
              className={`min-h-[60px] border-b-[#c0c0c0] border-r-[#c0c0c0] border-[1px] p-1 flex flex-col gap-1
                ${!isSameMonth(day, monthStart) ? "bg-[#e0e0e0] text-[#808080]" : "bg-white"}
                ${isToday(day) ? "bg-[#ffffcc]" : ""}
              `}
            >
              <span className="text-[11px] font-bold self-end">{format(day, "d")}</span>
              
              {/* Render the Task Warnings! */}
              <div className="flex flex-col gap-[2px]">
                {daysTasks.map(t => (
                  <div key={t.id} className="text-[9px] bg-red-600 text-white px-1 leading-tight overflow-hidden text-ellipsis whitespace-nowrap" title={t.title}>
                    ! {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}