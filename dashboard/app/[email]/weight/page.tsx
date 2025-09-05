"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Backend data interfaces
interface DayData {
  weight: string;
  email: string;
  timestamp: string;
  Mood: { value: number; color: string };
  "Sleep Quality": { value: number; color: string };
  "Hunger Level": { value: number; color: string };
}

interface WeekData {
  [day: string]: DayData;
  waist?: string;
  hip?: string;
}

interface WeeklyForms {
  [week: string]: WeekData;
}

export default function WeightScreen() {
  const params = useParams();
  const router = useRouter();
  const email = params.email as string;
  const [viewMode, setViewMode] = useState<"graphs" | "tabular">("graphs");
  const [rangeTab, setRangeTab] = useState<"weekly" | "monthly" | "yearly">(
    "weekly"
  );
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("all");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [userName, setUserName] = useState<string>("User");

  // Backend data states
  const [weeklyData, setWeeklyData] = useState<WeeklyForms | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const getDayName = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Calculate daily weight data
  const calculateDailyWeights = () => {
    if (!weeklyData) return [];

    const allDays: {
      date: string;
      formattedDate: string;
      weight: number | null;
      timestamp: string;
      dayName: string;
    }[] = [];

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    Object.entries(weeklyData).forEach(([weekKey, weekData]) => {
      if (weekKey === "firstEntryDate") return;

      days.forEach((day) => {
        const dayData = weekData[day];
        if (!dayData || !dayData.timestamp || !dayData.weight) return;

        allDays.push({
          date: dayData.timestamp,
          formattedDate: formatDate(dayData.timestamp),
          weight: parseFloat(dayData.weight),
          timestamp: dayData.timestamp,
          dayName: getDayName(dayData.timestamp),
        });
      });
    });

    // Apply date filtering
    let filteredDays = allDays;

    if (comparisonPeriod === "custom" && startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      filteredDays = allDays.filter((day) => {
        const dayDate = new Date(day.date);
        return dayDate >= startDateObj && dayDate <= endDateObj;
      });
    } else if (comparisonPeriod !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (comparisonPeriod) {
        case "weekly":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "quarterly":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "yearly":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filteredDays = allDays.filter((day) => new Date(day.date) >= cutoffDate);
    }

    return filteredDays.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Calculate monthly averages
  const calculateMonthlyAverages = () => {
    const dailyData = calculateDailyWeights();
    const monthlyData: { [month: string]: { total: number; count: number } } =
      {};

    dailyData.forEach((day) => {
      if (day.weight === null) return;

      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, count: 0 };
      }

      monthlyData[monthKey].total += day.weight;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([monthKey, data]) => ({
        month: monthKey,
        label: new Date(monthKey + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        weight: parseFloat((data.total / data.count).toFixed(1)),
        formattedDate: new Date(monthKey + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      }))
      .sort(
        (a, b) =>
          new Date(a.month + "-01").getTime() -
          new Date(b.month + "-01").getTime()
      );
  };

  // Get filtered data based on range tab
  const getFilteredData = () => {
    const dailyData = calculateDailyWeights();

    if (comparisonPeriod === "custom" && startDate && endDate) {
      const daysDifference =
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 3600 * 24);
      if (daysDifference < 14) {
        return dailyData;
      }
    }

    switch (rangeTab) {
      case "weekly":
        return dailyData.slice(-7);
      case "monthly":
        return dailyData.slice(-30);
      case "yearly":
        return calculateMonthlyAverages();
      default:
        return dailyData;
    }
  };

  // Custom tooltip for weight chart
  const WeightTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-medium">
            {rangeTab === "yearly"
              ? data.label
              : `${data.dayName} - ${data.formattedDate}`}
          </p>
          <p style={{ color: payload[0].color }}>
            <strong>Weight:</strong> {payload[0].value} kg
          </p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);

        // Fetch user info
        const clientDocRef = doc(db, "intakeForms", decodedEmail);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          setUserName(clientData.fullName || "User");
        }

        // Fetch weekly data
        const weeklyDocRef = doc(db, "weeklyForms", decodedEmail);
        const weeklyDocSnap = await getDoc(weeklyDocRef);

        if (weeklyDocSnap.exists()) {
          const data = weeklyDocSnap.data();
          const { firstEntryDate, ...weekData } = data;
          setWeeklyData(weekData as WeeklyForms);
        } else {
          setError("No weight data found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch weight data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white">
        <Navigation
          title="Weight"
          subtitle="Track your weight progress"
          email={decodeURIComponent(email)}
          userName={userName}
        />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <p>Loading weight data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white">
        <Navigation
          title="Weight"
          subtitle="Track your weight progress"
          email={decodeURIComponent(email)}
          userName={userName}
        />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      <Navigation
        title="Weight"
        subtitle="Track your weight progress"
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
                {[
                  { id: "all", label: "All Time" },
                  { id: "yearly", label: "Past Year" },
                  { id: "quarterly", label: "Past Quarter" },
                  { id: "monthly", label: "Past Month" },
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

        {/* Custom Date Range Selector */}
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
          </div>
        )}

        {/* Weight Graph or Table */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h3 className="font-semibold">Weight Progress</h3>
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
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getFilteredData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey={rangeTab === "yearly" ? "label" : "formattedDate"}
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8" }}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <Tooltip content={<WeightTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#DD3333"
                    strokeWidth={3}
                    dot={{ fill: "#DD3333", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "#DD3333", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#20354A]">
                    <th className="py-3 pr-4 font-medium">
                      {rangeTab === "yearly" ? "Month" : "Date"}
                    </th>
                    <th className="py-3 pr-4 font-medium">
                      {rangeTab === "yearly" ? "Avg Weight" : "Weight"}
                    </th>
                    <th className="py-3 pr-4 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData()
                    .slice()
                    .reverse()
                    .map((item, index, array) => {
                      const nextItem = array[index + 1];
                      const weightChange = nextItem
                        ? (item.weight - nextItem.weight).toFixed(1)
                        : null;

                      return (
                        <tr
                          key={rangeTab === "yearly" ? item.month : item.date}
                          className="border-b border-[#20354A] last:border-0"
                        >
                          <td className="py-3 pr-4">
                            {rangeTab === "yearly"
                              ? item.label
                              : item.formattedDate}
                          </td>
                          <td className="py-3 pr-4">{item.weight} kg</td>
                          <td className="py-3 pr-4">
                            {weightChange ? (
                              <span
                                className={
                                  parseFloat(weightChange) > 0
                                    ? "text-red-500"
                                    : parseFloat(weightChange) < 0
                                    ? "text-green-500"
                                    : "text-gray-400"
                                }
                              >
                                {parseFloat(weightChange) > 0 ? "+" : ""}
                                {weightChange} kg
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
