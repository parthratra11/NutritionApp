"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
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
  ReferenceLine,
} from "recharts";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Define types
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
    weekNumber?: number;
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

interface MacroData {
  value: number;
  target: number;
  percentage: number;
  status: "on-target" | "below-target" | "above-target";
}

interface SupplementData {
  name: string;
  dosage: string;
}

interface DailyMacroTrendData {
  date: string;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface MealCalorieData {
  date: string;
  lunch: number;
  dinner: number;
  preWorkout: number;
  afternoon: number;
  total: number;
}

export default function NutritionPage() {
  const params = useParams();
  const router = useRouter();
  const email = params.email as string;
  const [viewMode, setViewMode] = useState<"graphs" | "tabular">("graphs");
  const [macroRangeTab, setMacroRangeTab] = useState<
    "weekly" | "monthly" | "yearly"
  >("weekly");
  const [calorieRangeTab, setCalorieRangeTab] = useState<
    "weekly" | "monthly" | "yearly"
  >("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");

  // Backend data states
  const [weeklyData, setWeeklyData] = useState<WeekData | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("all");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateData, setSelectedDateData] = useState<{
    date: string;
    data: any;
  } | null>(null);
  // Pre-fill with last week's date range
  const [startDate, setStartDate] = useState<string>("2025-07-22");
  const [endDate, setEndDate] = useState<string>("2025-07-28");

  // Add these state variables for date selection functionality
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(
    new Date()
  );
  const [selectedDateNutrition, setSelectedDateNutrition] = useState<{
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
    dayType: string;
    date: string;
    formattedDate: string;
  }>({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
    dayType: "",
    date: "",
    formattedDate: "",
  });

  // Define target values for each nutrient with proper decimal formatting
  const targets = {
    protein: 150.0,
    carbs: 200.0,
    fat: 70.0,
    calories: 2000,
  };

  // Current macro data based on most recent day
  const [macroData, setMacroData] = useState<{
    protein: MacroData;
    carbs: MacroData;
    fats: MacroData;
    calories: MacroData;
  }>({
    protein: {
      value: 0,
      target: targets.protein,
      percentage: 0,
      status: "below-target",
    },
    carbs: {
      value: 0,
      target: targets.carbs,
      percentage: 0,
      status: "below-target",
    },
    fats: {
      value: 0,
      target: targets.fat,
      percentage: 0,
      status: "below-target",
    },
    calories: {
      value: 0,
      target: targets.calories,
      percentage: 0,
      status: "below-target",
    },
  });

  // Mock data for supplements
  const [supplementData, setSupplementData] = useState<{
    [date: string]: SupplementData[];
  }>({
    "6 Sept 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Magnesium", dosage: "400 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "7 Sept 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Multivitamin", dosage: "1 g" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "8 Sept 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Magnesium", dosage: "400 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "9 Sept 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Zinc", dosage: "50 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "10 Sept 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Magnesium", dosage: "400 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "11 Sept 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Iodized Salt", dosage: "1 g" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "12 Sept 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Multivitamin", dosage: "1 g" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
  });

  // Processed chart data
  const [macroTrendData, setMacroTrendData] = useState<DailyMacroTrendData[]>(
    []
  );
  const [mealCalorieData, setMealCalorieData] = useState<MealCalorieData[]>([]);

  // // Mock supplement data (keeping this as mock since it's not in the backend structure)
  // const [supplementData, setSupplementData] = useState<{
  //   [date: string]: SupplementData[];
  // }>({});

  const formatDate = (dateStr: string) => {
    const date = new Date(
      dateStr.includes("-") ? dateStr : dateStr.split("/").reverse().join("-")
    );
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  // Helper function to format date input value for display in the date range section
  const formatDateRangeDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    return formatDate(dateStr);
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

  const groupDataByWeeks = (data: NutritionDataStructure): WeekData => {
    const weeks: WeekData = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key === "firstEntryDate") return;

      const weekNum = parseInt(key.replace("week", ""), 10) || 0;
      const weekKey = `Week ${weekNum}`;

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          weekNumber: weekNum,
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

  const calculateDailyNutrition = () => {
    if (!weeklyData) return [];

    const allDays: {
      date: string;
      formattedDate: string;
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
      dayType: string;
    }[] = [];

    Object.values(weeklyData).forEach((week) => {
      Object.entries(week.dailyData).forEach(([date, dayData]) => {
        allDays.push({
          date,
          formattedDate: formatDate(date),
          protein: dayData.totals["Protein (g)"],
          carbs: dayData.totals["Carbohydrate (g)"],
          fat: dayData.totals["Fat (g)"],
          calories: dayData.totals.Kcal,
          dayType: dayData.dayType,
        });
      });
    });

    if (comparisonPeriod === "custom" && startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      return allDays
        .filter((day) => {
          const dayDate = new Date(day.date);
          return dayDate >= startDateObj && dayDate <= endDateObj;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }

    // Apply period filtering based on current period selection
    const now = new Date();
    const cutoffDate = new Date();

    switch (comparisonPeriod) {
      case "monthly":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "yearly":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case "quarterly":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default:
        return allDays.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }

    return allDays
      .filter((day) => new Date(day.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const calculateMonthlyAverages = () => {
    if (!weeklyData) return [];

    const allDays = calculateDailyNutrition();
    const monthlyData: { [month: string]: { total: any; count: number } } = {};

    allDays.forEach((day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          total: { protein: 0, carbs: 0, fat: 0, calories: 0 },
          count: 0,
        };
      }

      monthlyData[monthKey].total.protein += day.protein;
      monthlyData[monthKey].total.carbs += day.carbs;
      monthlyData[monthKey].total.fat += day.fat;
      monthlyData[monthKey].total.calories += day.calories;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([monthKey, data]) => ({
        month: monthKey,
        label: new Date(monthKey + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        protein: (data.total.protein / data.count).toFixed(1),
        carbs: (data.total.carbs / data.count).toFixed(1),
        fat: (data.total.fat / data.count).toFixed(1),
        calories: Math.round(data.total.calories / data.count),
      }))
      .sort(
        (a, b) =>
          new Date(a.month + "-01").getTime() -
          new Date(b.month + "-01").getTime()
      );
  };

  const getFilteredData = () => {
    const dailyData = calculateDailyNutrition();

    // For graphs, determine data based on range tabs and comparison period
    const getDataForRange = (rangeTab: string) => {
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
          // For yearly view, return monthly averages
          return calculateMonthlyAverages();
        default:
          return dailyData;
      }
    };

    return {
      macro: getDataForRange(macroRangeTab),
      calorie: getDataForRange(calorieRangeTab),
      table: dailyData,
    };
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusFromPercentage = (
    percentage: number
  ): "on-target" | "below-target" | "above-target" => {
    if (percentage >= 90 && percentage <= 110) return "on-target";
    if (percentage < 90) return "below-target";
    return "above-target";
  };

  const processChartData = () => {
    if (!weeklyData) return;

    const filteredData = getFilteredData();

    // Process macro trend data
    const macroTrends = filteredData.macro.map((day) => ({
      date: macroRangeTab === "yearly" ? day.label : formatDate(day.date),
      protein: day.protein,
      carbs: day.carbs,
      fats: day.fat,
      fiber: Math.round(day.carbs * 0.1),
    }));

    // Process meal calorie data
    const mealCalories = filteredData.calorie.map((day) => ({
      date: calorieRangeTab === "yearly" ? day.label : formatDate(day.date),
      lunch: Math.round(day.calories * 0.3),
      dinner: Math.round(day.calories * 0.35),
      preWorkout: Math.round(day.calories * 0.15),
      afternoon: Math.round(day.calories * 0.2),
      total: day.calories,
    }));

    setMacroTrendData(macroTrends);
    setMealCalorieData(mealCalories);

    // Update current macro data from most recent day
    const allDailyData = calculateDailyNutrition();
    if (allDailyData.length > 0) {
      const latestDay = allDailyData[allDailyData.length - 1];
      setMacroData({
        protein: {
          value: latestDay.protein,
          target: targets.protein,
          percentage: Math.round((latestDay.protein / targets.protein) * 100),
          status: getStatusFromPercentage(
            (latestDay.protein / targets.protein) * 100
          ),
        },
        carbs: {
          value: latestDay.carbs,
          target: targets.carbs,
          percentage: Math.round((latestDay.carbs / targets.carbs) * 100),
          status: getStatusFromPercentage(
            (latestDay.carbs / targets.carbs) * 100
          ),
        },
        fats: {
          value: latestDay.fat,
          target: targets.fat,
          percentage: Math.round((latestDay.fat / targets.fat) * 100),
          status: getStatusFromPercentage((latestDay.fat / targets.fat) * 100),
        },
        calories: {
          value: latestDay.calories,
          target: targets.calories,
          percentage: Math.round((latestDay.calories / targets.calories) * 100),
          status: getStatusFromPercentage(
            (latestDay.calories / targets.calories) * 100
          ),
        },
      });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const decodedEmail = decodeURIComponent(email);

        // Fetch user info
        const userDocRef = doc(db, "intakeForms", decodedEmail);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserName(userData.fullName || "User");
        }

        // Fetch nutrition data
        const nutritionDocRef = doc(db, "nutrition", decodedEmail);
        const nutritionDocSnap = await getDoc(nutritionDocRef);

        if (nutritionDocSnap.exists()) {
          const data = nutritionDocSnap.data() as NutritionDataStructure;
          const weeks = groupDataByWeeks(data);
          setWeeklyData(weeks);
        } else {
          setError("No nutrition data found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch nutrition data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  useEffect(() => {
    processChartData();
  }, [
    weeklyData,
    comparisonPeriod,
    macroRangeTab,
    calorieRangeTab,
    startDate,
    endDate,
  ]);

  // Add the handler function to receive the selected date from the Navigation component
  const handleDateSelection = (date: Date) => {
    setSelectedCalendarDate(date);
  };

  // Add this useEffect to update macro data when a date is selected
  useEffect(() => {
    if (!weeklyData || !selectedCalendarDate) return;

    const dateStr = selectedCalendarDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Find the data for the selected date
    let foundData = null;

    Object.values(weeklyData).forEach((week) => {
      Object.entries(week.dailyData).forEach(([date, dayData]) => {
        // Check if this date matches the selected date (compare only YYYY-MM-DD part)
        if (date.includes(dateStr)) {
          foundData = {
            protein: dayData.totals["Protein (g)"],
            carbs: dayData.totals["Carbohydrate (g)"],
            fats: dayData.totals["Fat (g)"],
            calories: dayData.totals.Kcal,
            dayType: dayData.dayType,
            date: date,
            formattedDate: formatDate(date),
          };

          // Update the macro data with selected date's values
          setMacroData({
            protein: {
              value: dayData.totals["Protein (g)"],
              target: targets.protein,
              percentage: Math.round(
                (dayData.totals["Protein (g)"] / targets.protein) * 100
              ),
              status: getStatusFromPercentage(
                (dayData.totals["Protein (g)"] / targets.protein) * 100
              ),
            },
            carbs: {
              value: dayData.totals["Carbohydrate (g)"],
              target: targets.carbs,
              percentage: Math.round(
                (dayData.totals["Carbohydrate (g)"] / targets.carbs) * 100
              ),
              status: getStatusFromPercentage(
                (dayData.totals["Carbohydrate (g)"] / targets.carbs) * 100
              ),
            },
            fats: {
              value: dayData.totals["Fat (g)"],
              target: targets.fat,
              percentage: Math.round(
                (dayData.totals["Fat (g)"] / targets.fat) * 100
              ),
              status: getStatusFromPercentage(
                (dayData.totals["Fat (g)"] / targets.fat) * 100
              ),
            },
            calories: {
              value: dayData.totals.Kcal,
              target: targets.calories,
              percentage: Math.round(
                (dayData.totals.Kcal / targets.calories) * 100
              ),
              status: getStatusFromPercentage(
                (dayData.totals.Kcal / targets.calories) * 100
              ),
            },
          });
        }
      });
    });

    // If data is found for the selected date, update state
    if (foundData) {
      setSelectedDateNutrition(foundData);
    } else {
      // Set default values when no data is available for the selected date
      setSelectedDateNutrition({
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
        dayType: "No Data",
        date: dateStr,
        formattedDate: formatDate(dateStr),
      });

      // Reset macro data to zeros if no data exists for the date
      setMacroData({
        protein: {
          value: 0,
          target: targets.protein,
          percentage: 0,
          status: "below-target",
        },
        carbs: {
          value: 0,
          target: targets.carbs,
          percentage: 0,
          status: "below-target",
        },
        fats: {
          value: 0,
          target: targets.fat,
          percentage: 0,
          status: "below-target",
        },
        calories: {
          value: 0,
          target: targets.calories,
          percentage: 0,
          status: "below-target",
        },
      });
    }
  }, [selectedCalendarDate, weeklyData, targets]);

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
        <div className="relative bg-[#0B1F35]/50 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4">
          <div className="sticky top-0 bg-[#0B1F35]/50 p-4 border-b flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {getDayName(date)} - {formatDate(date)}
              </h2>
              <p className="text-white">{dayData.dayType} Day</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
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
                Object.entries(dayData.meals).map((mealEntry) => {
                  const meal = mealEntry[0];
                  const data = mealEntry[1] as MealData;
                  return (
                    <div key={meal} className="bg-gray-100/80 p-4 rounded-lg">
                      <h3 className="font-medium text-lg mb-2 text-gray-900">
                        {meal}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-800">Protein</p>
                          <p className="font-medium text-gray-900">
                            {data["Protein (g)"]}g
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">Carbs</p>
                          <p className="font-medium text-gray-900">
                            {data["Carbohydrate (g)"]}g
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">Fat</p>
                          <p className="font-medium text-gray-900">
                            {data["Fat (g)"]}g
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-800">Calories</p>
                          <p className="font-medium text-gray-900">
                            {data.Kcal}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-lg mb-3 text-white">
                Daily Totals
              </h3>
              <div className="bg-gray-100/80 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-800">Total Protein</p>
                    <p className="font-medium text-gray-900">
                      {dayData.totals["Protein (g)"]}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">Total Carbs</p>
                    <p className="font-medium text-gray-900">
                      {dayData.totals["Carbohydrate (g)"]}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">Total Fat</p>
                    <p className="font-medium text-gray-900">
                      {dayData.totals["Fat (g)"]}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">Total Calories</p>
                    <p className="font-medium text-gray-900">
                      {dayData.totals.Kcal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white">
        <Navigation
          title="Nutrition"
          subtitle="Track your nutrition progress"
          email={decodeURIComponent(email)}
          userName={userName}
        />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <p>Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white">
        <Navigation
          title="Nutrition"
          subtitle="Track your nutrition progress"
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
        title="Nutrition"
        subtitle="Track your nutrition intake"
        email={decodeURIComponent(email)}
        userName={userName}
        onDateSelect={handleDateSelection} // Pass the callback function
      />

      <div className="px-4 py-6 space-y-8">
        {/* Period Selection Dropdown */}
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
        {/* Macro Cards - These now display the selected date's data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Protein Card - Now showing selected date data */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">
                {selectedDateNutrition.formattedDate
                  ? `Protein (${selectedDateNutrition.formattedDate})`
                  : "Daily Protein"}
              </h3>
              <div
                className={`text-xs rounded-md px-2 py-0.5 ${
                  macroData.protein.status === "on-target"
                    ? "bg-[#4CAF50]"
                    : "bg-[#FF5252]"
                }`}
              >
                {macroData.protein.status === "on-target"
                  ? "On Target"
                  : "Below Target"}
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {macroData.protein.value.toFixed(1)}g
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-blue-400 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span className="text-blue-400 text-sm">
                {macroData.protein.percentage}%
              </span>
            </div>
          </div>

          {/* Daily Carbs Card - Now showing selected date data */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">
                {selectedDateNutrition.formattedDate
                  ? `Carbs (${selectedDateNutrition.formattedDate})`
                  : "Daily Carbs"}
              </h3>
              <div
                className={`text-xs rounded-md px-2 py-0.5 ${
                  macroData.carbs.status === "on-target"
                    ? "bg-[#4CAF50]"
                    : "bg-[#FF5252]"
                }`}
              >
                {macroData.carbs.status === "on-target"
                  ? "On Target"
                  : "Below Target"}
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {macroData.carbs.value.toFixed(1)}g
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-blue-400 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span className="text-blue-400 text-sm">
                {macroData.carbs.percentage}%
              </span>
            </div>
          </div>

          {/* Daily Fats Card - Now showing selected date data */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">
                {selectedDateNutrition.formattedDate
                  ? `Fats (${selectedDateNutrition.formattedDate})`
                  : "Daily Fats"}
              </h3>
              <div
                className={`text-xs rounded-md px-2 py-0.5 ${
                  macroData.fats.status === "on-target"
                    ? "bg-[#4CAF50]"
                    : "bg-[#FF5252]"
                }`}
              >
                {macroData.fats.status === "on-target"
                  ? "On Target"
                  : "Below Target"}
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {macroData.fats.value.toFixed(1)}g
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-blue-400 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span className="text-blue-400 text-sm">
                {macroData.fats.percentage}%
              </span>
            </div>
          </div>

          {/* Daily Calories Card - Now showing selected date data */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">
                {selectedDateNutrition.formattedDate
                  ? `Calories (${selectedDateNutrition.formattedDate})`
                  : "Daily Calories"}
              </h3>
              <div
                className={`text-xs rounded-md px-2 py-0.5 ${
                  macroData.calories.status === "on-target"
                    ? "bg-[#4CAF50]"
                    : "bg-[#FF5252]"
                }`}
              >
                {macroData.calories.status === "on-target"
                  ? "On Target"
                  : "Below Target"}
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {macroData.calories.value} kcal
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-blue-400 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
              <span className="text-blue-400 text-sm">
                {macroData.calories.percentage}%
              </span>
            </div>
          </div>
        </div>
        {/* View meal details button if data exists for the selected date
        {selectedDateNutrition.dayType !== "No Data" &&
          selectedDateNutrition.dayType !== "" && (
            <div className="text-center">
              <button
                onClick={() => {
                  // Find the week and day data for the selected date
                  const weekKey = Object.keys(weeklyData || {}).find(
                    (week) =>
                      weeklyData &&
                      Object.keys(weeklyData[week].dailyData).includes(
                        selectedDateNutrition.date
                      )
                  );

                  if (weekKey && weeklyData) {
                    const dayData =
                      weeklyData[weekKey].dailyData[selectedDateNutrition.date];
                    setSelectedDateData({
                      date: selectedDateNutrition.date,
                      data: dayData,
                    });
                    setIsModalOpen(true);
                  }
                }}
                className="text-blue-400 hover:text-blue-300 inline-flex items-center text-sm"
              >
                <span>
                  View meal details for {selectedDateNutrition.formattedDate}
                </span>
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          )} */}
        {viewMode === "graphs" ? (
          <>
            {/* Daily Macronutrient Trends */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Daily Macronutrient Trends
                </h3>
                <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
                  <button
                    onClick={() => {
                      setMacroRangeTab("weekly");
                      processChartData();
                    }}
                    className={`px-4 py-1 text-sm ${
                      macroRangeTab === "weekly"
                        ? "bg-white text-[#07172C]"
                        : ""
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => {
                      setMacroRangeTab("monthly");
                      processChartData();
                    }}
                    className={`px-4 py-1 text-sm ${
                      macroRangeTab === "monthly"
                        ? "bg-white text-[#07172C]"
                        : ""
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => {
                      setMacroRangeTab("yearly");
                      processChartData();
                    }}
                    className={`px-4 py-1 text-sm ${
                      macroRangeTab === "yearly"
                        ? "bg-white text-[#07172C]"
                        : ""
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={macroTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        color: "#fff",
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700 min-w-[280px]">
                              <p className="font-medium mb-2">{label}</p>
                              {payload.map((entry) => (
                                <div key={entry.dataKey} className="mb-1">
                                  <span style={{ color: entry.color }}>
                                    {entry.name}:{" "}
                                    {parseFloat(
                                      entry.value?.toString() || "0"
                                    ).toFixed(1)}
                                    g
                                  </span>
                                  {entry.dataKey === "protein" && (
                                    <span className="text-gray-400 ml-2">
                                      (Target: {targets.protein.toFixed(1)}g)
                                    </span>
                                  )}
                                  {entry.dataKey === "carbs" && (
                                    <span className="text-gray-400 ml-2">
                                      (Target: {targets.carbs.toFixed(1)}g)
                                    </span>
                                  )}
                                  {entry.dataKey === "fats" && (
                                    <span className="text-gray-400 ml-2">
                                      (Target: {targets.fat.toFixed(1)}g)
                                    </span>
                                  )}
                                  {entry.dataKey === "fiber" && (
                                    <span className="text-gray-400 ml-2">
                                      (Estimated)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ display: "none" }} />
                    <Line
                      type="monotone"
                      dataKey="carbs"
                      name="Carbs (g)"
                      stroke="#F6A249"
                      activeDot={{ r: 8 }}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fats"
                      name="Fats (g)"
                      stroke="#F03028"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fiber"
                      name="Fiber (g)"
                      stroke="#FFE7A7"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="protein"
                      name="Protein (g)"
                      stroke="#F95928"
                      dot={{ r: 4 }}
                    />
                    {/* Target Reference Lines */}
                    <ReferenceLine
                      y={targets.protein}
                      stroke="#F95928"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{
                        value: `Protein Target (${targets.protein.toFixed(
                          1
                        )}g)`,
                        position: "insideTopRight",
                        fill: "#F95928",
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine
                      y={targets.carbs}
                      stroke="#F6A249"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{
                        value: `Carbs Target (${targets.carbs.toFixed(1)}g)`,
                        position: "insideTopLeft",
                        fill: "#F6A249",
                        fontSize: 12,
                      }}
                    />
                    <ReferenceLine
                      y={targets.fat}
                      stroke="#F03028"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{
                        value: `Fat Target (${targets.fat.toFixed(1)}g)`,
                        position: "insideBottomRight",
                        fill: "#F03028",
                        fontSize: 12,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center space-x-12 mt-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#F6A249] mr-2"></div>
                  <span>Carbs (g)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#F03028] mr-2"></div>
                  <span>Fats (g)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#FFE7A7] mr-2"></div>
                  <span>Fiber (g)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#F95928] mr-2"></div>
                  <span>Protein (g)</span>
                </div>
              </div>
            </div>

            {/* Meal Calorie Distribution */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Meal Calorie Distribution
                </h3>
                <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
                  <button
                    onClick={() => {
                      setCalorieRangeTab("weekly");
                      processChartData();
                    }}
                    className={`px-4 py-1 text-sm ${
                      calorieRangeTab === "weekly"
                        ? "bg-white text-[#07172C]"
                        : ""
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => {
                      setCalorieRangeTab("monthly");
                      processChartData();
                    }}
                    className={`px-4 py-1 text-sm ${
                      calorieRangeTab === "monthly"
                        ? "bg-white text-[#07172C]"
                        : ""
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => {
                      setCalorieRangeTab("yearly");
                      processChartData();
                    }}
                    className={`px-4 py-1 text-sm ${
                      calorieRangeTab === "yearly"
                        ? "bg-white text-[#07172C]"
                        : ""
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealCalorieData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        color: "#fff",
                      }}
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const totalCalories = payload.reduce(
                            (sum, entry) => sum + (entry.value || 0),
                            0
                          );
                          return (
                            <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700 min-w-[280px]">
                              <p className="font-medium mb-2">{label}</p>
                              {payload.map((entry) => (
                                <div key={entry.dataKey} className="mb-1">
                                  <span style={{ color: entry.fill }}>
                                    {entry.name}: {entry.value} cal
                                  </span>
                                </div>
                              ))}
                              <div className="border-t border-gray-600 mt-2 pt-2">
                                <span className="font-medium">
                                  Total: {totalCalories} cal
                                </span>
                                <span className="text-gray-400 ml-2">
                                  (Target: {targets.calories} cal)
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ display: "none" }} />
                    <Bar
                      dataKey="afternoon"
                      name="Afternoon"
                      stackId="a"
                      fill="#BC8346"
                    />
                    <Bar
                      dataKey="dinner"
                      name="Dinner"
                      stackId="a"
                      fill="#992F30"
                    />
                    <Bar
                      dataKey="lunch"
                      name="Lunch"
                      stackId="a"
                      fill="#C3B68C"
                    />
                    <Bar
                      dataKey="preWorkout"
                      name="Pre-Workout"
                      stackId="a"
                      fill="#BE4D2E"
                    />
                    {/* Calorie Target Reference Line */}
                    <ReferenceLine
                      y={targets.calories}
                      stroke="#FFFFFF"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{
                        value: `Calorie Target (${targets.calories})`,
                        position: "insideTopRight",
                        fill: "#FFFFFF",
                        fontSize: 12,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center space-x-12 mt-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#BC8346] mr-2"></div>
                  <span>Afternoon</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#992F30] mr-2"></div>
                  <span>Dinner</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#C3B68C] mr-2"></div>
                  <span>Lunch</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#BE4D2E] mr-2"></div>
                  <span>Pre-Workout</span>
                </div>
              </div>
            </div>

            {/* Keep the Supplement Tracking section in tabular view */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5 mt-8">
              <div className="flex items-center mb-6">
                <svg
                  className="w-6 h-6 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
                </svg>
                <h3 className="text-xl font-semibold">Supplement Intake</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody>
                    {Object.entries(supplementData)
                      .sort((a, b) => {
                        // Sort dates in reverse (newest first)
                        return (
                          new Date(b[0]).getTime() - new Date(a[0]).getTime()
                        );
                      })
                      .map(([date, supplements]) => (
                        <tr
                          key={date}
                          className="border-b border-[#22364F] last:border-b-0"
                        >
                          <td className="py-3 pl-3 pr-6 align-top whitespace-nowrap w-32">
                            <div className="font-medium">{date}</div>
                          </td>
                          <td className="py-3">
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                              {supplements.map((supplement, idx) => (
                                <div
                                  key={`${date}-${idx}`}
                                  className="bg-[#FFFFFF12] rounded-md p-2 text-left"
                                  style={{
                                    border:
                                      "0.5px solid rgba(255, 255, 255, 0.2)",
                                  }}
                                >
                                  <div className="text-white text-sm font-medium mb-1">
                                    {supplement.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Dosage: {supplement.dosage}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Tabular view - Daily Macronutrient Trends */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
              <h3 className="text-xl font-semibold mb-4">
                {comparisonPeriod === "yearly" || macroRangeTab === "yearly"
                  ? "Monthly"
                  : "Daily"}{" "}
                Macronutrient Trends
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left bg-[#1A2C43] rounded-t">
                      <th className="py-3 px-4 font-medium">
                        {comparisonPeriod === "yearly" ||
                        macroRangeTab === "yearly"
                          ? "Month"
                          : "Date"}
                      </th>
                      <th className="py-3 px-4 font-medium">
                        {comparisonPeriod === "yearly" ||
                        macroRangeTab === "yearly"
                          ? "Avg "
                          : ""}
                        Protein (g)
                      </th>
                      <th className="py-3 px-4 font-medium">
                        {comparisonPeriod === "yearly" ||
                        macroRangeTab === "yearly"
                          ? "Avg "
                          : ""}
                        Carbs (g)
                      </th>
                      <th className="py-3 px-4 font-medium">
                        {comparisonPeriod === "yearly" ||
                        macroRangeTab === "yearly"
                          ? "Avg "
                          : ""}
                        Fats (g)
                      </th>
                      <th className="py-3 px-4 font-medium">
                        {comparisonPeriod === "yearly" ||
                        macroRangeTab === "yearly"
                          ? "Avg "
                          : ""}
                        Calories
                      </th>
                      {!(
                        comparisonPeriod === "yearly" ||
                        macroRangeTab === "yearly"
                      ) && (
                        <>
                          <th className="py-3 px-4 font-medium">Day Type</th>
                          <th className="py-3 px-4 font-medium">Details</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(comparisonPeriod === "yearly" ||
                    macroRangeTab === "yearly"
                      ? calculateMonthlyAverages().slice(-12).reverse()
                      : getFilteredData().table.slice(-10).reverse()
                    ).map((item) => {
                      if (
                        comparisonPeriod === "yearly" ||
                        macroRangeTab === "yearly"
                      ) {
                        return (
                          <tr
                            key={item.month}
                            className="border-b border-[#20354A]"
                          >
                            <td className="py-4 px-4">{item.label}</td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                parseFloat(item.protein),
                                targets.protein
                              )}`}
                            >
                              {item.protein} / {targets.protein.toFixed(1)}
                            </td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                parseFloat(item.carbs),
                                targets.carbs
                              )}`}
                            >
                              {item.carbs} / {targets.carbs.toFixed(1)}
                            </td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                parseFloat(item.fat),
                                targets.fat
                              )}`}
                            >
                              {item.fat} / {targets.fat.toFixed(1)}
                            </td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                item.calories,
                                targets.calories
                              )}`}
                            >
                              {item.calories} / {targets.calories}
                            </td>
                          </tr>
                        );
                      } else {
                        const day = item as any;
                        const weekKey = Object.keys(weeklyData || {}).find(
                          (week) =>
                            weeklyData &&
                            Object.keys(weeklyData[week].dailyData).includes(
                              day.date
                            )
                        );
                        const dayData =
                          weekKey && weeklyData
                            ? weeklyData[weekKey].dailyData[day.date]
                            : null;

                        return (
                          <tr
                            key={day.date}
                            className="border-b border-[#20354A]"
                          >
                            <td className="py-4 px-4">
                              {formatDate(day.date)}
                            </td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                day.protein,
                                targets.protein
                              )}`}
                            >
                              {day.protein.toFixed(1)} /{" "}
                              {targets.protein.toFixed(1)}
                            </td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                day.carbs,
                                targets.carbs
                              )}`}
                            >
                              {day.carbs.toFixed(1)} /{" "}
                              {targets.carbs.toFixed(1)}
                            </td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                day.fat,
                                targets.fat
                              )}`}
                            >
                              {day.fat.toFixed(1)} / {targets.fat.toFixed(1)}
                            </td>
                            <td
                              className={`py-4 px-4 ${getProgressColor(
                                day.calories,
                                targets.calories
                              )}`}
                            >
                              {day.calories} / {targets.calories}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`text-xs rounded-md px-2 py-0.5 ${
                                  day.dayType === "Training"
                                    ? "bg-[#4CAF50]"
                                    : "bg-[#F59E0B]"
                                }`}
                              >
                                {day.dayType}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button
                                onClick={() => {
                                  if (dayData) {
                                    setSelectedDateData({
                                      date: day.date,
                                      data: dayData,
                                    });
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-500"
                              >
                                <svg
                                  className="w-5 h-5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Keep the Supplement Tracking section in tabular view */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5 mt-8">
              <div className="flex items-center mb-6">
                <svg
                  className="w-6 h-6 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
                </svg>
                <h3 className="text-xl font-semibold">Supplement Tracking</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody>
                    {Object.entries(supplementData)
                      .sort((a, b) => {
                        // Sort dates in reverse (newest first)
                        return (
                          new Date(b[0]).getTime() - new Date(a[0]).getTime()
                        );
                      })
                      .map(([date, supplements]) => (
                        <tr
                          key={date}
                          className="border-b border-[#22364F] last:border-b-0"
                        >
                          <td className="py-3 pl-3 pr-6 align-top whitespace-nowrap w-32">
                            <div className="font-medium">{date}</div>
                          </td>
                          <td className="py-3">
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                              {supplements.map((supplement, idx) => (
                                <div
                                  key={`${date}-${idx}`}
                                  className="bg-[#FFFFFF12] rounded-md p-2 text-left"
                                  style={{
                                    border:
                                      "0.5px solid rgba(255, 255, 255, 0.2)",
                                  }}
                                >
                                  <div className="text-white text-sm font-medium mb-1">
                                    {supplement.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Dosage: {supplement.dosage}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {/* Graph overlay when a specific day is selected */}
        {showGraphOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5 w-full max-w-4xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Nutrition Data: {selectedRow}
                </h3>
                <button
                  onClick={() => setShowGraphOverlay(false)}
                  className="text-gray-400"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <h4 className="text-lg mb-3">Macronutrient Distribution</h4>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={[
                        {
                          name: "Protein",
                          value:
                            macroTrendData.find((d) => d.date === selectedRow)
                              ?.protein || 0,
                        },
                        {
                          name: "Carbs",
                          value:
                            macroTrendData.find((d) => d.date === selectedRow)
                              ?.carbs || 0,
                        },
                        {
                          name: "Fats",
                          value:
                            macroTrendData.find((d) => d.date === selectedRow)
                              ?.fats || 0,
                        },
                        {
                          name: "Fiber",
                          value:
                            macroTrendData.find((d) => d.date === selectedRow)
                              ?.fiber || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          color: "#fff",
                        }}
                        cursor={false}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
                                <p className="font-medium mb-2">{label}</p>
                                <span style={{ color: payload[0].color }}>
                                  Value:{" "}
                                  {parseFloat(
                                    payload[0].value?.toString() || "0"
                                  ).toFixed(1)}
                                  g
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" fill="#DD3333" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[300px]">
                  <h4 className="text-lg mb-3">Meal Calorie Distribution</h4>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={[
                        {
                          name: "Lunch",
                          value:
                            mealCalorieData.find((d) => d.date === selectedRow)
                              ?.lunch || 0,
                        },
                        {
                          name: "Dinner",
                          value:
                            mealCalorieData.find((d) => d.date === selectedRow)
                              ?.dinner || 0,
                        },
                        {
                          name: "Pre-Workout",
                          value:
                            mealCalorieData.find((d) => d.date === selectedRow)
                              ?.preWorkout || 0,
                        },
                        {
                          name: "Afternoon",
                          value:
                            mealCalorieData.find((d) => d.date === selectedRow)
                              ?.afternoon || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          color: "#fff",
                        }}
                        cursor={false}
                      />
                      <Bar dataKey="value" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
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
