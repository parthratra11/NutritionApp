"use client";

import Navigation from "@/components/shared/Navigation";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface IntakeForm {
  fullName: string;
  email: string;
  age: string;
  weight: string;
  height: string;
  goals: string;
  timestamp: {
    toDate: () => Date;
  };
}

interface DayData {
  weight: string;
  timestamp: string;
  // ...other day data fields
}

interface WeekData {
  [day: string]: DayData;
  // other week data fields
}

interface WeeklyForms {
  [week: string]: WeekData;
}

interface WeightDataPoint {
  date: string;
  weight: number;
}

export default function ClientOverview() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<IntakeForm | null>(null);
  const [latestWeight, setLatestWeight] = useState<string | null>(null);
  const [latestWeightDate, setLatestWeightDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  // Add stepData state
  const [stepData, setStepData] = useState({
    current: 5000,
    goal: 10000,
  });
  const [userName, setUserName] = useState<string>("User"); // Add userName state

  // Sample data for visualization charts - refine the hunger data for stacked visualization
  const hungerData = [
    { name: "Pre Workout", protein: 30, carbs: 20, fat: 15, total: 65 },
    { name: "Lunch", protein: 45, carbs: 60, fat: 30, total: 135 },
    { name: "Afternoon", protein: 25, carbs: 40, fat: 20, total: 85 },
    { name: "Dinner", protein: 40, carbs: 50, fat: 35, total: 125 },
  ];

  const sleepData = {
    deep: 45,
    light: 32,
    awake: 23,
  };

  const moodData = [
    { day: "Sun", mood: "Happy", size: 40, yPosition: 20 },
    { day: "Mon", mood: "Tired", size: 30, yPosition: 50 },
    { day: "Tue", mood: "Energetic", size: 45, yPosition: 15 },
    { day: "Wed", mood: "Calm", size: 35, yPosition: 40 },
    { day: "Thu", mood: "Low", size: 25, yPosition: 60 },
    { day: "Fri", mood: "Happy", size: 42, yPosition: 30 },
    { day: "Sat", mood: "Energetic", size: 50, yPosition: 10 },
  ];

  // Create date strip for current week
  const generateDateStrip = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - currentDay + i);
      dates.push({
        day: days[i],
        date: date.getDate(),
        isToday: i === currentDay,
      });
    }

    return dates;
  };

  const dateStrip = generateDateStrip();

  useEffect(() => {
    const fetchClientData = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);

        // Fetch client details
        const clientDocRef = doc(db, "intakeForms", decodedEmail);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data() as IntakeForm;
          setClient(clientData);
          setUserName(clientData.fullName || "User"); // Set userName from client data
        } else {
          setError("Client not found");
          return;
        }

        // Fetch weekly forms data to get latest weight and historical data
        const weeklyDocRef = doc(db, "weeklyForms", decodedEmail);
        const weeklyDocSnap = await getDoc(weeklyDocRef);

        if (weeklyDocSnap.exists()) {
          const weeklyData = weeklyDocSnap.data() as WeeklyForms;

          // Find the latest weight entry
          let latestDate = new Date(0);
          let latestWeightValue = null;
          let latestWeightTimestamp = null;

          // Collect all weight data points for the chart
          const allWeightData: WeightDataPoint[] = [];

          // Loop through all weeks and days to find the latest weight entry and collect data
          Object.entries(weeklyData).forEach(([weekKey, weekData]) => {
            if (weekKey === "firstEntryDate") return;

            Object.entries(weekData).forEach(([dayKey, dayData]) => {
              // Add more robust null checking
              if (!dayData || typeof dayData !== "object") return;

              // Check if required properties exist
              if (!("timestamp" in dayData) || !("weight" in dayData)) return;
              if (!dayData.timestamp || !dayData.weight) return;

              try {
                const entryDate = new Date(dayData.timestamp);

                // Add to chart data
                allWeightData.push({
                  date: entryDate.toLocaleDateString(),
                  weight: parseFloat(dayData.weight),
                });

                // Update latest weight
                if (entryDate > latestDate) {
                  latestDate = entryDate;
                  latestWeightValue = dayData.weight;
                  latestWeightTimestamp = dayData.timestamp;
                }
              } catch (e) {
                console.error("Error processing date:", e);
              }
            });
          });

          if (latestWeightValue) {
            setLatestWeight(latestWeightValue);
            setLatestWeightDate(latestWeightTimestamp);
          }

          // Sort weight data by date
          allWeightData.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          setWeightData(allWeightData);
        }
      } catch (err) {
        setError("Failed to fetch client data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [params?.email]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!client) return <div className="p-6">No client data found</div>;

  const formatDate = (date: Date | undefined) => {
    if (!date) return "No date";
    return date.toLocaleDateString();
  };

  // Custom gradient for the weight chart
  const renderGradient = () => (
    <defs>
      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8} />
        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
      </linearGradient>
    </defs>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        title="Overview"
        subtitle={
          client?.timestamp?.toDate
            ? formatDate(client.timestamp.toDate())
            : undefined
        }
        email={params.email as string}
        userName={userName}
      />

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Summary Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Summary
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Age:</span> {client?.age || "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Height:</span>{" "}
                {client?.height || "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Initial Weight:</span>{" "}
                {client?.weight || "N/A"}
              </p>
              {latestWeight && latestWeight !== client?.weight && (
                <p className="text-gray-700">
                  <span className="font-medium">Current Weight:</span>{" "}
                  {latestWeight}
                  {latestWeightDate && (
                    <span className="text-xs text-gray-500 ml-2">
                      (as of {new Date(latestWeightDate).toLocaleDateString()})
                    </span>
                  )}
                </p>
              )}
              <p className="text-gray-700">
                <span className="font-medium">Goals:</span>{" "}
                {client?.goals || "N/A"}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Email:</span>{" "}
                {client?.email || "N/A"}
              </p>
            </div>
          </div>

          {/* Weight Chart - Replace placeholder with actual chart */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/${params.email}/weight`)}
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Weight Progress
            </h2>
            <div className="h-48">
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weightData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    {renderGradient()}
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      minTickGap={15}
                    />
                    <YAxis
                      domain={["dataMin - 1", "dataMax + 1"]}
                      tick={{ fontSize: 10 }}
                      width={30}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} kg`, "Weight"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      }}
                    />
                    <defs>
                      <linearGradient
                        id="colorWeight"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ff6b6b"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ff6b6b"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#ff5252"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                      activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#ff5252"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 1, stroke: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">No weight data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Hunger Distribution - UPDATED TO STACKED BARS */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow relative"
            onClick={() => router.push(`/${params.email}/nutrition`)}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                <span className="mr-2"></span> Hunger Distribution
              </h2>
              <span className="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hungerData}
                  margin={{ top: 5, right: 5, bottom: 20, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#0a1c3f", fontSize: 10 }}
                    interval={0}
                    height={40}
                    tickMargin={5}
                  />
                  <YAxis hide domain={[0, 150]} />
                  <Tooltip
                    formatter={(value, name) => {
                      const formattedName =
                        {
                          protein: "Protein",
                          carbs: "Carbs",
                          fat: "Fat",
                        }[name] || name;
                      return [`${value}g`, formattedName];
                    }}
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar
                    dataKey="fat"
                    name="Fat"
                    stackId="a"
                    fill="#f3a7a2"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="carbs"
                    name="Carbs"
                    stackId="a"
                    fill="#e05e55"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="protein"
                    name="Protein"
                    stackId="a"
                    fill="#c2362c"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Steps Progress Card - FIXED */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow relative"
            onClick={() => router.push(`/${params.email}/steps`)}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                <span className="mr-2"></span> Steps
              </h2>
              <span className="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            <div className="flex justify-center">
              <div className="relative h-40 w-40">
                {/* Fixed SVG donut chart with proper calculations */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle (complete ring) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f3a7a2"
                    strokeWidth="12"
                  />

                  {/* Calculate the circumference and the progress stroke */}
                  {(() => {
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const progressPercent = stepData.current / stepData.goal;
                    const progressOffset =
                      circumference * (1 - progressPercent);

                    return (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#c2362c"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    );
                  })()}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="font-bold text-2xl text-gray-800">
                    {stepData.current.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-800">Steps</p>
                  <p className="text-xs text-gray-500">
                    Out of {stepData.goal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sleep Breakdown - UPDATED TO DONUT */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow relative"
            onClick={() => router.push(`/${params.email}/sleep`)}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                <span className="mr-2"></span> Sleep Breakdown
              </h2>
              <span className="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative h-40 w-40">
                {/* Implement a more reliable donut chart with SVG arcs */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circles for each ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#white"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="27"
                    fill="none"
                    stroke="#white"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="16"
                    fill="none"
                    stroke="#white"
                    strokeWidth="10"
                  />

                  {/* Center white circle for donut hole */}
                  <circle cx="50" cy="50" r="10" fill="white" />

                  {/* Progress arcs for each ring */}
                  {(() => {
                    // Outer ring - awake
                    const r1 = 38;
                    const c1 = 2 * Math.PI * r1;
                    const pct1 = sleepData.awake / 100;
                    const dashArray1 = `${c1 * pct1} ${c1 * (1 - pct1)}`;

                    // Middle ring - light
                    const r2 = 27;
                    const c2 = 2 * Math.PI * r2;
                    const pct2 = sleepData.light / 100;
                    const dashArray2 = `${c2 * pct2} ${c2 * (1 - pct2)}`;

                    // Inner ring - deep
                    const r3 = 16;
                    const c3 = 2 * Math.PI * r3;
                    const pct3 = sleepData.deep / 100;
                    const dashArray3 = `${c3 * pct3} ${c3 * (1 - pct3)}`;

                    return (
                      <>
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="#c2362c"
                          strokeWidth="10"
                          strokeDasharray={dashArray1}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="27"
                          fill="none"
                          stroke="#e05e55"
                          strokeWidth="10"
                          strokeDasharray={dashArray2}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="16"
                          fill="none"
                          stroke="#f3a7a2"
                          strokeWidth="10"
                          strokeDasharray={dashArray3}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                          strokeLinecap="round"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="flex justify-between w-full text-xs text-gray-600 mt-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1 bg-[#f3a7a2]"></div>
                  <span>Deep: {sleepData.deep}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1 bg-[#e05e55]"></div>
                  <span>Light: {sleepData.light}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1 bg-[#c2362c]"></div>
                  <span>Awake: {sleepData.awake}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Moods Bubble Chart - UPDATED */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow relative"
            onClick={() => router.push(`/${params.email}/moods`)}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                <span className="mr-2"></span> Mood Patterns
              </h2>
              <span className="text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            <div className="h-40 relative">
              {/* Labels for days of week at bottom */}
              <div className="absolute bottom-0 w-full flex justify-between px-2 text-xs text-gray-500">
                {moodData.map((item) => (
                  <div key={item.day}>{item.day}</div>
                ))}
              </div>

              {/* Mood bubbles with vertical variation */}
              <div className="h-36 relative">
                {moodData.map((item, index) => {
                  // Calculate horizontal position (evenly spaced)
                  const leftPosition = `${
                    (index / (moodData.length - 1)) * 92 + 4
                  }%`;

                  return (
                    <div
                      key={item.day}
                      className="absolute rounded-full flex items-center justify-center text-white text-xs transition-transform hover:scale-110"
                      style={{
                        backgroundColor: "#c2362c",
                        opacity: 0.7 + item.size / 100,
                        height: `${item.size * 1.2}px`,
                        width: `${item.size * 1.2}px`,
                        left: leftPosition,
                        top: `${item.yPosition * 1.4}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {item.size > 30 ? item.mood : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => router.push(`/${params.email}/details`)}
            className="bg-[#0a1c3f] text-white px-6 py-2 rounded-lg hover:bg-[#0b2552] w-full"
          >
            View Full Details
          </button>
          <button
            onClick={() => router.push(`/${params.email}/nutrition`)}
            className="bg-[#0a1c3f] text-white px-6 py-2 rounded-lg hover:bg-[#0b2552] w-full"
          >
            Nutrition
          </button>
          <button
            onClick={() => router.push(`/${params.email}/report`)}
            className="bg-[#0a1c3f] text-white px-6 py-2 rounded-lg hover:bg-[#0b2552] w-full"
          >
            Reports
          </button>
          <button
            onClick={() => router.push(`/${params.email}/workout`)}
            className="bg-[#0a1c3f] text-white px-6 py-2 rounded-lg hover:bg-[#0b2552] w-full"
          >
            Workout
          </button>
          <button
            onClick={() =>
              router.push(`/${params.email}/workout/edit-template`)
            }
            className="bg-[#0a1c3f] text-white px-6 py-2 rounded-lg hover:bg-[#0b2552] w-full"
          >
            Edit Workout Template
          </button>
          <button
            onClick={() =>
              router.push(
                `/slack/dms?email=${encodeURIComponent(client.email)}`
              )
            }
            className="bg-[#0a1c3f] text-white px-6 py-2 rounded-lg hover:bg-[#0b2552] w-full"
          >
            Contact via Slack
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Link href="/" className="text-[#0a1c3f] hover:text-[#0b2552]">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
