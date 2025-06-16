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
  startingWeight: string;
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

  const calculateAverages = () => {
    if (!weeklyData) return [];

    return Object.entries(weeklyData)
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
      .sort(
        (a, b) =>
          parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1])
      );
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
          setWeeklyData(weeklyDocSnap.data() as WeeklyForms);
          const weeks = Object.keys(weeklyDocSnap.data());
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
    <div className="p-6">
      {/* Client Info Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <p className="text-lg">{clientInfo?.startingWeight} kg</p>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Progress Report</h1>
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
            className="text-blue-1200 hover:text-blue-800"
          >
            Back to Client Overview
          </Link>
        </div>
      </div>

      {viewMode === "weekly" ? (
        <>
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
                <div className="text-xs opacity-75">{getWeekDates(data)}</div>
              </button>
            ))}
          </div>

          {selectedWeek &&
            (weeklyData[selectedWeek]?.waist ||
              weeklyData[selectedWeek]?.hip) && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-2">
                  Week {selectedWeek} Measurements
                </h3>
                <div className="grid grid-cols-3 gap-4">
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

          <div className="overflow-x-auto">
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
                          const metricData =
                            dayData[metric.replace(" ", "") as keyof DayData];
                          if (
                            metricData &&
                            typeof metricData === "object" &&
                            "value" in metricData
                          ) {
                            value = metricData.value.toString();
                            colorClass = getColorClass(metricData.color);
                          }
                        }
                      }

                      return (
                        <td
                          key={`${day}-${metric}`}
                          className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${colorClass}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Daily Progress Charts */}
          <div className="mt-8 grid gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Weight & Measurements Chart */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Daily Weight Progress
                </h2>
                <div className="h-[420px]">
                  <Tooltip content={<CustomTooltip />} />
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
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="day"
                        tickFormatter={(day) => {
                          const dayData =
                            selectedWeek && weeklyData[selectedWeek]?.[day];
                          const date = dayData
                            ? formatDate(dayData.timestamp)
                            : "";
                          return `${day}\n${date}`;
                        }}
                        height={120}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
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

              {/* Daily Well-being Metrics Chart */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Daily Well-being Metrics
                </h2>
                <div className="h-[420px]">
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
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="day"
                        tickFormatter={(day) => {
                          const dayData =
                            selectedWeek && weeklyData[selectedWeek]?.[day];
                          const date = dayData
                            ? formatDate(dayData.timestamp)
                            : "";
                          return `${day}\n${date}`;
                        }}
                        height={120}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
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

            {/* Daily Progress Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Weight (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sleep Quality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mood
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hunger Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Daily Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {days.map((day, index) => {
                    const dayData =
                      selectedWeek && weeklyData[selectedWeek]?.[day];
                    const prevDayData =
                      index > 0 &&
                      selectedWeek &&
                      weeklyData[selectedWeek]?.[days[index - 1]];
                    const weightChange =
                      dayData?.weight && prevDayData?.weight
                        ? (
                            parseFloat(dayData.weight) -
                            parseFloat(prevDayData.weight)
                          ).toFixed(1)
                        : null;

                    return (
                      <tr key={day}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {day}
                        </td>
                        <td className="px-6 py-4">{dayData?.weight || "-"}</td>
                        <td className="px-6 py-4">
                          <div
                            className={`px-2 py-1 rounded-full inline-block ${
                              dayData?.["Sleep Quality"]
                                ? getColorClass(dayData["Sleep Quality"].color)
                                : ""
                            }`}
                          >
                            {dayData?.["Sleep Quality"]?.value || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`px-2 py-1 rounded-full inline-block ${
                              dayData?.Mood
                                ? getColorClass(dayData.Mood.color)
                                : ""
                            }`}
                          >
                            {dayData?.Mood?.value || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`px-2 py-1 rounded-full inline-block ${
                              dayData?.["Hunger Level"]
                                ? getColorClass(dayData["Hunger Level"].color)
                                : ""
                            }`}
                          >
                            {dayData?.["Hunger Level"]?.value || "-"}
                          </div>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-6">
          {/* Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight & Measurements Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Weight & Measurements Progress
              </h2>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculateAverages()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tickFormatter={(week) => {
                        const weekData = weeklyData[week];
                        const dates = getWeekDates(weekData);
                        return `${dates}`;
                      }}
                      height={120}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
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

            {/* Waist-Hip Ratio Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Waist-Hip Ratio</h2>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      {
                        day: "Week Average",
                        ratio:
                          weeklyData[selectedWeek]?.waist &&
                          weeklyData[selectedWeek]?.hip
                            ? (
                                parseFloat(weeklyData[selectedWeek].waist) /
                                parseFloat(weeklyData[selectedWeek].hip)
                              ).toFixed(2)
                            : null,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(day) => {
                        const dayData =
                          selectedWeek && weeklyData[selectedWeek]?.[day];
                        const date = dayData
                          ? formatDate(dayData.timestamp)
                          : "";
                        return `${day}\n${date}`;
                      }}
                      height={120}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis domain={[0.6, 1.0]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ratio"
                      stroke="#9333ea"
                      name="Waist-Hip Ratio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Well-being Metrics Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Well-being Metrics</h2>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculateAverages()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tickFormatter={(week) => {
                        const weekData = weeklyData[week];
                        const dates = getWeekDates(weekData);
                        return `${dates}`;
                      }}
                      height={120}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
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
          {/* Progress Table */}
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
                      <td className="px-6 py-4">{weekData.avgWeight || "-"}</td>
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
                            ? `${weightChange > 0 ? "+" : ""}${weightChange} kg`
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
      )}
    </div>
  );
}
