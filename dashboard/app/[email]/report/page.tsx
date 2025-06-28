"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

interface ClientInfo {
  fullName: string;
  email: string;
  age: string;
  height: string;
  weight: string;
  goals: string;
}

export default function ReportPage() {
  const params = useParams();
  const [weeklyData, setWeeklyData] = useState<WeeklyForms | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [viewMode, setViewMode] = useState<"weekly" | "overview">("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("all");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const metrics = ["Weight", "Sleep Quality", "Mood", "Hunger Level"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = selectedWeek && weeklyData[selectedWeek]?.[label];
      const date = dayData ? formatDate(dayData.timestamp) : "";

      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <p className="font-medium">{`${label} (${date})`}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Add this custom tooltip component for the waist-hip ratio chart
  const WaistHipTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <p className="font-medium">{data.week}</p>
          <p className="text-xs text-gray-500">{data.weekDates}</p>
          <p style={{ color: "#9333ea" }}>
            <strong>W/H Ratio:</strong> {data.waistHipRatio}
          </p>
          {data.waist && (
            <p style={{ color: "#ec4899" }}>
              <strong>Waist:</strong> {data.waist} cm
            </p>
          )}
          {data.hip && (
            <p style={{ color: "#8b5cf6" }}>
              <strong>Hip:</strong> {data.hip} cm
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const calculateAverages = () => {
    if (!weeklyData) return [];

    let entries = Object.entries(weeklyData);

    // Filter data based on selected comparison period
    if (comparisonPeriod !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (comparisonPeriod) {
        case "monthly":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "quarterly":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "yearly":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          // Default is "all", no filtering needed
          break;
      }

      entries = entries.filter(([_, data]) => {
        const weekStartDate = getWeekStartDate(data);
        return weekStartDate && weekStartDate >= cutoffDate;
      });
    }

    return entries
      .map(([week, data]) => {
        const weights = Object.entries(data)
          .filter(
            ([key, value]): value is DayData =>
              typeof value === "object" && value !== null && "weight" in value
          )
          .map(([_, day]) => parseFloat(day.weight));

        const sleepQuality = Object.entries(data)
          .filter(
            ([key, value]): value is DayData =>
              typeof value === "object" &&
              value !== null &&
              "Sleep Quality" in value
          )
          .map(([_, day]) => day["Sleep Quality"].value);

        const mood = Object.entries(data)
          .filter(
            ([key, value]): value is DayData =>
              typeof value === "object" && value !== null && "Mood" in value
          )
          .map(([_, day]) => day.Mood.value);

        const hungerLevel = Object.entries(data)
          .filter(
            ([key, value]): value is DayData =>
              typeof value === "object" &&
              value !== null &&
              "Hunger Level" in value
          )
          .map(([_, day]) => day["Hunger Level"].value);

        return {
          week,
          weekDates: getWeekDates(data),
          avgWeight: weights.length
            ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
            : null,
          avgSleep: sleepQuality.length
            ? (
                sleepQuality.reduce((a, b) => a + b, 0) / sleepQuality.length
              ).toFixed(1)
            : null,
          avgMood: mood.length
            ? (mood.reduce((a, b) => a + b, 0) / mood.length).toFixed(1)
            : null,
          avgHunger: hungerLevel.length
            ? (
                hungerLevel.reduce((a, b) => a + b, 0) / hungerLevel.length
              ).toFixed(1)
            : null,
          waist: data.waist,
          hip: data.hip,
          waistHipRatio:
            data.waist && data.hip
              ? (parseFloat(data.waist) / parseFloat(data.hip)).toFixed(2)
              : null,
        };
      })
      .sort((a, b) => {
        // Sort by the first date in each week's data
        const aStartDate = getWeekStartDate(weeklyData[a.week]) || new Date(0);
        const bStartDate = getWeekStartDate(weeklyData[b.week]) || new Date(0);
        return aStartDate.getTime() - bStartDate.getTime(); // Ascending order by date
      });
  };

  // Helper function to get the earliest date in a week's data
  const getWeekStartDate = (weekData: WeekData) => {
    if (!weekData) return null;

    const timestamps = Object.entries(weekData)
      .filter(([key, value]) => {
        return value && typeof value === "object" && "timestamp" in value;
      })
      .map(([_, day]) => new Date(day.timestamp));

    if (timestamps.length === 0) return null;

    return new Date(Math.min(...timestamps.map((d) => d.getTime())));
  };

  const getWeekDates = (weekData: WeekData) => {
    const timestamps = Object.entries(weekData)
      .filter(([key, value]) => {
        return value && typeof value === "object" && "timestamp" in value;
      })
      .map(([_, day]) => new Date(day.timestamp));

    if (timestamps.length === 0) return "";

    const startDate = new Date(Math.min(...timestamps.map((d) => d.getTime())));
    const endDate = new Date(Math.max(...timestamps.map((d) => d.getTime())));

    return `${formatDate(startDate.toISOString())} - ${formatDate(
      endDate.toISOString()
    )}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);

        // Fetch weekly data
        const weeklyDocRef = doc(db, "weeklyForms", decodedEmail);
        const weeklyDocSnap = await getDoc(weeklyDocRef);

        // Fetch client info
        const clientDocRef = doc(db, "intakeForms", decodedEmail);
        const clientDocSnap = await getDoc(clientDocRef);

        if (weeklyDocSnap.exists()) {
          const data = weeklyDocSnap.data();
          // Remove firstEntryDate before setting the state
          const { firstEntryDate, ...weekData } = data;
          setWeeklyData(weekData as WeeklyForms);
          const weeks = Object.keys(weekData);
          setSelectedWeek(weeks[weeks.length - 1]);
        }

        if (clientDocSnap.exists()) {
          setClientInfo(clientDocSnap.data() as ClientInfo);
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.email]);

  const getColorClass = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-100 text-red-800";
      case "amber":
        return "bg-yellow-100 text-yellow-800";
      case "green":
        return "bg-green-100 text-green-800";
      default:
        return "";
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!weeklyData) return <div className="p-6">No data found</div>;

  return (
    <div className="p-4 md:p-6">
      {/* Client Info Header */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Client Name</h3>
            <p className="text-lg font-semibold">{clientInfo?.fullName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Age</h3>
            <p className="text-lg">{clientInfo?.age} years</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Starting Weight
            </h3>
            <p className="text-lg">{clientInfo?.weight} kg</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Height</h3>
            <p className="text-lg">{clientInfo?.height} cm</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500">Goals</h3>
          <p className="text-gray-700">{clientInfo?.goals}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Progress Report</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "weekly" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Weekly View
          </button>
          <button
            onClick={() => setViewMode("overview")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "overview" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Progress Overview
          </button>
          <Link
            href={`/${params.email}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Client Overview
          </Link>
        </div>
      </div>

      {viewMode === "weekly" ? (
        <>
          <div className="mb-6 relative">
            <button
              onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-between w-full sm:w-64"
            >
              <span className="truncate">
                {selectedWeek}{" "}
                {selectedWeek && weeklyData[selectedWeek]
                  ? `(${getWeekDates(weeklyData[selectedWeek])})`
                  : ""}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform flex-shrink-0 ${
                  isWeekDropdownOpen ? "rotate-180" : ""
                }`}
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

            {isWeekDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full sm:w-64 bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {Object.entries(weeklyData)
                  .filter(([week]) => week !== "firstEntryDate")
                  .sort((a, b) => {
                    // Sort by the first date in each week's data in descending order
                    const aStartDate = getWeekStartDate(a[1]) || new Date(0);
                    const bStartDate = getWeekStartDate(b[1]) || new Date(0);
                    return bStartDate.getTime() - aStartDate.getTime(); // Descending order by date
                  })
                  .map(([week, data]) => (
                    <button
                      key={week}
                      onClick={() => {
                        setSelectedWeek(week);
                        setIsWeekDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        selectedWeek === week ? "bg-blue-100" : ""
                      }`}
                    >
                      <div className="font-medium">{week}</div>
                      <div className="text-xs text-gray-500">
                        {getWeekDates(data)}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {selectedWeek &&
            (weeklyData[selectedWeek]?.waist ||
              weeklyData[selectedWeek]?.hip) && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-2">
                  Week {selectedWeek} Measurements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {weeklyData[selectedWeek]?.waist && (
                    <div>
                      <span className="text-gray-500">Waist:</span>
                      <span className="ml-2 font-medium">
                        {weeklyData[selectedWeek].waist} cm
                      </span>
                    </div>
                  )}
                  {weeklyData[selectedWeek]?.hip && (
                    <div>
                      <span className="text-gray-500">Hip:</span>
                      <span className="ml-2 font-medium">
                        {weeklyData[selectedWeek].hip} cm
                      </span>
                    </div>
                  )}
                  {weeklyData[selectedWeek]?.waist &&
                    weeklyData[selectedWeek]?.hip && (
                      <div>
                        <span className="text-gray-500">W/H Ratio:</span>
                        <span className="ml-2 font-medium">
                          {(
                            parseFloat(weeklyData[selectedWeek].waist) /
                            parseFloat(weeklyData[selectedWeek].hip)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

          <div className="overflow-auto">
            <div className="min-w-[800px]">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week {selectedWeek}
                    </th>
                    {days.map((day) => {
                      const dayData =
                        selectedWeek && weeklyData[selectedWeek]?.[day];
                      const dateStr = dayData
                        ? formatDate(dayData.timestamp)
                        : "";
                      return (
                        <th
                          key={day}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div>{day}</div>
                          <div className="text-xs font-normal text-gray-400">
                            {dateStr}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.map((metric) => (
                    <tr key={metric}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {metric}
                      </td>
                      {days.map((day) => {
                        const dayData =
                          selectedWeek && weeklyData[selectedWeek]?.[day];
                        let value = "";
                        let colorClass = "";

                        if (dayData) {
                          if (metric === "Weight") {
                            value = dayData.weight;
                          } else {
                            // Access the metrics directly using the exact key names
                            const metricKey = metric as keyof DayData;
                            const metricData = dayData[metricKey];
                            if (
                              metricData &&
                              typeof metricData === "object" &&
                              "value" in metricData
                            ) {
                              value =
                                metricData.value != null
                                  ? metricData.value.toString()
                                  : "";
                              colorClass = getColorClass(metricData.color);
                            }
                          }
                        }

                        return (
                          <td
                            key={`${day}-${metric}`}
                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${colorClass}`}
                          >
                            {value || "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Progress Charts */}
          <div className="mt-8 grid gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Weight & Measurements Chart */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Daily Weight Progress
                </h2>
                <div className="h-[420px] overflow-x-auto">
                  <div className="min-w-[500px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={days.map((day) => {
                          const dayData =
                            selectedWeek && weeklyData[selectedWeek]?.[day];
                          return {
                            day,
                            date: dayData ? formatDate(dayData.timestamp) : "",
                            weight: dayData?.weight
                              ? parseFloat(dayData.weight)
                              : null,
                          };
                        })}
                        margin={{ right: 30, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          height={60}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#2563eb"
                          name="Weight (kg)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Daily Well-being Metrics Chart */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Daily Well-being Metrics
                </h2>
                <div className="h-[420px] overflow-x-auto">
                  <div className="min-w-[500px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={days.map((day) => {
                          const dayData =
                            selectedWeek && weeklyData[selectedWeek]?.[day];
                          return {
                            day,
                            date: dayData ? formatDate(dayData.timestamp) : "",
                            sleep: dayData?.["Sleep Quality"]?.value || null,
                            mood: dayData?.Mood?.value || null,
                            hunger: dayData?.["Hunger Level"]?.value || null,
                          };
                        })}
                        margin={{ right: 30, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          height={60}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sleep"
                          stroke="#4ade80"
                          name="Sleep Quality"
                        />
                        <Line
                          type="monotone"
                          dataKey="mood"
                          stroke="#f59e0b"
                          name="Mood"
                        />
                        <Line
                          type="monotone"
                          dataKey="hunger"
                          stroke="#ef4444"
                          name="Hunger Level"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-6">
          {/* Period Selection Dropdown */}
          <div className="flex justify-end mb-2">
            <div className="relative">
              <button
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-between w-full sm:w-48"
              >
                <span>
                  {comparisonPeriod === "all"
                    ? "All Time"
                    : comparisonPeriod === "yearly"
                    ? "Past Year"
                    : comparisonPeriod === "quarterly"
                    ? "Past Quarter"
                    : "Past Month"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform ${
                    isPeriodDropdownOpen ? "rotate-180" : ""
                  }`}
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
                <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white rounded-lg shadow-lg overflow-hidden">
                  {[
                    { id: "all", label: "All Time" },
                    { id: "yearly", label: "Past Year" },
                    { id: "quarterly", label: "Past Quarter" },
                    { id: "monthly", label: "Past Month" },
                  ].map((period) => (
                    <button
                      key={period.id}
                      onClick={() => {
                        setComparisonPeriod(period.id);
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        comparisonPeriod === period.id ? "bg-blue-100" : ""
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight & Measurements Chart */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-semibold mb-4">
                Weight & Measurements Progress
              </h2>
              <div className="h-[420px] overflow-x-auto">
                <div className="min-w-[500px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={calculateAverages()}
                      margin={{ right: 30, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="week"
                        height={60}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis yAxisId="weight" orientation="left" />
                      <YAxis yAxisId="measurements" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="weight"
                        type="monotone"
                        dataKey="avgWeight"
                        stroke="#2563eb"
                        name="Average Weight (kg)"
                      />
                      <Line
                        yAxisId="measurements"
                        type="monotone"
                        dataKey="waist"
                        stroke="#ec4899"
                        name="Waist (cm)"
                      />
                      <Line
                        yAxisId="measurements"
                        type="monotone"
                        dataKey="hip"
                        stroke="#8b5cf6"
                        name="Hip (cm)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Waist-Hip Ratio Chart */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-semibold mb-4">
                Waist-Hip Ratio
              </h2>
              <div className="h-[420px] overflow-x-auto">
                <div className="min-w-[500px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={calculateAverages()}
                      margin={{ right: 30, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="week"
                        height={60}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis domain={[0.6, 1.0]} />
                      <Tooltip content={<WaistHipTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="waistHipRatio"
                        stroke="#9333ea"
                        name="Waist-Hip Ratio"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Well-being Metrics Chart */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
              <h2 className="text-lg md:text-xl font-semibold mb-4">
                Well-being Metrics
              </h2>
              <div className="h-[420px] overflow-x-auto">
                <div className="min-w-[500px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={calculateAverages()}
                      margin={{ right: 30, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="week"
                        height={60}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgSleep"
                        stroke="#4ade80"
                        name="Sleep Quality"
                      />
                      <Line
                        type="monotone"
                        dataKey="avgMood"
                        stroke="#f59e0b"
                        name="Mood"
                      />
                      <Line
                        type="monotone"
                        dataKey="avgHunger"
                        stroke="#ef4444"
                        name="Hunger Level"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Table */}
          <div className="overflow-auto">
            <div className="min-w-[900px]">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg Weight (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Weight Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Waist (cm)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hip (cm)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        W/H Ratio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg Sleep
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg Mood
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg Hunger
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculateAverages().map((weekData, index, array) => {
                      const previousWeek = index > 0 ? array[index - 1] : null;
                      const weightChange =
                        previousWeek?.avgWeight && weekData.avgWeight
                          ? (
                              parseFloat(weekData.avgWeight) -
                              parseFloat(previousWeek.avgWeight)
                            ).toFixed(1)
                          : null;

                      return (
                        <tr key={weekData.week}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {weekData.week}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {weekData.weekDates}
                          </td>
                          <td className="px-6 py-4">
                            {weekData.avgWeight || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`px-2 py-1 rounded-full inline-block ${
                                weightChange
                                  ? parseFloat(weightChange) < 0
                                    ? "bg-green-100 text-green-800"
                                    : parseFloat(weightChange) > 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                  : ""
                              }`}
                            >
                              {weightChange
                                ? `${
                                    weightChange > 0 ? "+" : ""
                                  }${weightChange} kg`
                                : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">{weekData.waist || "-"}</td>
                          <td className="px-6 py-4">{weekData.hip || "-"}</td>
                          <td className="px-6 py-4">
                            {weekData.waistHipRatio || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`px-2 py-1 rounded-full inline-block ${
                                weekData.avgSleep
                                  ? parseFloat(weekData.avgSleep) >= 4
                                    ? "bg-green-100 text-green-800"
                                    : parseFloat(weekData.avgSleep) >= 3
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                  : ""
                              }`}
                            >
                              {weekData.avgSleep || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`px-2 py-1 rounded-full inline-block ${
                                weekData.avgMood
                                  ? parseFloat(weekData.avgMood) >= 4
                                    ? "bg-green-100 text-green-800"
                                    : parseFloat(weekData.avgMood) >= 3
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                  : ""
                              }`}
                            >
                              {weekData.avgMood || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className={`px-2 py-1 rounded-full inline-block ${
                                weekData.avgHunger
                                  ? parseFloat(weekData.avgHunger) >= 4
                                    ? "bg-red-100 text-red-800"
                                    : parseFloat(weekData.avgHunger) >= 3
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                  : ""
                              }`}
                            >
                              {weekData.avgHunger || "-"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
