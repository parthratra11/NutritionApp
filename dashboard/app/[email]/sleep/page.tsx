"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Weekly sleep data
const weeklySleepData = [
  {
    sleepStart: 23,
    sleepEnd: 7,
    highlight: false,
    date: "2025-07-22",
  },
  {
    sleepStart: 22,
    sleepEnd: 6,
    highlight: false,
    date: "2025-07-23",
  },
  {
    sleepStart: 23.5,
    sleepEnd: 7.5,
    highlight: false,
    date: "2025-07-24",
  },
  {
    sleepStart: 22.5,
    sleepEnd: 5.5,
    highlight: false,
    date: "2025-07-25",
  },
  {
    sleepStart: 23,
    sleepEnd: 7,
    highlight: false,
    date: "2025-07-26",
  },
  {
    sleepStart: 22,
    sleepEnd: 7,
    highlight: false,
    date: "2025-07-27",
  },
  {
    sleepStart: 21,
    sleepEnd: 7,
    highlight: true,
    date: "2025-07-28",
  },
];

// Monthly sleep data (4 weeks average)
const monthlySleepData = [
  {
    sleepStart: 22.5,
    sleepEnd: 6.8,
    highlight: false,
    date: "2025-07-01",
  },
  {
    sleepStart: 23,
    sleepEnd: 7.2,
    highlight: false,
    date: "2025-07-08",
  },
  {
    sleepStart: 22.2,
    sleepEnd: 6.5,
    highlight: false,
    date: "2025-07-15",
  },
  {
    sleepStart: 22.7,
    sleepEnd: 7,
    highlight: true,
    date: "2025-07-22",
  },
];

// Yearly sleep data (12 months average)
const yearlySleepData = [
  {
    sleepStart: 23,
    sleepEnd: 7.5,
    highlight: false,
    date: "2025-01-01",
  },
  {
    sleepStart: 22.5,
    sleepEnd: 7,
    highlight: false,
    date: "2025-02-01",
  },
  {
    sleepStart: 22.8,
    sleepEnd: 6.8,
    highlight: false,
    date: "2025-03-01",
  },
  {
    sleepStart: 22.2,
    sleepEnd: 6.5,
    highlight: false,
    date: "2025-04-01",
  },
  {
    sleepStart: 22.5,
    sleepEnd: 6.8,
    highlight: false,
    date: "2025-05-01",
  },
  {
    sleepStart: 23.2,
    sleepEnd: 7.2,
    highlight: false,
    date: "2025-06-01",
  },
  {
    sleepStart: 22.6,
    sleepEnd: 6.9,
    highlight: true,
    date: "2025-07-01",
  },
  {
    sleepStart: 22.8,
    sleepEnd: 7,
    highlight: false,
    date: "2025-08-01",
  },
  {
    sleepStart: 22.4,
    sleepEnd: 6.7,
    highlight: false,
    date: "2025-09-01",
  },
  {
    sleepStart: 23,
    sleepEnd: 7.3,
    highlight: false,
    date: "2025-10-01",
  },
  {
    sleepStart: 23.5,
    sleepEnd: 7.5,
    highlight: false,
    date: "2025-11-01",
  },
  {
    sleepStart: 23.8,
    sleepEnd: 8,
    highlight: false,
    date: "2025-12-01",
  },
];

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

  // Helper function to format date for display
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get current sleep schedule data based on range
  const currentSleepData = useMemo(() => {
    let baseData;
    if (rangeTab === "weekly") baseData = weeklySleepData;
    else if (rangeTab === "monthly") baseData = monthlySleepData;
    else baseData = yearlySleepData;

    // Filter by custom date range if both dates are selected
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return baseData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    return baseData;
  }, [rangeTab, startDate, endDate]);

  // Generate sleep quality data based on current range
  const sleepQualityData = useMemo(() => {
    const xAxis = currentSleepData.map((item) =>
      formatDateForDisplay(item.date)
    );

    if (rangeTab === "weekly") {
      return {
        xAxis,
        values: [
          { type: "Deep", values: [45, 48, 52, 40, 38, 42, 55] },
          { type: "Light", values: [20, 25, 18, 22, 30, 28, 20] },
          { type: "Restful", values: [25, 20, 24, 28, 22, 20, 15] },
          { type: "Interrupted", values: [10, 7, 6, 10, 10, 10, 10] },
          { type: "Restless", values: [0, 0, 0, 0, 0, 0, 0] },
        ],
      };
    } else if (rangeTab === "monthly") {
      return {
        xAxis,
        values: [
          { type: "Deep", values: [48, 45, 50, 47] },
          { type: "Light", values: [22, 28, 20, 25] },
          { type: "Restful", values: [20, 18, 22, 20] },
          { type: "Interrupted", values: [10, 9, 8, 8] },
          { type: "Restless", values: [0, 0, 0, 0] },
        ],
      };
    } else {
      return {
        xAxis,
        values: [
          {
            type: "Deep",
            values: [45, 48, 46, 50, 47, 44, 49, 46, 48, 45, 43, 47],
          },
          {
            type: "Light",
            values: [25, 22, 26, 20, 23, 28, 22, 25, 23, 26, 29, 24],
          },
          {
            type: "Restful",
            values: [20, 22, 18, 22, 20, 18, 21, 20, 19, 20, 18, 20],
          },
          {
            type: "Interrupted",
            values: [10, 8, 10, 8, 10, 10, 8, 9, 10, 9, 10, 9],
          },
          { type: "Restless", values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        ],
      };
    }
  }, [rangeTab, currentSleepData]);

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

  // Generate table data based on current range
  const getTableData = useMemo(() => {
    if (rangeTab === "weekly") {
      return [
        {
          date: "22 July 2025",
          quality: "Light",
          sleepTime: "11:00 PM",
          wakeTime: "7:00 AM",
          duration: "8h 0m",
        },
        {
          date: "23 July 2025",
          quality: "Deep",
          sleepTime: "10:00 PM",
          wakeTime: "6:00 AM",
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
          quality: "Light",
          sleepTime: "10:30 PM",
          wakeTime: "5:30 AM",
          duration: "7h 0m",
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
          wakeTime: "7:00 AM",
          duration: "9h 0m",
        },
        {
          date: "28 July 2025",
          quality: "Deep",
          sleepTime: "9:00 PM",
          wakeTime: "7:00 AM",
          duration: "10h 0m",
        },
      ];
    } else if (rangeTab === "monthly") {
      return [
        {
          date: "Week 1 July 2025",
          quality: "Light",
          sleepTime: "10:30 PM",
          wakeTime: "6:48 AM",
          duration: "8h 18m",
        },
        {
          date: "Week 2 July 2025",
          quality: "Deep",
          sleepTime: "11:00 PM",
          wakeTime: "7:12 AM",
          duration: "8h 12m",
        },
        {
          date: "Week 3 July 2025",
          quality: "Interrupted",
          sleepTime: "10:12 PM",
          wakeTime: "6:30 AM",
          duration: "8h 18m",
        },
        {
          date: "Week 4 July 2025",
          quality: "Deep",
          sleepTime: "10:42 PM",
          wakeTime: "7:00 AM",
          duration: "8h 18m",
        },
      ];
    } else {
      return [
        {
          date: "January 2025",
          quality: "Light",
          sleepTime: "11:00 PM",
          wakeTime: "7:30 AM",
          duration: "8h 30m",
        },
        {
          date: "February 2025",
          quality: "Deep",
          sleepTime: "10:30 PM",
          wakeTime: "7:00 AM",
          duration: "8h 30m",
        },
        {
          date: "March 2025",
          quality: "Light",
          sleepTime: "10:48 PM",
          wakeTime: "6:48 AM",
          duration: "8h 0m",
        },
        {
          date: "April 2025",
          quality: "Deep",
          sleepTime: "10:12 PM",
          wakeTime: "6:30 AM",
          duration: "8h 18m",
        },
        {
          date: "May 2025",
          quality: "Light",
          sleepTime: "10:30 PM",
          wakeTime: "6:48 AM",
          duration: "8h 18m",
        },
        {
          date: "June 2025",
          quality: "Interrupted",
          sleepTime: "11:12 PM",
          wakeTime: "7:12 AM",
          duration: "8h 0m",
        },
        {
          date: "July 2025",
          quality: "Deep",
          sleepTime: "10:36 PM",
          wakeTime: "6:54 AM",
          duration: "8h 18m",
        },
        {
          date: "August 2025",
          quality: "Light",
          sleepTime: "10:48 PM",
          wakeTime: "7:00 AM",
          duration: "8h 12m",
        },
        {
          date: "September 2025",
          quality: "Deep",
          sleepTime: "10:24 PM",
          wakeTime: "6:42 AM",
          duration: "8h 18m",
        },
        {
          date: "October 2025",
          quality: "Light",
          sleepTime: "11:00 PM",
          wakeTime: "7:18 AM",
          duration: "8h 18m",
        },
        {
          date: "November 2025",
          quality: "Interrupted",
          sleepTime: "11:30 PM",
          wakeTime: "7:30 AM",
          duration: "8h 0m",
        },
        {
          date: "December 2025",
          quality: "Deep",
          sleepTime: "11:48 PM",
          wakeTime: "8:00 AM",
          duration: "8h 12m",
        },
      ];
    }
  }, [rangeTab]);

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

        {/* Custom Date Range Selector */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-4">Custom Date Range</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={
                  startDate
                    ? new Date(startDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0E1F34] border border-[#22364F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#DD3333]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={
                  endDate ? new Date(endDate).toISOString().split("T")[0] : ""
                }
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0E1F34] border border-[#22364F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#DD3333]"
              />
            </div>
          </div>
          {startDate && endDate && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Selected range: {new Date(startDate).toLocaleDateString()} -{" "}
                {new Date(endDate).toLocaleDateString()}
              </span>
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-sm text-[#DD3333] hover:text-[#FF4444]"
              >
                Clear dates
              </button>
            </div>
          )}
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
                  {currentSleepData.map((day, index) => {
                    // Calculate position and height for the sleep bar
                    const top = ((day.sleepStart - 18) / 18) * 100;
                    const height =
                      ((day.sleepEnd + 24 - day.sleepStart) / 18) * 100;

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
                              top: `${Math.max(0, Math.min(80, top))}%`,
                              height: `${Math.max(10, Math.min(60, height))}%`,
                            }}
                          ></div>
                        </div>
                        <div className="mt-2 text-xs text-center text-gray-400">
                          {formatDateForDisplay(day.date)}
                        </div>
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

                    {/* Dynamic path based on data length */}
                    <path
                      d={
                        currentSleepData.length === 7
                          ? "M0,100 C50,50 100,150 150,80 C200,200 250,60 300,180 C350,100 400,200 450,50 C500,150 550,80 600,120 L600,300 L0,300 Z"
                          : currentSleepData.length === 4
                          ? "M0,120 C150,60 300,180 450,90 C600,140 700,100 700,100 L700,300 L0,300 Z"
                          : "M0,110 C60,70 120,140 180,90 C240,160 300,80 360,130 C420,70 480,150 540,100 C600,120 660,90 700,110 L700,300 L0,300 Z"
                      }
                      fill="url(#sleepGradient)"
                    />

                    {/* Line on top of area */}
                    <path
                      d={
                        currentSleepData.length === 7
                          ? "M0,100 C50,50 100,150 150,80 C200,200 250,60 300,180 C350,100 400,200 450,50 C500,150 550,80 600,120"
                          : currentSleepData.length === 4
                          ? "M0,120 C150,60 300,180 450,90 C600,140 700,100 700,100"
                          : "M0,110 C60,70 120,140 180,90 C240,160 300,80 360,130 C420,70 480,150 540,100 C600,120 660,90 700,110"
                      }
                      fill="none"
                      stroke="#DD3333"
                      strokeWidth="3"
                    />
                  </svg>

                  {/* X-axis labels */}
                  <div className="absolute bottom-0 w-full flex justify-between px-2 text-xs text-gray-400">
                    {sleepQualityData.xAxis.map((date, index) => (
                      <div key={index} className="text-center">
                        <div>{date}</div>
                      </div>
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
                  {getTableData.map((item, index) => (
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
