"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";

export default function WeightScreen() {
  const params = useParams();
  const router = useRouter();
  const email = params.email as string;
  const [viewMode, setViewMode] = useState<"graphs" | "tabular">("graphs");
  const [rangeTab, setRangeTab] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Weight data for the graph
  const weightData = [
    { day: "Su", weight: 75.0 },
    { day: "M", weight: 74.5 },
    { day: "T", weight: 75.2 },
    { day: "W", weight: 75.5 },
    { day: "Th", weight: 75.3 },
    { day: "F", weight: 74.3 },
    { day: "Sa", weight: 75.4 },
  ];

  // Tabular data for weight history - now ordered from most recent to oldest
  const weightTableData = [
    { date: "28 July 2025", weight: "75.4 kg", change: "+1.1" },
    { date: "27 July 2025", weight: "74.3 kg", change: "-1.0" },
    { date: "26 July 2025", weight: "75.3 kg", change: "-0.2" },
    { date: "25 July 2025", weight: "75.5 kg", change: "+0.3" },
    { date: "24 July 2025", weight: "75.2 kg", change: "+0.7" },
    { date: "23 July 2025", weight: "74.5 kg", change: "-0.5" },
    { date: "22 July 2025", weight: "75.0 kg", change: "+0.2" },
    { date: "21 July 2025", weight: "74.8 kg", change: "-0.3" },
    { date: "20 July 2025", weight: "75.1 kg", change: "+0.4" },
    { date: "19 July 2025", weight: "74.7 kg", change: "-0.2" },
    { date: "18 July 2025", weight: "74.9 kg", change: "+0.1" },
    { date: "17 July 2025", weight: "74.8 kg", change: "-0.4" },
    { date: "16 July 2025", weight: "75.2 kg", change: "+0.5" },
    { date: "15 July 2025", weight: "74.7 kg", change: "-0.6" },
  ];

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

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Use the shared Navigation component */}
      <Navigation 
        title="Workout" 
        subtitle="Track your weight progress"
        email={decodeURIComponent(email)}
      />

      <div className="px-4 py-6 space-y-8">
        {/* View mode toggle */}
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
        
        {/* Weight History Card */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Weight History</h2>
          
          <div className="flex space-x-3">
            <div className="relative">
              <button 
                onClick={() => {
                  setShowStartCalendar(!showStartCalendar);
                  setShowEndCalendar(false);
                }}
                className="bg-[#0E1F34] border border-[#22364F] text-gray-300 w-full p-2 rounded flex items-center justify-between"
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

        {/* Weight Graph or Table */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h3 className="font-semibold">Weight</h3>
              <div className="ml-2 bg-[#4CAF50] text-xs rounded-md px-2 py-0.5 flex items-center">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
                On Track
              </div>
            </div>
            
            <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
              <button 
                onClick={() => setRangeTab("weekly")}
                className={`px-4 py-1 text-sm ${rangeTab === "weekly" ? "bg-white text-[#07172C]" : ""}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setRangeTab("monthly")}
                className={`px-4 py-1 text-sm ${rangeTab === "monthly" ? "bg-white text-[#07172C]" : ""}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setRangeTab("yearly")}
                className={`px-4 py-1 text-sm ${rangeTab === "yearly" ? "bg-white text-[#07172C]" : ""}`}
              >
                Yearly
              </button>
            </div>
          </div>

          {viewMode === "graphs" ? (
            <div className="h-[300px] relative">
              {/* Y-axis weight labels */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-400">
                <div>77</div>
                <div>76</div>
                <div>75</div>
                <div>74</div>
                <div>73</div>
              </div>

              {/* Weight Chart */}
              <div className="ml-12 h-full relative">
                {/* SVG for the area chart */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 700 300">
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DD3333" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#DD3333" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Path for area under the curve */}
                  <path 
                    d="M0,100 C100,150 150,60 250,130 C350,200 450,80 550,120 C600,150 650,60 700,80 L700,300 L0,300 Z" 
                    fill="url(#weightGradient)"
                  />
                  
                  {/* Line on top of area */}
                  <path 
                    d="M0,100 C100,150 150,60 250,130 C350,200 450,80 550,120 C600,150 650,60 700,80" 
                    fill="none"
                    stroke="#DD3333"
                    strokeWidth="3"
                  />
                </svg>

                {/* X-axis day labels */}
                <div className="absolute bottom-0 w-full flex justify-between px-2 text-xs text-gray-400">
                  {weightData.map((item, index) => (
                    <div key={index}>{item.day}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Tabular view
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#20354A]">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Weight</th>
                    <th className="py-3 pr-4 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {weightTableData.map((item, index) => (
                    <tr key={index} className="border-b border-[#20354A] last:border-0">
                      <td className="py-3 pr-4">{item.date}</td>
                      <td className="py-3 pr-4">{item.weight}</td>
                      <td className="py-3 pr-4">
                        <span className={item.change.startsWith("+") ? "text-green-500" : "text-red-500"}>
                          {item.change}
                        </span>
                      </td>
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