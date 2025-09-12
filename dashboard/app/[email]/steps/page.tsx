"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Weekly steps data
const weeklyStepsData = [
  { steps: 8400, date: "2025-09-06" },
  { steps: 8100, date: "2025-09-07" },
  { steps: 8250, date: "2025-09-08" },
  { steps: 8550, date: "2025-09-09" },
  { steps: 9000, date: "2025-09-10" },
  { steps: 9800, date: "2025-09-11" },
  { steps: 9400, date: "2025-09-12", highlight: true },
];

// Monthly steps data
const monthlyStepsData = [
  { steps: 58500, date: "2025-08-15" },
  { steps: 61200, date: "2025-08-22" },
  { steps: 59800, date: "2025-08-29" },
  { steps: 63100, date: "2025-09-05" },
];

// Yearly steps data
const yearlyStepsData = [
  { steps: 245000, date: "2024-10-01" },
  { steps: 228000, date: "2024-11-01" },
  { steps: 267000, date: "2024-12-01" },
  { steps: 252000, date: "2025-01-01" },
  { steps: 274000, date: "2025-02-01" },
  { steps: 259000, date: "2025-03-01" },
  { steps: 282000, date: "2025-04-01" },
  { steps: 268000, date: "2025-05-01" },
  { steps: 255000, date: "2025-06-01" },
  { steps: 271000, date: "2025-07-01" },
  { steps: 248000, date: "2025-08-01" },
  { steps: 263000, date: "2025-09-01" },
];

export default function StepsScreen() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("User"); // Add userName state

  // Get current dataset based on range
  const currentStepsData = useMemo(() => {
    let baseData;
    if (rangeTab === "weekly") baseData = weeklyStepsData;
    else if (rangeTab === "monthly") baseData = monthlyStepsData;
    else baseData = yearlyStepsData;

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
        { date: "12 Sep 2025", steps: 9400, change: "+600" },
        { date: "11 Sep 2025", steps: 9800, change: "+200" },
        { date: "10 Sep 2025", steps: 9000, change: "+450" },
        { date: "9 Sep 2025", steps: 8550, change: "+300" },
        { date: "8 Sep 2025", steps: 8250, change: "+150" },
        { date: "7 Sep 2025", steps: 8100, change: "-300" },
        { date: "6 Sep 2025", steps: 8400, change: "+200" },
      ];
    } else if (rangeTab === "monthly") {
      return [
        { date: "Week 1 Sep 2025", steps: 63100, change: "+3300" },
        { date: "Week 4 Aug 2025", steps: 59800, change: "-1400" },
        { date: "Week 3 Aug 2025", steps: 61200, change: "+2700" },
        { date: "Week 2 Aug 2025", steps: 58500, change: "+1200" },
      ];
    } else {
      return [
        { date: "Sep 2025", steps: 263000, change: "+15000" },
        { date: "Aug 2025", steps: 248000, change: "-23000" },
        { date: "Jul 2025", steps: 271000, change: "+16000" },
        { date: "Jun 2025", steps: 255000, change: "-13000" },
        { date: "May 2025", steps: 268000, change: "-14000" },
        { date: "Apr 2025", steps: 282000, change: "+23000" },
        { date: "Mar 2025", steps: 259000, change: "-15000" },
        { date: "Feb 2025", steps: 274000, change: "+22000" },
        { date: "Jan 2025", steps: 252000, change: "-15000" },
        { date: "Dec 2024", steps: 267000, change: "+39000" },
        { date: "Nov 2024", steps: 228000, change: "-17000" },
        { date: "Oct 2024", steps: 245000, change: "+12000" },
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

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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

  // Calculate min and max for chart scaling
  const { minSteps, maxSteps } = useMemo(() => {
    const steps = currentStepsData.map((d) => d.steps);
    const min = Math.min(...steps);
    const max = Math.max(...steps);
    const buffer = (max - min) * 0.1;
    return {
      minSteps: Math.max(0, min - buffer),
      maxSteps: max + buffer,
    };
  }, [currentStepsData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white">
        <Navigation
          title="Workout"
          subtitle="Track your steps progress"
          email={decodeURIComponent(email)}
          userName={userName}
        />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <p>Loading steps data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Use the shared Navigation component */}
      <Navigation
        title="Steps"
        subtitle="Track your steps progress"
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
              */}
                <button
                  onClick={() => {
                    setComparisonPeriod("all");
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#22364F] ${
                    comparisonPeriod === "all" ? "bg-[#22364F]" : ""
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => {
                    setComparisonPeriod("yearly");
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#22364F] ${
                    comparisonPeriod === "yearly" ? "bg-[#22364F]" : ""
                  }`}
                >
                  Past Year
                </button>
                <button
                  onClick={() => {
                    setComparisonPeriod("quarterly");
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#22364F] ${
                    comparisonPeriod === "quarterly" ? "bg-[#22364F]" : ""
                  }`}
                >
                  Past Quarter
                </button>
                <button
                  onClick={() => {
                    setComparisonPeriod("monthly");
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#22364F] ${
                    comparisonPeriod === "monthly" ? "bg-[#22364F]" : ""
                  }`}
                >
                  Past Month
                </button>
                <button
                  onClick={() => {
                    setComparisonPeriod("weekly");
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#22364F] ${
                    comparisonPeriod === "weekly" ? "bg-[#22364F]" : ""
                  }`}
                >
                  Past Week
                </button>
                <button
                  onClick={() => {
                    setComparisonPeriod("custom");
                    setIsPeriodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#22364F] ${
                    comparisonPeriod === "custom" ? "bg-[#22364F]" : ""
                  }`}
                >
                  Custom
                </button>
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

        {/* Overall Steps Progress Card */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h3 className="font-semibold">Overall Steps Progress</h3>
              <div className="ml-2 bg-[#4CAF50] text-xs rounded-md px-2 py-0.5 flex items-center">
                <svg
                  className="w-3 h-3 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                On Track
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

          {viewMode === "graphs" ? (
            <div className="h-[300px] relative mt-6">
              {/* Y-axis steps labels */}
              <div className="absolute left-0 top-0 bottom-0 w-14 flex flex-col justify-between text-xs text-gray-400">
                <div>{Math.round(maxSteps).toLocaleString()}</div>
                <div>{Math.round(maxSteps * 0.75).toLocaleString()}</div>
                <div>{Math.round(maxSteps * 0.5).toLocaleString()}</div>
                <div>{Math.round(maxSteps * 0.25).toLocaleString()}</div>
                <div>{Math.round(minSteps).toLocaleString()}</div>
              </div>

              {/* Steps Chart */}
              <div className="ml-14 h-full flex items-end">
                {currentStepsData.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-16 ${
                        item.highlight ? "bg-[#DD3333]" : "bg-gray-500"
                      }`}
                      style={{
                        height: `${
                          ((item.steps - minSteps) / (maxSteps - minSteps)) *
                          250
                        }px`,
                      }}
                    ></div>
                    <div className="mt-2 text-xs text-center text-gray-400">
                      {formatDateForDisplay(item.date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Tabular view
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#20354A]">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Steps</th>
                    <th className="py-3 pr-4 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {getTableData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#20354A] last:border-0"
                    >
                      <td className="py-3 pr-4">{item.date}</td>
                      <td className="py-3 pr-4">
                        {item.steps.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            item.change.startsWith("+")
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
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
