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

interface SetData {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseData {
  name: string;
  sets: SetData[];
}

interface DayData {
  workoutName: string;
  workoutNote: string;
  startTime: string;
  endTime: string;
  exercises: ExerciseData[];
  timestamp: string;
  isRestDay?: boolean;
}

interface WeekData {
  [day: string]: DayData;
}

interface WorkoutData {
  firstEntryDate: string;
  [week: string]: WeekData | string;
}

const sessionTemplates = {
  A: [
    "Barbell Hip Thrust",
    "Cable Overhead Triceps Extension",
    "Heels Elevated Zercher Squat",
    "One-leg Leg Extension",
    "Scrape Rack L-Seated Shoulder Press",
    "Seated DB Lateral Raise",
  ],
  B: [
    "Face Pull (Half-kneeling)",
    "Leg Curl Seated Calf Raise",
    "One-leg Lying Leg Curl",
    "Snatch-grip Romanian Deadlift",
    "Wide Cable Shrug",
  ],
  C: [
    "Cable Fly (High-to-Low)",
    "Deficit Push-up",
    "Facing Cable Bicep Curl (Fwd Lean)",
    "Neutral Grip Chin-up",
    "One-Arm DB Row",
  ],
};

export default function WorkoutDashboard() {
  const params = useParams();
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [selectedSession, setSelectedSession] = useState<
    "A" | "B" | "C" | "all"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingType, setTrainingType] = useState<string>("3x Per Week");

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  // Helper function to format time
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to get session type from workout name
  const getSessionType = (exercises: ExerciseData[]): string | null => {
    const exerciseNames = exercises.map((e) => e.name);

    for (const [session, templateExercises] of Object.entries(
      sessionTemplates
    )) {
      if (exerciseNames.some((name) => templateExercises.includes(name))) {
        return session;
      }
    }
    return null;
  };

  const getSessionForDay = (dayIndex: number): string => {
    // dayIndex: 0 = Monday, 6 = Sunday
    switch (dayIndex) {
      case 0: // Monday
        return "A";
      case 2: // Wednesday
        return "B";
      case 4: // Friday
        return "C";
      default: // Rest days
        return "rest";
    }
  };

  // Helper to organize data by session
  const organizeBySession = (data: WorkoutData) => {
    const sessions: {
      [key: string]: {
        [exercise: string]: {
          [date: string]: {
            sets: SetData[];
            workoutNote: string;
            duration: string;
          };
        };
      };
    } = {
      A: {},
      B: {},
      C: {},
    };

    // Initialize all exercises from templates
    Object.entries(sessionTemplates).forEach(([session, exercises]) => {
      exercises.forEach((exercise) => {
        sessions[session][exercise] = {};
      });
    });

    // Then populate with actual data
    Object.entries(data).forEach(([weekKey, weekData]) => {
      if (weekKey === "firstEntryDate") return;

      Object.entries(weekData as WeekData).forEach(([day, dayData]) => {
        if (dayData.isRestDay || !dayData.exercises?.length) return;

        const sessionType = getSessionType(dayData.exercises);
        if (!sessionType) return;

        const date = formatDate(dayData.timestamp);
        const duration =
          dayData.startTime && dayData.endTime
            ? `${formatTime(dayData.startTime)} - ${formatTime(
                dayData.endTime
              )}`
            : "";

        dayData.exercises.forEach((exercise) => {
          if (sessionTemplates[sessionType].includes(exercise.name)) {
            sessions[sessionType][exercise.name][date] = {
              sets: exercise.sets,
              workoutNote: dayData.workoutNote || "",
              duration,
            };
          }
        });
      });
    });

    return sessions;
  };

  useEffect(() => {
    const fetchTemplatesAndData = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);

        // Determine current session based on the day
        const todayIndex = new Date().getDay() - 1; // -1 to make Monday = 0
        const currentSession = getSessionForDay(todayIndex);

        // Fetch existing workout data
        const docRef = doc(db, "Workout", decodedEmail.toLowerCase());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as WorkoutData;
          if (data) {
            setWorkoutData(data);
          }
        }
      } catch (err) {
        setError("Failed to fetch workout data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplatesAndData();
  }, [params?.email]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!workoutData) return <div className="p-6">No workout data found</div>;

  const sessionData = organizeBySession(workoutData);

  const generateChartData = (exercise: string, dates: any) => {
    return Object.entries(dates).map(([date, data]: [string, any]) => ({
      date,
      maxWeight: Math.max(
        ...data.sets.map((set: SetData) => parseFloat(set.weight) || 0)
      ),
      volume: data.sets.reduce(
        (acc: number, set: SetData) =>
          acc + (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0),
        0
      ),
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-gray-600">Duration: {data.duration}</p>
          <div className="mt-2">
            {data.sets.map((set: SetData, index: number) => (
              <p key={set.id} className="text-sm">
                Set {index + 1}: {set.weight}kg x {set.reps} reps
              </p>
            ))}
          </div>
          {data.workoutNote && (
            <p className="mt-2 text-sm text-gray-600">
              Note: {data.workoutNote}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workout Progress</h1>
          <p className="text-gray-600">Training Split: {trainingType}</p>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/${params.email}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Client Overview
          </Link>
        </div>
      </div>

      {/* Session Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedSession("all")}
          className={`px-4 py-2 rounded-lg ${
            selectedSession === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          All Sessions
        </button>
        {Object.keys(sessionData).map((session) => (
          <button
            key={session}
            onClick={() => setSelectedSession(session as "A" | "B" | "C")}
            className={`px-4 py-2 rounded-lg ${
              selectedSession === session
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Session {session}
          </button>
        ))}
      </div>

      {/* Session Tables */}
      {(selectedSession === "all"
        ? Object.entries(sessionData)
        : [[selectedSession, sessionData[selectedSession]]]
      ).map(([session, exercises]) => (
        <div key={session} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Session {session}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-48">
                    Exercise
                  </th>
                  {/* Get unique dates across all exercises */}
                  {Array.from(
                    new Set(
                      Object.values(exercises)
                        .flatMap((exercise) => Object.keys(exercise))
                        .sort(
                          (a, b) =>
                            new Date(b).getTime() - new Date(a).getTime()
                        )
                    )
                  ).map((date) => (
                    <th
                      key={date}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                    >
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(exercises).map(([exercise, dates]) => (
                  <tr key={exercise} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r w-48">
                      {exercise}
                    </td>
                    {Array.from(
                      new Set(
                        Object.values(exercises)
                          .flatMap((exercise) => Object.keys(exercise))
                          .sort(
                            (a, b) =>
                              new Date(b).getTime() - new Date(a).getTime()
                          )
                      )
                    ).map((date) => {
                      const data = dates[date];
                      return (
                        <td
                          key={date}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {data ? (
                            <div>
                              {data.sets.map((set, index) => (
                                <div
                                  key={set.id}
                                  className={`text-xs ${
                                    set.completed
                                      ? "text-green-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {set.weight}kg × {set.reps}
                                </div>
                              ))}
                              {data.duration && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {data.duration}
                                </div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Progress Charts
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Progress Charts - Session {session}
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    yAxisId="weight"
                    label={{
                      value: "Weight (kg)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="volume"
                    orientation="right"
                    label={{
                      value: "Volume (kg)",
                      angle: 90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {Object.entries(exercises).map(([exercise, dates]) => {
                    const data = Object.entries(dates).map(([date, data]) => ({
                      date,
                      maxWeight: Math.max(
                        ...data.sets.map((set) => parseFloat(set.weight) || 0)
                      ),
                      volume: data.sets.reduce(
                        (acc, set) =>
                          acc +
                          (parseFloat(set.weight) || 0) *
                            (parseFloat(set.reps) || 0),
                        0
                      ),
                    }));

                    return (
                      <Line
                        key={exercise}
                        yAxisId="weight"
                        type="monotone"
                        dataKey="maxWeight"
                        name={`${exercise} (Max Weight)`}
                        stroke="#8884d8"
                        dot={{ r: 4 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div> */}
        </div>
      ))}
    </div>
  );
}
