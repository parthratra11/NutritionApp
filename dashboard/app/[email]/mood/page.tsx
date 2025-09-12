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
  { mood: "Calm", score: 4, date: "2025-09-06" },
  { mood: "Tired", score: 3, date: "2025-09-07" },
  { mood: "Energetic", score: 6, date: "2025-09-08" },
  { mood: "Happy", score: 8, date: "2025-09-09" },
  { mood: "Low", score: 5, date: "2025-09-10" },
  { mood: "Focused", score: 7, date: "2025-09-11" },
  { mood: "Energetic", score: 9, date: "2025-09-12" },
];

// Monthly data (4 weeks)
const monthlyBase: MoodPoint[] = [
  { mood: "Mixed", score: 6, date: "2025-08-15" },
  { mood: "Happy", score: 7, date: "2025-08-22" },
  { mood: "Stressed", score: 4, date: "2025-08-29" },
  { mood: "Energetic", score: 8, date: "2025-09-05" },
];

// Yearly data (12 months)
const yearlyBase: MoodPoint[] = [
  { mood: "Calm", score: 5, date: "2024-10-01" },
  { mood: "Happy", score: 7, date: "2024-11-01" },
  { mood: "Stressed", score: 4, date: "2024-12-01" },
  { mood: "Energetic", score: 8, date: "2025-01-01" },
  { mood: "Tired", score: 3, date: "2025-02-01" },
  { mood: "Focused", score: 6, date: "2025-03-01" },
  { mood: "Happy", score: 9, date: "2025-04-01" },
  { mood: "Low", score: 4, date: "2025-05-01" },
  { mood: "Motivated", score: 7, date: "2025-06-01" },
  { mood: "Calm", score: 6, date: "2025-07-01" },
  { mood: "Anxious", score: 3, date: "2025-08-01" },
  { mood: "Peaceful", score: 8, date: "2025-09-01" },
];

export default function MoodScreen() {
  const params = useParams();
  const router = useRouter();
  const email = params.email as string;
  const [viewMode, setViewMode] = useState<"graphs" | "tabular">("graphs");
  const [rangeTab, setRangeTab] = useState<"weekly" | "monthly" | "yearly">(
    "weekly"
  );
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("all");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  // Pre-fill with updated date range
  const [startDate, setStartDate] = useState<string>("2025-09-06");
  const [endDate, setEndDate] = useState<string>("2025-09-12");
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

  // Helper function to format date for display (consistent format)
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  // Helper function to format date input value for display in the date range section
  const formatDateRangeDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    return formatDateForDisplay(dateStr);
  };

  // Generate table data based on current range
  const getTableData = useMemo(() => {
    if (rangeTab === "weekly") {
      return [
        { date: "6 Sep 2025", mood: "Calm" },
        { date: "7 Sep 2025", mood: "Tired" },
        { date: "8 Sep 2025", mood: "Energetic" },
        { date: "9 Sep 2025", mood: "Happy" },
        { date: "10 Sep 2025", mood: "Low" },
        { date: "11 Sep 2025", mood: "Focused" },
        { date: "12 Sep 2025", mood: "Energetic" },
      ];
    } else if (rangeTab === "monthly") {
      return [
        { date: "15 Aug 2025", mood: "Mixed" },
        { date: "22 Aug 2025", mood: "Happy" },
        { date: "29 Aug 2025", mood: "Stressed" },
        { date: "5 Sep 2025", mood: "Energetic" },
        { date: "12 Sep 2025", mood: "Calm" },
      ];
    } else {
      return [
        { date: "Oct 2024", mood: "Calm" },
        { date: "Nov 2024", mood: "Happy" },
        { date: "Dec 2024", mood: "Stressed" },
        { date: "Jan 2025", mood: "Energetic" },
        { date: "Feb 2025", mood: "Tired" },
        { date: "Mar 2025", mood: "Focused" },
        { date: "Apr 2025", mood: "Happy" },
        { date: "May 2025", mood: "Low" },
        { date: "Jun 2025", mood: "Motivated" },
        { date: "Jul 2025", mood: "Calm" },
        { date: "Aug 2025", mood: "Anxious" },
        { date: "Sep 2025", mood: "Peaceful" },
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
        {/* Period Selection and View Mode Toggle */}
        <div className="flex justify-between items-center">
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

          <div className="relative w-48">
            <button
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="px-4 py-2 bg-[#142437] border border-[#22364F] text-white rounded-lg flex items-center justify-between w-full"
            >
              <span>
                {comparisonPeriod === "all"
                  ? "All Time"
                  : comparisonPeriod === "yearly"
                  ? "Past Year"
                  : comparisonPeriod === "quarterly"
                  ? "Past Quarter"
                  : comparisonPeriod === "monthly"
                  ? "Past Month"
                  : comparisonPeriod === "weekly"
                  ? "Past Week"
                  : "Custom"}
              </span>
              <svg
                className={`h-5 w-5 transition-transform ${
                  isPeriodDropdownOpen ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isPeriodDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-[#142437] border border-[#22364F] rounded-lg shadow-lg overflow-hidden">
                {/*
                  Dropdown options for time periods. When a period is clicked,
                  it sets the comparisonPeriod state and closes the dropdown.
                */}
                {/*
                  - All Time
                  - Past Year
                  - Past Quarter
                  - Past Month
                  - Past Week
                  - Custom
                */}
                {/*
                  Note: The actual filtering logic based on these periods needs
                  to be implemented in the data processing section.
                */}
                {/*
                  For "Custom", you might want to show the date range inputs
                  (startDate and endDate) to allow users to pick a custom range.
                */}
                {/*
                  Consider adding icons or different styles for each period type
                  to make it visually distinct.
                */}
                {/*
                  You can also add animations for the dropdown appearance/disappearance
                  for a smoother user experience.
                */}
                {/*
                  Ensure that the dropdown is accessible, with proper keyboard navigation
                  and screen reader support.
                */}
                {/*
                  Optionally, add a "Reset" option to clear the selection and show all data.
                */}
                {/*
                  Remember to handle edge cases, like what happens if there's no data
                  for the selected period, or if the user navigates away from the page.
                */}
                {/*
                  Test the dropdown on different screen sizes and orientations
                  to ensure it works well on all devices.
                */}
                {/*
                  You might also want to add a delay before closing the dropdown
                  after an option is selected, to allow time for the button press to register.
                */}
                {/*
                  Consider using a context or global state if this period selection
                  needs to be accessed by other components or pages.
                */}
                {/*
                  If the user has a very large amount of data, consider adding
                  server-side filtering or pagination to handle the data load.
                */}
                {/*
                  - All Time
                  - Past Year
                  - Past Quarter
                  - Past Month
                  - Past Week
                  - Custom
                */}
                {[
                  { id: "all", label: "All Time" },
                  { id: "yearly", label: "Past Year" },
                  { id: "quarterly", label: "Past Quarter" },
                  { id: "monthly", label: "Past Month" },
                  { id: "weekly", label: "Past Week" },
                  { id: "custom", label: "Custom" },
                ].map((period) => (
                  <button
                    key={period.id}
                    onClick={() => {
                      setComparisonPeriod(period.id);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-[#22364F] ${
                      comparisonPeriod === period.id ? "bg-[#22364F]" : ""
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Date Range Selector - Only show when custom is selected */}
        {comparisonPeriod === "custom" && (
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Custom Date Range
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E1F34] border border-[#22364F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#DD3333]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E1F34] border border-[#22364F] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#DD3333]"
                />
              </div>
            </div>
            {startDate && endDate && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Selected range: {formatDateRangeDisplay(startDate)} -{" "}
                  {formatDateRangeDisplay(endDate)}
                </span>
                <button
                  onClick={() => {
                    setStartDate("2025-07-22");
                    setEndDate("2025-07-28");
                  }}
                  className="text-sm text-[#DD3333] hover:text-[#FF4444]"
                >
                  Reset to default
                </button>
              </div>
            )}
          </div>
        )}

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
