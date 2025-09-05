"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function SleepScreen() {
  const params = useParams();
  const router = useRouter();
  const email = params.email as string;
  const [viewMode, setViewMode] = useState<"graphs" | "tabular">("graphs");
  const [rangeTab, setRangeTab] = useState<"weekly" | "monthly" | "yearly">(
    "weekly"
  );
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [userName, setUserName] = useState<string>("User"); // Add userName state

  // Generate sleep schedule data
  const sleepScheduleData = [
    { day: "Su", sleepStart: 23, sleepEnd: 7, highlight: false }, // Changed from "S" to "Su"
    { day: "M", sleepStart: 22, sleepEnd: 6, highlight: false },
    { day: "T", sleepStart: 23.5, sleepEnd: 7.5, highlight: false },
    { day: "W", sleepStart: 22.5, sleepEnd: 5.5, highlight: false },
    { day: "Th", sleepStart: 23, sleepEnd: 7, highlight: false },
    { day: "F", sleepStart: 22, sleepEnd: 7, highlight: false },
    { day: "Sa", sleepStart: 21, sleepEnd: 7, highlight: true }, // Changed from "S" to "Sa"
  ];

  // Generate sleep quality data - same as in the image
  const sleepQualityData = {
    xAxis: ["Su", "M", "T", "W", "Th", "F", "Sa"], // Updated to match the schedule data
    values: [
      { type: "Deep", values: [45, 48, 52, 40, 38, 42, 55] },
      { type: "Light", values: [20, 25, 18, 22, 30, 28, 20] },
      { type: "Restful", values: [25, 20, 24, 28, 22, 20, 15] },
      { type: "Interrupted", values: [10, 7, 6, 10, 10, 10, 10] },
      { type: "Restless", values: [0, 0, 0, 0, 0, 0, 0] },
    ],
  };

  // Simple calendar component
  const Calendar = ({
    onSelect,
    onClose,
  }: {
    onSelect: (date: string) => void;
    onClose: () => void;
  }) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = new Date(currentYear, currentMonth).toLocaleString(
      "default",
      { month: "long" }
    );

    const handleSelect = (day: number) => {
      const formattedDate = `${monthName} ${day}, ${currentYear}`;
      onSelect(formattedDate);
      onClose();
    };

    return (
      <div className="absolute top-full left-0 z-10 mt-1 bg-[#0E1F34] border border-[#22364F] rounded-lg shadow-lg p-3 w-64">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">
            {monthName} {currentYear}
          </div>
          <button onClick={onClose} className="text-gray-400">
            ×
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-xs text-gray-400">
              {day}
            </div>
          ))}
          {Array(firstDayOfMonth)
            .fill(null)
            .map((_, i) => (
              <div key={`empty-${i}`} className="h-7"></div>
            ))}
          {days.map((day) => (
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

  // Generate dummy data for tabular view
  const sleepTableData = [
    {
      date: "22 July 2025",
      quality: "Light",
      sleepTime: "10:30 PM",
      wakeTime: "6:30 AM",
      duration: "8h 0m",
    },
    {
      date: "23 July 2025",
      quality: "Deep",
      sleepTime: "11:00 PM",
      wakeTime: "7:00 AM",
      duration: "8h 0m",
    },
    {
      date: "24 July 2025",
      quality: "Interrupted",
      sleepTime: "11:30 PM",
      wakeTime: "7:30 AM",
      duration: "8h 0m",
    },
    {
      date: "25 July 2025",
      quality: "Awake",
      sleepTime: "10:30 PM",
      wakeTime: "6:30 AM",
      duration: "8h 0m",
    },
    {
      date: "26 July 2025",
      quality: "Deep",
      sleepTime: "11:00 PM",
      wakeTime: "7:00 AM",
      duration: "8h 0m",
    },
    {
      date: "27 July 2025",
      quality: "Light",
      sleepTime: "10:00 PM",
      wakeTime: "6:00 AM",
      duration: "8h 0m",
    },
    {
      date: "28 July 2025",
      quality: "Interrupted",
      sleepTime: "9:00 PM",
      wakeTime: "7:00 AM",
      duration: "10h 0m",
    },
  ];

  // Fetch client name
  useEffect(() => {
    const fetchClientName = async () => {
      if (!params?.email) return;
      try {
        const clientEmail = decodeURIComponent(params.email as string);
        const clientDocRef = doc(db, "intakeForms", clientEmail);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          setUserName(clientData.fullName || "User");
        }
      } catch (err) {
        console.error("Failed to fetch client name:", err);
      }
    };

    fetchClientName();
  }, [params?.email]);

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Use the shared Navigation component */}
      <Navigation
        title="Sleep Tracking"
        subtitle="Track your sleep patterns"
        email={decodeURIComponent(email)}
        userName={userName}
      />

      <div className="px-4 py-6 space-y-8">
        {/* View mode toggle */}
        <div className="flex justify-end">
          <div className="flex">
            <button
              onClick={() => setViewMode("graphs")}
              className={`px-6 py-2 rounded-l text-base ${
                viewMode === "graphs" ? "bg-[#DD3333]" : "bg-gray-700"
              }`}
            >
              Graphs
            </button>
            <button
              onClick={() => setViewMode("tabular")}
              className={`px-6 py-2 rounded-r text-base ${
                viewMode === "tabular" ? "bg-[#DD3333]" : "bg-gray-700"
              }`}
            >
              Tabular
            </button>
          </div>
        </div>

        {/* Sleep History Card */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Sleep History</h2>

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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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

        {viewMode === "graphs" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sleep Schedule Chart */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <h3 className="font-semibold">Sleep Schedule</h3>
                  <div className="ml-2 bg-[#E7AB4A] text-xs rounded-md px-2 py-0.5">
                    Mildly Inconsistent
                  </div>
                </div>

                <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
                  <button
                    onClick={() => setRangeTab("weekly")}
                    className={`px-4 py-1 text-sm ${
                      rangeTab === "weekly" ? "bg-white text-[#07172C]" : ""
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setRangeTab("monthly")}
                    className={`px-4 py-1 text-sm ${
                      rangeTab === "monthly" ? "bg-white text-[#07172C]" : ""
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setRangeTab("yearly")}
                    className={`px-4 py-1 text-sm ${
                      rangeTab === "yearly" ? "bg-white text-[#07172C]" : ""
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <div className="h-[300px] relative">
                {/* Y-axis time labels */}
                <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-400">
                  <div>6 PM</div>
                  <div>9 PM</div>
                  <div>12 AM</div>
                  <div>3 AM</div>
                  <div>6 AM</div>
                  <div>9 AM</div>
                  <div>12 PM</div>
                </div>

                {/* Sleep schedule chart */}
                <div className="pl-12 h-full flex justify-between">
                  {sleepScheduleData.map((day, index) => {
                    // Calculate position and height for the sleep bar
                    const top = ((day.sleepStart - 18) / 18) * 100; // Map 6 PM (18) to 0% and 12 PM (next day, 36) to 100%
                    const height =
                      ((day.sleepEnd + 24 - day.sleepStart) / 18) * 100; // Height based on sleep duration

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div className="relative h-full w-full flex justify-center">
                          <div
                            className={`w-8 absolute rounded-lg ${
                              day.highlight ? "bg-[#DD3333]" : "bg-gray-600"
                            }`}
                            style={{
                              top: `${top}%`,
                              height: `${height}%`,
                            }}
                          ></div>
                        </div>
                        <div className="mt-2 text-sm">{day.day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sleep Quality Chart */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Sleep Quality</h3>
              </div>

              <div className="h-[300px] relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between text-xs text-gray-400">
                  <div>Deep</div>
                  <div>Light</div>
                  <div>Restful</div>
                  <div>Interrupted</div>
                  <div>Restless</div>
                </div>

                {/* Sleep quality chart - area chart */}
                <div className="ml-20 h-full relative">
                  {/* SVG for the line chart with more pronounced up and down movement */}
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 700 300"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="sleepGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#DD3333"
                          stopOpacity="0.8"
                        />
                        <stop
                          offset="100%"
                          stopColor="#DD3333"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    {/* More dynamic path with pronounced ups and downs */}
                    <path
                      d="M0,100 C50,50 100,150 150,80 C200,200 250,60 300,180 C350,100 400,200 450,50 C500,150 550,80 600,120 L600,300 L0,300 Z"
                      fill="url(#sleepGradient)"
                    />

                    {/* Line on top of area with more dramatic movement */}
                    <path
                      d="M0,100 C50,50 100,150 150,80 C200,200 250,60 300,180 C350,100 400,200 450,50 C500,150 550,80 600,120"
                      fill="none"
                      stroke="#DD3333"
                      strokeWidth="3"
                    />
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 w-full flex justify-between px-2 text-xs text-gray-400">
                    {sleepQualityData.xAxis.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Tabular view
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Sleep Data</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#20354A]">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Sleep Quality</th>
                    <th className="py-3 pr-4 font-medium">Sleep Time</th>
                    <th className="py-3 pr-4 font-medium">Wake Time</th>
                    <th className="py-3 pr-4 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {sleepTableData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#20354A] last:border-0"
                    >
                      <td className="py-3 pr-4">{item.date}</td>
                      <td className="py-3 pr-4">{item.quality}</td>
                      <td className="py-3 pr-4">{item.sleepTime}</td>
                      <td className="py-3 pr-4">{item.wakeTime}</td>
                      <td className="py-3 pr-4">{item.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
