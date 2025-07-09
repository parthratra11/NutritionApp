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
          setClient(clientDocSnap.data() as IntakeForm);
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
        title={client.fullName}
        subtitle={
          client.timestamp?.toDate
            ? formatDate(client.timestamp.toDate())
            : undefined
        }
        email={params.email as string}
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
            onClick={() => router.push(`/${params.email}/report`)}
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

          {/* Steps Progress */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/${params.email}/steps`)}
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Daily Steps
            </h2>
            <div className="flex justify-center">
              <div className="relative h-40 w-40">
                <div className="h-full w-full rounded-full border-8 border-gray-200"></div>
                <div
                  className="absolute inset-0 rounded-full border-8 border-red-500"
                  style={{
                    clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)",
                    transform: "rotate(0deg)",
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="font-bold text-lg">5,000</p>
                  <p className="text-xs text-gray-500">out of 10,000 steps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hunger Distribution */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/${params.email}/nutrition`)}
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Hunger Distribution
            </h2>
            <div className="h-48 space-y-2">
              {["Pre Workout", "Lunch", "Afternoon", "Dinner"].map(
                (meal, i) => (
                  <div key={meal} className="flex items-center">
                    <span className="w-24 text-sm">{meal}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400"
                        style={{ width: `${(i + 1) * 20}%` }}
                      ></div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Sleep Breakdown */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/${params.email}/report`)}
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Sleep Breakdown
            </h2>
            <div className="flex justify-center">
              <div className="relative h-40 w-40">
                <div className="h-full w-full rounded-full bg-red-200"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3/4 w-3/4 rounded-full bg-red-400"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-1/2 w-1/2 rounded-full bg-red-600"></div>
                </div>
                <div className="absolute inset-x-0 bottom-0 mt-2">
                  <div className="flex justify-between text-xs text-gray-600 px-2">
                    <span>Deep: 45%</span>
                    <span>Light: 32%</span>
                    <span>Awake: 28%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Moods Bubble Chart */}
          <div
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/${params.email}/report`)}
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Mood Patterns
            </h2>
            <div className="h-40 flex items-center justify-around">
              {["Happy", "Tired", "Low", "Energetic", "Calm"].map((mood, i) => {
                const size = 20 + i * 10;
                return (
                  <div
                    key={mood}
                    className="rounded-full bg-red-400 flex items-center justify-center text-white text-xs"
                    style={{
                      height: `${size}px`,
                      width: `${size}px`,
                    }}
                  >
                    {size > 30 ? mood : ""}
                  </div>
                );
              })}
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
