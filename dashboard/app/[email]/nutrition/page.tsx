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

// Define types
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
  const [macroRangeTab, setMacroRangeTab] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [calorieRangeTab, setCalorieRangeTab] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Mock data for nutrition metrics
  const [macroData, setMacroData] = useState<{
    protein: MacroData;
    carbs: MacroData;
    fats: MacroData;
    calories: MacroData;
  }>({
    protein: { value: 160, target: 175, percentage: 91, status: "on-target" },
    carbs: { value: 260, target: 300, percentage: 87, status: "below-target" },
    fats: { value: 70, target: 85, percentage: 82, status: "below-target" },
    calories: { value: 2220, target: 2500, percentage: 89, status: "below-target" }
  });

  // Mock data for daily trends
  const [macroTrendData, setMacroTrendData] = useState<DailyMacroTrendData[]>([
    { date: "22-07-2025", protein: 175, carbs: 270, fats: 85, fiber: 30 },
    { date: "23-07-2025", protein: 180, carbs: 290, fats: 90, fiber: 28 },
    { date: "24-07-2025", protein: 155, carbs: 240, fats: 75, fiber: 35 },
    { date: "25-07-2025", protein: 170, carbs: 280, fats: 80, fiber: 25 },
    { date: "26-07-2025", protein: 180, carbs: 320, fats: 85, fiber: 22 },
    { date: "27-07-2025", protein: 175, carbs: 275, fats: 80, fiber: 27 },
    { date: "28-07-2025", protein: 180, carbs: 270, fats: 82, fiber: 32 },
  ]);

  // Mock data for meal calorie distribution
  const [mealCalorieData, setMealCalorieData] = useState<MealCalorieData[]>([
    { date: "22-07-2025", lunch: 650, dinner: 800, preWorkout: 300, afternoon: 500, total: 2250 },
    { date: "23-07-2025", lunch: 700, dinner: 850, preWorkout: 350, afternoon: 600, total: 2500 },
    { date: "24-07-2025", lunch: 550, dinner: 750, preWorkout: 250, afternoon: 300, total: 1850 },
    { date: "25-07-2025", lunch: 600, dinner: 800, preWorkout: 300, afternoon: 550, total: 2250 },
    { date: "26-07-2025", lunch: 650, dinner: 900, preWorkout: 350, afternoon: 600, total: 2500 },
    { date: "27-07-2025", lunch: 600, dinner: 800, preWorkout: 350, afternoon: 500, total: 2250 },
    { date: "28-07-2025", lunch: 550, dinner: 850, preWorkout: 300, afternoon: 400, total: 2100 },
  ]);

  // Mock data for supplements
  const [supplementData, setSupplementData] = useState<{[date: string]: SupplementData[]}>({
    "22 July 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Magnesium", dosage: "400 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "23 July 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Multivitamin", dosage: "1 g" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "24 July 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Magnesium", dosage: "400 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "25 July 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Zinc", dosage: "50 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "26 July 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Magnesium", dosage: "400 mg" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "27 July 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Iodized Salt", dosage: "1 g" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
    "28 July 2025": [
      { name: "Omega-3", dosage: "1g" },
      { name: "Creatine Monohydrate", dosage: "5g" },
      { name: "Vitamin D", dosage: "125 mg" },
      { name: "Caffeine", dosage: "100 mg" },
      { name: "Multivitamin", dosage: "1 g" },
      { name: "Protein Powder", dosage: "25 g" },
    ],
  });

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white">
        <Navigation 
          title="Nutrition" 
          subtitle="Track your nutrition progress"
          email={decodeURIComponent(email)}
        />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <p>Loading nutrition data...</p>
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
      />

      <div className="px-4 py-6 space-y-8">
        {/* Macro Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Protein Card */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">Daily Protein</h3>
              <div className="bg-[#4CAF50] text-xs rounded-md px-2 py-0.5">On Target</div>
            </div>
            <div className="text-3xl font-bold mb-2">{macroData.protein.value}g</div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
              <span className="text-green-500 text-sm">{macroData.protein.percentage}%</span>
            </div>
          </div>

          {/* Daily Carbs Card */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">Daily Carbs</h3>
              <div className="bg-[#FF5252] text-xs rounded-md px-2 py-0.5">Below Target</div>
            </div>
            <div className="text-3xl font-bold mb-2">{macroData.carbs.value}g</div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-400 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
              <span className="text-blue-400 text-sm">{macroData.carbs.percentage}%</span>
            </div>
          </div>

          {/* Daily Fats Card */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">Daily Fats</h3>
              <div className="bg-[#FF5252] text-xs rounded-md px-2 py-0.5">Below Target</div>
            </div>
            <div className="text-3xl font-bold mb-2">{macroData.fats.value}g</div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-400 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
              <span className="text-blue-400 text-sm">{macroData.fats.percentage}%</span>
            </div>
          </div>

          {/* Daily Calories Card */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">Daily Calories</h3>
              <div className="bg-[#FF5252] text-xs rounded-md px-2 py-0.5">Below Target</div>
            </div>
            <div className="text-3xl font-bold mb-2">{macroData.calories.value} kcal</div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-400 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
              <span className="text-blue-400 text-sm">{macroData.calories.percentage}%</span>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex justify-start">
          <div className="flex">
            <button 
              onClick={() => setViewMode("graphs")}
              className={`px-6 py-2 rounded-l text-base ${viewMode === "graphs" ? "bg-[#DD3333]" : "bg-gray-700"}`}
            >
              Graphs
            </button>
            <button 
              onClick={() => setViewMode("tabular")}
              className={`px-6 py-2 rounded-r text-base ${viewMode === "tabular" ? "bg-[#DD3333]" : "bg-gray-700"}`}
            >
              Tabular
            </button>
          </div>
        </div>

        {viewMode === "graphs" ? (
          <>
            {/* Daily Macronutrient Trends */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Daily Macronutrient Trends</h3>
                <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
                  <button 
                    onClick={() => setMacroRangeTab("weekly")}
                    className={`px-4 py-1 text-sm ${macroRangeTab === "weekly" ? "bg-white text-[#07172C]" : ""}`}
                  >
                    Weekly
                  </button>
                  <button 
                    onClick={() => setMacroRangeTab("monthly")}
                    className={`px-4 py-1 text-sm ${macroRangeTab === "monthly" ? "bg-white text-[#07172C]" : ""}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setMacroRangeTab("yearly")}
                    className={`px-4 py-1 text-sm ${macroRangeTab === "yearly" ? "bg-white text-[#07172C]" : ""}`}
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
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155',
                        color: '#fff' 
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ display: 'none' }} // Hide the default legend
                    />
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
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
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
                <h3 className="text-xl font-semibold">Meal Calorie Distribution</h3>
                <div className="flex bg-[#ffffff20] rounded-md overflow-hidden">
                  <button 
                    onClick={() => setCalorieRangeTab("weekly")}
                    className={`px-4 py-1 text-sm ${calorieRangeTab === "weekly" ? "bg-white text-[#07172C]" : ""}`}
                  >
                    Weekly
                  </button>
                  <button 
                    onClick={() => setCalorieRangeTab("monthly")}
                    className={`px-4 py-1 text-sm ${calorieRangeTab === "monthly" ? "bg-white text-[#07172C]" : ""}`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setCalorieRangeTab("yearly")}
                    className={`px-4 py-1 text-sm ${calorieRangeTab === "yearly" ? "bg-white text-[#07172C]" : ""}`}
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
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155',
                        color: '#fff' 
                      }}
                      cursor={false} // This will remove the background highlight on hover
                    />
                    <Legend 
                      wrapperStyle={{ display: 'none' }} // Hide the default legend
                    />
                    <Bar dataKey="afternoon" name="Afternoon" stackId="a" fill="#BC8346" />
                    <Bar dataKey="dinner" name="Dinner" stackId="a" fill="#992F30" />
                    <Bar dataKey="lunch" name="Lunch" stackId="a" fill="#C3B68C" />
                    <Bar dataKey="preWorkout" name="Pre-Workout" stackId="a" fill="#BE4D2E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
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

            {/* Supplement Tracking */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5">
              <div className="flex items-center mb-6">
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4"/>
                </svg>
                <h3 className="text-xl font-semibold">Supplement Tracking</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody>
                    {Object.entries(supplementData).map(([date, supplements]) => (
                      <tr key={date} className="border-b border-[#22364F] last:border-b-0">
                        <td className="py-3 pl-3 pr-6 align-top whitespace-nowrap w-32">
                          <div className="font-medium">{date}</div>
                        </td>
                        <td className="py-3">
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {supplements.map((supplement, idx) => (
                            <div 
                              key={`${date}-${idx}`} 
                              className="bg-[#FFFFFF12] rounded-md p-2 text-left" // Changed from text-center to text-left
                              style={{ border: '0.5px solid rgba(255, 255, 255, 0.2)' }}
                            >
                              <div className="text-white text-sm font-medium mb-1">{supplement.name}</div> {/* Increased from text-xs to text-sm and added font-medium */}
                              <div className="text-xs text-gray-400">Dosage: {supplement.dosage}</div> {/* Decreased from text-sm to text-xs */}
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
              <h3 className="text-xl font-semibold mb-4">Daily Macronutrient Trends</h3>
              
              {/* Date filter dropdown */}
              <div className="flex items-center mb-4">
                <div className="relative w-64">
                  <button className="bg-[#0E1F34] border border-[#22364F] text-gray-300 w-full p-2 rounded flex items-center justify-between">
                    <span>All Days</span>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <button className="ml-2 bg-[#0E1F34] border border-[#22364F] p-2 rounded flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left bg-[#1A2C43] rounded-t">
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Day Type</th>
                      <th className="py-3 px-4 font-medium">Protein (g)</th>
                      <th className="py-3 px-4 font-medium">Carbs (g)</th>
                      <th className="py-3 px-4 font-medium">Fats (g)</th>
                      <th className="py-3 px-4 font-medium">Fiber (g)</th>
                      <th className="py-3 px-4 font-medium">Calories</th>
                      <th className="py-3 px-4 font-medium">Supplements</th>
                      <th className="py-3 px-4 font-medium">Graph</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Order rows to show most recent date first */}
                    <tr className="border-b border-[#20354A]">
                      <td className="py-4 px-4">28-07-2025</td>
                      <td className="py-4 px-4">
                        <span className="bg-[#F59E0B] text-xs rounded-md px-2 py-0.5">Rest</span>
                      </td>
                      <td className="py-4 px-4">50</td>
                      <td className="py-4 px-4">75</td>
                      <td className="py-4 px-4">20</td>
                      <td className="py-4 px-4">10</td>
                      <td className="py-4 px-4">2680</td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        Omega-3, Creatine Monohydrate, Vitamin D, Caffeine, Multivitamin, Protein Powder
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => {
                            setSelectedRow("28-07-2025");
                            setShowGraphOverlay(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-[#20354A]">
                      <td className="py-4 px-4">27-07-2025</td>
                      <td className="py-4 px-4">
                        <span className="bg-[#F59E0B] text-xs rounded-md px-2 py-0.5">Rest</span>
                      </td>
                      <td className="py-4 px-4">65</td>
                      <td className="py-4 px-4">115</td>
                      <td className="py-4 px-4">42</td>
                      <td className="py-4 px-4">10</td>
                      <td className="py-4 px-4">1500</td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        Creatine Monohydrate, Vitamin D, Caffeine, Iodized Salt, Protein Powder
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => {
                            setSelectedRow("27-07-2025");
                            setShowGraphOverlay(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-[#20354A]">
                      <td className="py-4 px-4">26-07-2025</td>
                      <td className="py-4 px-4">
                        <span className="bg-[#4CAF50] text-xs rounded-md px-2 py-0.5">Training</span>
                      </td>
                      <td className="py-4 px-4">65</td>
                      <td className="py-4 px-4">85</td>
                      <td className="py-4 px-4">28</td>
                      <td className="py-4 px-4">15</td>
                      <td className="py-4 px-4">1822</td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        Omega-3, Creatine Monohydrate, Vitamin D, Caffeine, Magnesium, Protein Powder
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => {
                            setSelectedRow("26-07-2025");
                            setShowGraphOverlay(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-[#20354A]">
                      <td className="py-4 px-4">25-07-2025</td>
                      <td className="py-4 px-4">
                        <span className="bg-[#4CAF50] text-xs rounded-md px-2 py-0.5">Training</span>
                      </td>
                      <td className="py-4 px-4">50</td>
                      <td className="py-4 px-4">75</td>
                      <td className="py-4 px-4">20</td>
                      <td className="py-4 px-4">10</td>
                      <td className="py-4 px-4">2680</td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        Creatine Monohydrate, Vitamin D, Caffeine, Zinc, Protein Powder
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => {
                            setSelectedRow("25-07-2025");
                            setShowGraphOverlay(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-[#20354A]">
                      <td className="py-4 px-4">24-07-2025</td>
                      <td className="py-4 px-4">
                        <span className="bg-[#4CAF50] text-xs rounded-md px-2 py-0.5">Training</span>
                      </td>
                      <td className="py-4 px-4">45</td>
                      <td className="py-4 px-4">65</td>
                      <td className="py-4 px-4">18</td>
                      <td className="py-4 px-4">12</td>
                      <td className="py-4 px-4">2578</td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        Omega-3, Creatine Monohydrate, Vitamin D, Caffeine, Magnesium, Protein Powder
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => {
                            setSelectedRow("24-07-2025");
                            setShowGraphOverlay(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-[#20354A]">
                      <td className="py-4 px-4">23-07-2025</td>
                      <td className="py-4 px-4">
                        <span className="bg-[#4CAF50] text-xs rounded-md px-2 py-0.5">Training</span>
                      </td>
                      <td className="py-4 px-4">35</td>
                      <td className="py-4 px-4">55</td>
                      <td className="py-4 px-4">15</td>
                      <td className="py-4 px-4">8</td>
                      <td className="py-4 px-4">2440</td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        Creatine Monohydrate, Vitamin D, Caffeine, Multivitamin, Protein Powder
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => {
                            setSelectedRow("23-07-2025");
                            setShowGraphOverlay(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-[#20354A]">
                      <td className="py-4 px-4">22-07-2025</td>
                      <td className="py-4 px-4">
                        <span className="bg-[#4CAF50] text-xs rounded-md px-2 py-0.5">Training</span>
                      </td>
                      <td className="py-4 px-4">25</td>
                      <td className="py-4 px-4">45</td>
                      <td className="py-4 px-4">8</td>
                      <td className="py-4 px-4">5</td>
                      <td className="py-4 px-4">2360</td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        Omega-3, Creatine Monohydrate, Vitamin D, Caffeine, Magnesium, Protein Powder
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => {
                            setSelectedRow("22-07-2025");
                            setShowGraphOverlay(true);
                          }}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Keep the Supplement Tracking section in tabular view */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg p-5 mt-8">
              <div className="flex items-center mb-6">
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4"/>
                </svg>
                <h3 className="text-xl font-semibold">Supplement Tracking</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody>
                    {Object.entries(supplementData).sort((a, b) => {
                      // Sort dates in reverse (newest first)
                      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
                    }).map(([date, supplements]) => (
                      <tr key={date} className="border-b border-[#22364F] last:border-b-0">
                        <td className="py-3 pl-3 pr-6 align-top whitespace-nowrap w-32">
                          <div className="font-medium">{date}</div>
                        </td>
                        <td className="py-3">
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {supplements.map((supplement, idx) => (
                            <div 
                              key={`${date}-${idx}`} 
                              className="bg-[#FFFFFF12] rounded-md p-2 text-left"
                              style={{ border: '0.5px solid rgba(255, 255, 255, 0.2)' }}
                            >
                              <div className="text-white text-sm font-medium mb-1">{supplement.name}</div>
                              <div className="text-xs text-gray-400">Dosage: {supplement.dosage}</div>
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
                <h3 className="text-xl font-semibold">Nutrition Data: {selectedRow}</h3>
                <button 
                  onClick={() => setShowGraphOverlay(false)}
                  className="text-gray-400"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Macronutrient Distribution */}
                <div className="h-[300px]">
                  <h4 className="text-lg mb-3">Macronutrient Distribution</h4>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={[
                        {
                          name: "Protein",
                          value: macroTrendData.find(d => d.date === selectedRow)?.protein || 0,
                        },
                        {
                          name: "Carbs",
                          value: macroTrendData.find(d => d.date === selectedRow)?.carbs || 0,
                        },
                        {
                          name: "Fats",
                          value: macroTrendData.find(d => d.date === selectedRow)?.fats || 0,
                        },
                        {
                          name: "Fiber",
                          value: macroTrendData.find(d => d.date === selectedRow)?.fiber || 0,
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          color: '#fff'
                        }}
                        cursor={false}
                      />
                      <Bar dataKey="value" fill="#DD3333" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Calorie Distribution */}
                <div className="h-[300px]">
                  <h4 className="text-lg mb-3">Meal Calorie Distribution</h4>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={[
                        {
                          name: "Lunch",
                          value: mealCalorieData.find(d => d.date === selectedRow)?.lunch || 0,
                        },
                        {
                          name: "Dinner",
                          value: mealCalorieData.find(d => d.date === selectedRow)?.dinner || 0,
                        },
                        {
                          name: "Pre-Workout",
                          value: mealCalorieData.find(d => d.date === selectedRow)?.preWorkout || 0,
                        },
                        {
                          name: "Afternoon",
                          value: mealCalorieData.find(d => d.date === selectedRow)?.afternoon || 0,
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          color: '#fff'
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
    </div>
  );
}