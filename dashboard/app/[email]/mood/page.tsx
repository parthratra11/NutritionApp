"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navigation from "../../../components/shared/Navigation";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

type MoodPoint = {
  day: string;
  mood: string;
  score: number; // 1-10
  date?: string; // Add date for filtering
};

// Weekly data
const weeklyBase: MoodPoint[] = [
  { mood: "Calm", score: 4, date: "2025-07-22" },
  { mood: "Tired", score: 3, date: "2025-07-23" },
  { mood: "Energetic", score: 6, date: "2025-07-24" },
  { mood: "Happy", score: 8, date: "2025-07-25" },
  { mood: "Low", score: 5, date: "2025-07-26" },
  { mood: "Focused", score: 7, date: "2025-07-27" },
  { mood: "Energetic", score: 9, date: "2025-07-28" },
];

// Monthly data (4 weeks)
const monthlyBase: MoodPoint[] = [
  { mood: "Mixed", score: 6, date: "2025-07-01" },
  { mood: "Happy", score: 7, date: "2025-07-08" },
  { mood: "Stressed", score: 4, date: "2025-07-15" },
  { mood: "Energetic", score: 8, date: "2025-07-22" },
];

// Yearly data (12 months)
const yearlyBase: MoodPoint[] = [
  { mood: "Calm", score: 5, date: "2025-01-01" },
  { mood: "Happy", score: 7, date: "2025-02-01" },
  { mood: "Stressed", score: 4, date: "2025-03-01" },
  { mood: "Energetic", score: 8, date: "2025-04-01" },
  { mood: "Tired", score: 3, date: "2025-05-01" },
  { mood: "Focused", score: 6, date: "2025-06-01" },
  { mood: "Happy", score: 9, date: "2025-07-01" },
  { mood: "Low", score: 4, date: "2025-08-01" },
  { mood: "Motivated", score: 7, date: "2025-09-01" },
  { mood: "Calm", score: 6, date: "2025-10-01" },
  { mood: "Anxious", score: 3, date: "2025-11-01" },
  { mood: "Peaceful", score: 8, date: "2025-12-01" },
];

export default function MoodScreen() {
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

  const dataset = useMemo(() => {
    let baseData;
    if (rangeTab === "weekly") baseData = weeklyBase;
    else if (rangeTab === "monthly") baseData = monthlyBase;
    else baseData = yearlyBase;

    // Filter by custom date range if both dates are selected
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return baseData.filter((item) => {
        const itemDate = new Date(item.date!);
        return itemDate >= start && itemDate <= end;
      });
    }

    return baseData;
  }, [rangeTab, startDate, endDate]);

  const currentDayIndex = 28;
  const daysOfWeek = ["S", "M", "T", "W", "Th", "F", "S"];
  const weekDays = [22, 23, 24, 25, 26, 27, 28];

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

  // Helper function to format date for display
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Generate table data based on current range
  const getTableData = useMemo(() => {
    if (rangeTab === "weekly") {
      return [
        { date: "22 July 2025", mood: "Calm" },
        { date: "23 July 2025", mood: "Tired" },
        { date: "24 July 2025", mood: "Energetic" },
        { date: "25 July 2025", mood: "Happy" },
        { date: "26 July 2025", mood: "Low" },
        { date: "27 July 2025", mood: "Focused" },
        { date: "28 July 2025", mood: "Energetic" },
      ];
    } else if (rangeTab === "monthly") {
      return [
        { date: "01 July 2025", mood: "Mixed" },
        { date: "08 July 2025", mood: "Happy" },
        { date: "15 July 2025", mood: "Stressed" },
        { date: "22 July 2025", mood: "Energetic" },
        { date: "29 July 2025", mood: "Calm" },
      ];
    } else {
      return [
        { date: "January 2025", mood: "Calm" },
        { date: "February 2025", mood: "Happy" },
        { date: "March 2025", mood: "Stressed" },
        { date: "April 2025", mood: "Energetic" },
        { date: "May 2025", mood: "Tired" },
        { date: "June 2025", mood: "Focused" },
        { date: "July 2025", mood: "Happy" },
        { date: "August 2025", mood: "Low" },
        { date: "September 2025", mood: "Motivated" },
        { date: "October 2025", mood: "Calm" },
        { date: "November 2025", mood: "Anxious" },
        { date: "December 2025", mood: "Peaceful" },
      ];
    }
  }, [rangeTab]);

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Use the shared Navigation component */}
      <Navigation
        title="Mood Tracking"
        subtitle="Track your daily mood patterns"
        email={decodeURIComponent(email)}
        userName={userName}
      />

      <div className="px-4 py-6 space-y-8">
        {/* View mode toggle above the Mood History Card */}
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

        {/* Mood Graph / Table */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Mood</h3>
            <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
              <button
                onClick={() => setRangeTab("weekly")}
                className={`px-5 py-2 text-sm ${
                  rangeTab === "weekly" ? "bg-white text-[#07172C]" : ""
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setRangeTab("monthly")}
                className={`px-5 py-2 text-sm ${
                  rangeTab === "monthly" ? "bg-white text-[#07172C]" : ""
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setRangeTab("yearly")}
                className={`px-5 py-2 text-sm ${
                  rangeTab === "yearly" ? "bg-white text-[#07172C]" : ""
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {viewMode === "graphs" ? (
            <div className="h-[380px] relative">
              {/* Bubbles */}
              <div
                className="absolute inset-0"
                style={{ height: "calc(100% - 40px)" }}
              >
                {dataset.map((d, idx) => {
                  // Dynamic positions based on data length
                  const positions =
                    dataset.length === 7
                      ? ["8%", "18%", "32%", "45%", "60%", "75%", "88%"]
                      : dataset.length === 4
                      ? ["20%", "40%", "60%", "80%"]
                      : [
                          "8%",
                          "16%",
                          "24%",
                          "32%",
                          "40%",
                          "48%",
                          "56%",
                          "64%",
                          "72%",
                          "80%",
                          "88%",
                          "96%",
                        ];

                  const position = {
                    left: positions[idx] || "50%",
                    top: `${Math.random() * 60 + 20}%`,
                  };

                  const size = 30 + d.score * 5;

                  return (
                    <div
                      key={idx}
                      className="absolute rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        left: position.left,
                        top: position.top,
                        width: size,
                        height: size,
                        transform: "translate(-50%, -50%)",
                        background:
                          "radial-gradient(circle at 30% 30%, #E04A42, #C22F28)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.35)",
                      }}
                    >
                      {d.score}
                    </div>
                  );
                })}
              </div>

              {/* X-axis dates at bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                {dataset.map((d, idx) => {
                  const positions =
                    dataset.length === 7
                      ? ["8%", "18%", "32%", "45%", "60%", "75%", "88%"]
                      : dataset.length === 4
                      ? ["20%", "40%", "60%", "80%"]
                      : [
                          "8%",
                          "16%",
                          "24%",
                          "32%",
                          "40%",
                          "48%",
                          "56%",
                          "64%",
                          "72%",
                          "80%",
                          "88%",
                          "96%",
                        ];

                  return (
                    <div
                      key={`date-${idx}`}
                      className="text-xs text-gray-400 text-center"
                      style={{
                        position: "absolute",
                        left: positions[idx],
                        transform: "translateX(-50%)",
                      }}
                    >
                      {formatDateForDisplay(d.date)}
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
                  {getTableData.map((item, index) => (
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
