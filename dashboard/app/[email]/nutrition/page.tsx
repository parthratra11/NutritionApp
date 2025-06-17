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
  [day: string]: DayData;
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{
    date: string;
    data: any;
  } | null>(null);

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
            meals: dayData.meals, // Include meals data
            totals: dayData.totals,
          };
        }
      });

      // Calculate averages
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

  // Add this component after the CustomTooltip
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                {getDayName(date)} - {formatDate(date)}
              </h2>
              <p className="text-gray-500">{dayData.dayType} Day</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
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

          {/* Meals Breakdown */}
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

          {/* Daily Totals */}
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
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = weeklyData[selectedWeek]?.dailyData[label];
      if (!dayData) return null;

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[300px]">
          <div className="border-b pb-2 mb-3">
            <p className="font-medium">
              {getDayName(label)} - {formatDate(label)}
            </p>
            <p className="text-sm text-gray-500">{dayData.dayType} Day</p>
          </div>

          {/* Meals Breakdown */}
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

          {/* Daily Totals */}
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!weeklyData) return <div className="p-6">No nutrition data found</div>;
  return (
    <div className="p-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nutrition Report</h1>
        <div className="flex gap-4">
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
          {/* Week Selection */}
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.entries(weeklyData).map(([week, data]) => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`px-4 py-2 rounded-lg ${
                  selectedWeek === week
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <div className="text-sm font-medium">{week}</div>
                <div className="text-xs opacity-75">
                  {getWeekRange(data.dates)}
                </div>
              </button>
            ))}
          </div>

          {selectedWeek && weeklyData[selectedWeek] && (
            <div className="grid gap-6">
              {/* Weekly Summary */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Weekly Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Avg Protein
                    </h3>
                    <p className="text-lg">
                      {weeklyData[selectedWeek].avgProtein} g
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Avg Carbs
                    </h3>
                    <p className="text-lg">
                      {weeklyData[selectedWeek].avgCarbs} g
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Avg Fat
                    </h3>
                    <p className="text-lg">
                      {weeklyData[selectedWeek].avgFat} g
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Avg Calories
                    </h3>
                    <p className="text-lg">
                      {weeklyData[selectedWeek].avgCalories} kcal
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Data for Selected Week */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Macronutrients Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">
                    Weekly Macronutrients
                  </h2>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyData[selectedWeek].dates.map((date) => ({
                          date,
                          protein:
                            weeklyData[selectedWeek].dailyData[date].totals[
                              "Protein (g)"
                            ],
                          carbs:
                            weeklyData[selectedWeek].dailyData[date].totals[
                              "Carbohydrate (g)"
                            ],
                          fat: weeklyData[selectedWeek].dailyData[date].totals[
                            "Fat (g)"
                          ],
                        }))}
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
                        <Bar dataKey="protein" fill="#4ade80" name="Protein" />
                        <Bar dataKey="carbs" fill="#f59e0b" name="Carbs" />
                        <Bar dataKey="fat" fill="#ef4444" name="Fat" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Calories Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">
                    Weekly Calories
                  </h2>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyData[selectedWeek].dates.map((date) => ({
                          date,
                          calories:
                            weeklyData[selectedWeek].dailyData[date].totals
                              .Kcal,
                        }))}
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

              {/* Weekly Data Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                        Carbs (g)
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
                      const dayData = weeklyData[selectedWeek].dailyData[date];
                      return (
                        <tr key={date}>
                          <td
                            className="px-6 py-4 cursor-pointer hover:text-blue-600"
                            onClick={() => {
                              const dayData =
                                weeklyData[selectedWeek].dailyData[date];
                              setSelectedDateData({
                                date,
                                data: dayData, // Now contains both meals and totals
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
                          <td className="px-6 py-4">{dayData.totals.Kcal}</td>
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
        // Overview Mode
        <div className="grid gap-6">
          {/* Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Macronutrients Progress */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Macronutrients Progress
              </h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={Object.entries(weeklyData).map(([week, data]) => ({
                      week,
                      protein: data.avgProtein,
                      carbs: data.avgCarbs,
                      fat: data.avgFat,
                    }))}
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

            {/* Calories Progress */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Calories Progress</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={Object.entries(weeklyData).map(([week, data]) => ({
                      week,
                      calories: data.avgCalories,
                    }))}
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

          {/* Progress Overview Table */}
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
                {Object.entries(weeklyData).map(([week, data]) => (
                  <tr key={week}>
                    <td className="px-6 py-4">{week}</td>
                    <td className="px-6 py-4">{getWeekRange(data.dates)}</td>
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
      )}
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
