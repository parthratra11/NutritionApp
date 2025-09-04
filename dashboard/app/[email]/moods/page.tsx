"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navigation from "../../../components/shared/Navigation";

type MoodPoint = {
  day: string;
  mood: string;
  score: number; // 1-10
};

const weeklyBase: MoodPoint[] = [
  { day: "Sun", mood: "Calm", score: 4 },
  { day: "Mon", mood: "Tired", score: 3 },
  { day: "Tue", mood: "Energetic", score: 6 },
  { day: "Wed", mood: "Happy", score: 8 },
  { day: "Thu", mood: "Low", score: 5 },
  { day: "Fri", mood: "Focused", score: 7 },
  { day: "Sat", mood: "Energetic", score: 9 },
];

export default function MoodScreen() {
  const params = useParams();
  const router = useRouter();
  const email = params.email as string;
  const [viewMode, setViewMode] = useState<"graphs" | "tabular">("graphs");
  const [rangeTab, setRangeTab] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const dataset = useMemo(() => {
    if (rangeTab === "weekly") return weeklyBase;
    if (rangeTab === "monthly") {
      return weeklyBase.map(mp => ({
        ...mp,
        score: Math.min(10, Math.round((mp.score * 3 + 5) / 2)),
      }));
    }
    return weeklyBase.map(mp => ({
      ...mp,
      score: Math.min(10, Math.round((mp.score + 6) / 2)),
    }));
  }, [rangeTab]);

  const currentDayIndex = 28;
  const daysOfWeek = ["S", "M", "T", "W", "Th", "F", "S"];
  const weekDays = [22, 23, 24, 25, 26, 27, 28];

  // Simple calendar component
  const Calendar = ({ onSelect, onClose }: { onSelect: (date: string) => void, onClose: () => void }) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });
    
    const handleSelect = (day: number) => {
      const formattedDate = `${monthName} ${day}, ${currentYear}`;
      onSelect(formattedDate);
      onClose();
    };
    
    return (
      <div className="absolute top-full left-0 z-10 mt-1 bg-[#0E1F34] border border-[#22364F] rounded-lg shadow-lg p-3 w-64">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">{monthName} {currentYear}</div>
          <button onClick={onClose} className="text-gray-400">×</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => (
            <div key={day} className="text-center text-xs text-gray-400">{day}</div>
          ))}
          {Array(firstDayOfMonth).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="h-7"></div>
          ))}
          {days.map(day => (
            <button 
              key={day} 
              onClick={() => handleSelect(day)}
              className="h-7 w-7 rounded-full hover:bg-[#DD3333] flex items-center justify-center text-sm"
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Generate dummy data for tabular view that matches the image format
  const dummyTableData = [
    { date: "07 July 2025", mood: "Tired" },
    { date: "08 July 2025", mood: "Tired" },
    { date: "09 July 2025", mood: "Calm" },
    { date: "10 July 2025", mood: "Motivated" },
    { date: "11 July 2025", mood: "Anxious" },
    { date: "12 July 2025", mood: "Sad" },
    { date: "13 July 2025", mood: "Angry" },
    { date: "14 July 2025", mood: "Happy" },
    { date: "15 July 2025", mood: "Tired" },
    { date: "16 July 2025", mood: "Calm" },
    { date: "17 July 2025", mood: "Motivated" },
    { date: "18 July 2025", mood: "Anxious" },
    { date: "19 July 2025", mood: "Sad" },
    { date: "20 July 2025", mood: "Angry" },
    { date: "21 July 2025", mood: "Happy" },
    { date: "22 July 2025", mood: "Tired" },
    { date: "23 July 2025", mood: "Calm" },
    { date: "24 July 2025", mood: "Motivated" },
    { date: "25 July 2025", mood: "Anxious" },
    { date: "26 July 2025", mood: "Sad" },
    { date: "27 July 2025", mood: "Angry" },
    { date: "28 July 2025", mood: "Happy" },
  ];

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Use the shared Navigation component */}
      <Navigation 
        title="Mood Tracking" 
        subtitle="Track your daily mood patterns"
        email={decodeURIComponent(email)}
      />

      <div className="px-4 py-6 space-y-8">
        {/* View mode toggle above the Mood History Card */}
        <div className="flex justify-end">
          <div className="flex">
            <button 
              onClick={() => setViewMode("graphs")}
              className={`px-6 py-2 rounded-l text-base ${viewMode === "graphs" ? "bg-[#DD3333]" : "bg-gray-700"}`}
            >
              Graphs
            </button>
            <button 
              onClick={() => setViewMode("tabular")}
              className={`px-6 py-2 rounded-r text-base ${viewMode === "tabular" ? "bg-[#DD3333]" : "bg-gray-700"}`}
            >
              Tabular
            </button>
          </div>
        </div>
        
        {/* Mood History Card */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Mood History</h2>
          
          <div className="flex space-x-3">
            <div className="relative">
              <button 
                onClick={() => {
                  setShowStartCalendar(!showStartCalendar);
                  setShowEndCalendar(false);
                }}
                className="bg-[#0E1F34] border border-[#22364F] text-gray-300 w-full p-2 rounded flex items-center justify-between z"
              >
                <span>{startDate || "Select Start Date"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </button>
              {showStartCalendar && (
                <Calendar 
                  onSelect={(date) => setStartDate(date)} 
                  onClose={() => setShowStartCalendar(false)} 
                />
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => {
                  setShowEndCalendar(!showEndCalendar);
                  setShowStartCalendar(false);
                }}
                className="bg-[#0E1F34] border border-[#22364F] text-gray-300 w-full p-2 rounded flex items-center justify-between"
              >
                <span>{endDate || "Select End Date"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </button>
              {showEndCalendar && (
                <Calendar 
                  onSelect={(date) => setEndDate(date)} 
                  onClose={() => setShowEndCalendar(false)} 
                />
              )}
            </div>
          </div>
        </div>

        {/* Mood Graph / Table */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Mood</h3>
            <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
              <button 
                onClick={() => setRangeTab("weekly")}
                className={`px-5 py-2 text-sm ${rangeTab === "weekly" ? "bg-white text-[#07172C]" : ""}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setRangeTab("monthly")}
                className={`px-5 py-2 text-sm ${rangeTab === "monthly" ? "bg-white text-[#07172C]" : ""}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setRangeTab("yearly")}
                className={`px-5 py-2 text-sm ${rangeTab === "yearly" ? "bg-white text-[#07172C]" : ""}`}
              >
                Yearly
              </button>
            </div>
          </div>

          {viewMode === "graphs" ? (
            <div className="h-[340px] relative">
              {/* Bubbles */}
              <div className="absolute inset-0">
                {dataset.map((d, idx) => {
                  // Position bubbles similar to the screenshot
                  let positions = {
                    "Sun": { left: "8%", top: "70%" },
                    "Mon": { left: "18%", top: "85%" },
                    "Tue": { left: "32%", top: "55%" },
                    "Wed": { left: "45%", top: "30%" },
                    "Thu": { left: "60%", top: "70%" },
                    "Fri": { left: "75%", top: "45%" },
                    "Sat": { left: "88%", top: "20%" }
                  };
                  
                  const position = positions[d.day];
                  const size = 30 + d.score * 5;
                  
                  return (
                    <div
                      key={d.day}
                      className="absolute rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        left: position.left,
                        top: position.top,
                        width: size,
                        height: size,
                        transform: "translate(-50%, -50%)",
                        background: "radial-gradient(circle at 30% 30%, #E04A42, #C22F28)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.35)",
                      }}
                    >
                      {d.day}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className=" bg-[#142437] z-10">
                  <tr className="text-left border-b border-[#20354A]">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Mood</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyTableData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#20354A] last:border-0"
                    >
                      <td className="py-3 pr-4">{item.date}</td>
                      <td className="py-3 pr-4">{item.mood}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}