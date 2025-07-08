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
  BarChart,
  Bar,
} from "recharts";
import Navigation from "@/components/shared/Navigation";

interface MealData {
  "Protein (g)": string;
  "Fat (g)": string;
  "Carbohydrate (g)": string;
  Kcal: string;
}

interface DayData {
  date: string;
  dayType: string;
  meals: {
    [meal: string]: MealData;
  };
  totals: {
    "Protein (g)": number;
    "Fat (g)": number;
    "Carbohydrate (g)": number;
    Kcal: number;
  };
}

interface WeekData {
  [week: string]: {
    dates: string[];
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    avgCalories: number;
    dayTypes: string[];
    dailyData: {
      [date: string]: {
        dayType: string;
        meals: { [meal: string]: MealData };
        totals: {
          "Protein (g)": number;
          "Fat (g)": number;
          "Carbohydrate (g)": number;
          Kcal: number;
        };
      };
    };
  };
}

interface NutritionDataStructure {
  firstEntryDate: string;
  [week: string]: WeekData | string;
}

export default function NutritionPage() {
  const params = useParams();
  const [weeklyData, setWeeklyData] = useState<WeekData | null>(null);
  const [viewMode, setViewMode] = useState<"weekly" | "overview">("weekly");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("all");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{
    date: string;
    data: any;
  } | null>(null);

  const clientName = params?.email
    ? decodeURIComponent(params.email as string).split("@")[0]
    : "Client";

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const groupDataByWeeks = (data: NutritionDataStructure): WeekData => {
    const weeks: WeekData = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key === "firstEntryDate") return;

      const weekNum = parseInt(key.replace("week", ""));
      const weekKey = `Week ${weekNum}`;

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          dates: [],
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
          avgCalories: 0,
          dayTypes: [],
          dailyData: {},
        };
      }

      const weekData = value as WeekData;
      Object.entries(weekData).forEach(([day, dayData]) => {
        if (dayData.date) {
          weeks[weekKey].dates.push(dayData.date);
          weeks[weekKey].avgProtein += dayData.totals["Protein (g)"];
          weeks[weekKey].avgCarbs += dayData.totals["Carbohydrate (g)"];
          weeks[weekKey].avgFat += dayData.totals["Fat (g)"];
          weeks[weekKey].avgCalories += dayData.totals.Kcal;
          weeks[weekKey].dayTypes.push(dayData.dayType);
          weeks[weekKey].dailyData[dayData.date] = {
            dayType: dayData.dayType,
            meals: dayData.meals,
            totals: dayData.totals,
          };
        }
      });

      const daysCount = weeks[weekKey].dates.length;
      if (daysCount > 0) {
        weeks[weekKey].avgProtein = parseFloat(
          (weeks[weekKey].avgProtein / daysCount).toFixed(1)
        );
        weeks[weekKey].avgCarbs = parseFloat(
          (weeks[weekKey].avgCarbs / daysCount).toFixed(1)
        );
        weeks[weekKey].avgFat = parseFloat(
          (weeks[weekKey].avgFat / daysCount).toFixed(1)
        );
        weeks[weekKey].avgCalories = parseFloat(
          (weeks[weekKey].avgCalories / daysCount).toFixed(1)
        );
      }
    });

    return weeks;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  const getWeekRange = (dates: string[]) => {
    const sortedDates = dates.sort();
    return `${formatDate(sortedDates[0])} - ${formatDate(
      sortedDates[sortedDates.length - 1]
    )}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);
        const docRef = doc(db, "nutrition", decodedEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as NutritionDataStructure;
          const weeks = groupDataByWeeks(data);
          setWeeklyData(weeks);
          const weeksList = Object.keys(weeks);
          setSelectedWeek(weeksList[weeksList.length - 1]);
        }
      } catch (err) {
        setError("Failed to fetch nutrition data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.email]);

  const NutritionModal = ({
    isOpen,
    onClose,
    date,
    dayData,
  }: {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    dayData: any;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
        <div
          className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4">
          <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-semibold">
                {getDayName(date)} - {formatDate(date)}
              </h2>
              <p className="text-gray-500">{dayData.dayType} Day</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dayData.meals &&
                Object.entries(dayData.meals).map(
                  ([meal, data]: [string, MealData]) => (
                    <div key={meal} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-lg mb-2">{meal}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Protein</p>
                          <p className="font-medium">{data["Protein (g)"]}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Carbs</p>
                          <p className="font-medium">
                            {data["Carbohydrate (g)"]}g
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fat</p>
                          <p className="font-medium">{data["Fat (g)"]}g</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Calories</p>
                          <p className="font-medium">{data.Kcal}</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-lg mb-3">Daily Totals</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Protein</p>
                    <p className="font-medium">
                      {dayData.totals["Protein (g)"]}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Carbs</p>
                    <p className="font-medium">
                      {dayData.totals["Carbohydrate (g)"]}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Fat</p>
                    <p className="font-medium">{dayData.totals["Fat (g)"]}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Calories</p>
                    <p className="font-medium">{dayData.totals.Kcal}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = weeklyData && selectedWeek ? weeklyData[selectedWeek]?.dailyData[label] : null;
      if (!dayData) return null;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[300px]">
          <div className="border-b pb-2 mb-3">
            <p className="font-medium">
              {getDayName(label)} - {formatDate(label)}
            </p>
            <p className="text-sm text-gray-500">{dayData.dayType} Day</p>
          </div>
          {dayData.meals &&
            Object.entries(dayData.meals).map(
              ([meal, data]: [string, MealData]) => (
                <div key={meal} className="mb-3">
                  <p className="font-medium text-gray-700 mb-1">{meal}</p>
                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <p className="text-gray-600">
                      Protein: {data["Protein (g)"]}g
                    </p>
                    <p className="text-gray-600">
                      Carbs: {data["Carbohydrate (g)"]}g
                    </p>
                    <p className="text-gray-600">Fat: {data["Fat (g)"]}g</p>
                    <p className="text-gray-600">Calories: {data.Kcal}</p>
                  </div>
                </div>
              )
            )}
          <div className="border-t pt-2 mt-2">
            <p className="font-medium text-gray-700 mb-1">Daily Totals</p>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
              <p className="text-gray-600">
                Protein: {dayData.totals["Protein (g)"]}g
              </p>
              <p className="text-gray-600">
                Carbs: {dayData.totals["Carbohydrate (g)"]}g
              </p>
              <p className="text-gray-600">Fat: {dayData.totals["Fat (g)"]}g</p>
              <p className="text-gray-600">Calories: {dayData.totals.Kcal}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getFilteredWeeklyData = () => {
    if (!weeklyData) return {};

    if (comparisonPeriod === "all") {
      return weeklyData;
    }

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
        return weeklyData;
    }

    return Object.entries(weeklyData).reduce((filtered, [week, data]) => {
      const earliestDate = new Date(
        Math.min(...data.dates.map((d) => new Date(d).getTime()))
      );

      if (earliestDate >= cutoffDate) {
        filtered[week] = data;
      }

      return filtered;
    }, {} as WeekData);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!weeklyData) return <div className="p-6">No nutrition data found</div>;

  const filteredData = getFilteredWeeklyData();

  const summaryMetrics = [
    {
      label: "Avg Protein",
      value: `${weeklyData[selectedWeek]?.avgProtein || 0}g`,
      color: "bg-green-100 text-green-800",
    },
    {
      label: "Avg Carbs",
      value: `${weeklyData[selectedWeek]?.avgCarbs || 0}g`,
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      label: "Avg Fat",
      value: `${weeklyData[selectedWeek]?.avgFat || 0}g`,
      color: "bg-red-100 text-red-800",
    },
    {
      label: "Avg Calories",
      value: `${weeklyData[selectedWeek]?.avgCalories || 0}`,
      color: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        title={`${clientName}'s Nutrition`}
        subtitle="Nutrition Progress"
        email={params.email as string}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-6 py-2.5 rounded-lg transition-colors ${
              viewMode === "weekly"
                ? "bg-[#0a1c3f] text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } font-medium text-sm`}
          >
            Weekly View
          </button>
          <button
            onClick={() => setViewMode("overview")}
            className={`px-6 py-2.5 rounded-lg transition-colors ${
              viewMode === "overview"
                ? "bg-[#0a1c3f] text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } font-medium text-sm`}
          >
            Progress Overview
          </button>
        </div>

        {viewMode === "weekly" ? (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Select Week</h2>
              <div className="overflow-x-auto">
                <div className="flex gap-3">
                  {Object.entries(weeklyData).map(([week, data]) => (
                    <button
                      key={week}
                      onClick={() => setSelectedWeek(week)}
                      className={`flex-shrink-0 px-4 py-3 rounded-lg transition-colors ${
                        selectedWeek === week
                          ? "bg-[#0a1c3f] text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      <div className="text-sm font-medium">{week}</div>
                      <div className="text-xs opacity-75">
                        {getWeekRange(data.dates)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {selectedWeek && weeklyData[selectedWeek] && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Weekly Summary</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summaryMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="bg-white rounded-lg p-4 border border-gray-200"
                      >
                        <div className="text-sm text-gray-500">
                          {metric.label}
                        </div>
                        <div
                          className={`text-xl font-semibold mt-1 ${metric.color} inline-block px-2 py-1 rounded-full`}
                        >
                          {metric.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                    <h2 className="text-lg md:text-xl font-semibold mb-4">
                      Weekly Macronutrients
                    </h2>
                    <div className="h-[400px] overflow-x-auto">
                      <div className="min-w-[500px] h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={weeklyData[selectedWeek].dates.map(
                              (date) => ({
                                date,
                                protein:
                                  weeklyData[selectedWeek].dailyData[date]
                                    .totals["Protein (g)"],
                                carbs:
                                  weeklyData[selectedWeek].dailyData[date]
                                    .totals["Carbohydrate (g)"],
                                fat: weeklyData[selectedWeek].dailyData[date]
                                  .totals["Fat (g)"],
                              })
                            )}
                            margin={{ right: 30, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) =>
                                `${getDayName(date).slice(0, 3)} ${formatDate(
                                  date
                                )}`
                              }
                              height={60}
                              angle={-45}
                              textAnchor="end"
                            />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                              dataKey="protein"
                              fill="#4ade80"
                              name="Protein"
                            />
                            <Bar dataKey="carbs" fill="#f59e0b" name="Carbs" />
                            <Bar dataKey="fat" fill="#ef4444" name="Fat" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                    <h2 className="text-lg md:text-xl font-semibold mb-4">
                      Weekly Calories
                    </h2>
                    <div className="h-[400px] overflow-x-auto">
                      <div className="min-w-[500px] h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={weeklyData[selectedWeek].dates.map(
                              (date) => ({
                                date,
                                calories:
                                  weeklyData[selectedWeek].dailyData[date]
                                    .totals.Kcal,
                              })
                            )}
                            margin={{ right: 30, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) =>
                                `${getDayName(date).slice(0, 3)} ${formatDate(
                                  date
                                )}`
                              }
                              height={60}
                              angle={-45}
                              textAnchor="end"
                            />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                              dataKey="calories"
                              fill="#8b5cf6"
                              name="Calories"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Day Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Protein (g)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Carbs
                          (g)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fat (g)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Calories
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {weeklyData[selectedWeek].dates.map((date) => {
                        const dayData =
                          weeklyData[selectedWeek].dailyData[date];
                        return (
                          <tr key={date}>
                            <td
                              className="px-6 py-4 cursor-pointer hover:text-blue-600"
                              onClick={() => {
                                const dayData =
                                  weeklyData[selectedWeek].dailyData[date];
                                setSelectedDateData({
                                  date,
                                  data: dayData,
                                });
                                setIsModalOpen(true);
                              }}
                            >
                              {formatDate(date)}
                            </td>
                            <td className="px-6 py-4">{dayData.dayType}</td>
                            <td className="px-6 py-4">
                              {dayData.totals["Protein (g)"]}
                            </td>
                            <td className="px-6 py-4">
                              {dayData.totals["Carbohydrate (g)"]}
                            </td>
                            <td className="px-6 py-4">
                              {dayData.totals["Fat (g)"]}
                            </td>
                            <td className="px-6 py-4">
                              {dayData.totals.Kcal}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-6 py-4">Week Average</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">
                          {weeklyData[selectedWeek].avgProtein}
                        </td>
                        <td className="px-6 py-4">
                          {weeklyData[selectedWeek].avgCarbs}
                        </td>
                        <td className="px-6 py-4">
                          {weeklyData[selectedWeek].avgFat}
                        </td>
                        <td className="px-6 py-4">
                          {weeklyData[selectedWeek].avgCalories}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end mb-2">
              <div className="relative w-full sm:w-48">
                <button
                  onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-between w-full"
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
                    className="h-5 w-5 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}"
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
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg overflow-hidden">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Macronutrients Progress
                </h2>
                <div className="h-[400px] overflow-x-auto">
                  <div className="min-w-[500px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={Object.entries(filteredData).map(
                          ([week, data]) => ({
                            week,
                            protein: data.avgProtein,
                            carbs: data.avgCarbs,
                            fat: data.avgFat,
                          })
                        )}
                        margin={{ right: 30, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="protein"
                          stroke="#4ade80"
                          name="Avg Protein (g)"
                        />
                        <Line
                          type="monotone"
                          dataKey="carbs"
                          stroke="#f59e0b"
                          name="Avg Carbs (g)"
                        />
                        <Line
                          type="monotone"
                          dataKey="fat"
                          stroke="#ef4444"
                          name="Avg Fat (g)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Calories Progress
                </h2>
                <div className="h-[400px] overflow-x-auto">
                  <div className="min-w-[500px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      >
                      <LineChart
                        data={Object.entries(filteredData).map(
                          ([week, data]) => ({
                            week,
                            calories: data.avgCalories,
                          })
                        )}
                        margin={{ right: 30, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="calories"
                          stroke="#8b5cf6"
                          name="Avg Calories"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              <div className="min-w-[800px]">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Week
                            </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date Range
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Avg Protein (g)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Avg Carbs (g)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Avg Fat (g)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Avg Calories
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(filteredData).map(([week, data]) => (
                        <tr key={week}>
                          <td className="px-6 py-4">{week}</td>
                          <td className="px-6 py-4">
                            {getWeekRange(data.dates)}
                          </td>
                          <td className="px-6 py-4">{data.avgProtein}</td>
                          <td className="px-6 py-4">{data.avgCarbs}</td>
                          <td className="px-6 py-4">{data.avgFat}</td>
                          <td className="px-6 py-4">{data.avgCalories}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {selectedDateData && (
        <NutritionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDateData(null);
          }}
          date={selectedDateData.date}
          dayData={selectedDateData.data}
        />
      )}
    </div>
  );
}