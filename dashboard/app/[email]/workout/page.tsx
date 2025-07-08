"use client";

import Navigation from "@/components/shared/Navigation";
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
    const exerciseNames = exercises.map((e) => e.name.trim());

    for (const [session, templateExercises] of Object.entries(
      sessionTemplates
    )) {
      // Check if any of the exercises in this workout match the template exercises
      if (
        exerciseNames.some((name) =>
          templateExercises.some(
            (template) => name.toLowerCase() === template.toLowerCase()
          )
        )
      ) {
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
          const matchingTemplateExercise = sessionTemplates[sessionType].find(
            (template) =>
              template.toLowerCase() === exercise.name.toLowerCase().trim()
          );

          if (matchingTemplateExercise) {
            sessions[sessionType][matchingTemplateExercise][date] = {
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
  if (!workoutData)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation
          title="Workout Dashboard"
          subtitle="No Data Available"
          email={params.email as string}
        />
        <div className="p-6">
          <div className="flex gap-4">
            <Link
              href={`/${params.email}/workout/edit-template`}
              className="bg-[#0a1c3f] hover:bg-[#0b2552] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Edit Template
            </Link>
          </div>
          <p className="mt-4 text-gray-600">No workout data found</p>
        </div>
      </div>
    );

  const sessionData = organizeBySession(workoutData);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        title="Workout Dashboard"
        subtitle="Training Progress"
        email={params.email as string}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View/Edit Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            className="px-6 py-2.5 rounded-lg bg-[#0a1c3f] hover:bg-[#0b2552] text-white font-medium text-sm transition-colors cursor-default"
          >
            View Template
          </button>
          <Link
            href={`/${params.email}/workout/edit-template`}
            className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            Edit Template
          </Link>
        </div>

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Workout Progress
              </h1>
              <p className="text-gray-600">Training Split: {trainingType}</p>
            </div>
          </div>
        </div>

        {/* Session Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSession("all")}
              className={`px-6 py-2 rounded-lg transition-colors ${
                selectedSession === "all"
                  ? "bg-[#0a1c3f] text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              All Sessions
            </button>
            {Object.keys(sessionData).map((session) => (
              <button
                key={session}
                onClick={() => setSelectedSession(session as "A" | "B" | "C")}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  selectedSession === session
                    ? "bg-[#0a1c3f] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Session {session}
              </button>
            ))}
          </div>
        </div>

        {/* Session Tables */}
        {(selectedSession === "all"
          ? Object.entries(sessionData)
          : [[selectedSession, sessionData[selectedSession]]]
        ).map(([session, exercises]) => (
          <div key={session} className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Session {session}
            </h2>
            <div className="overflow-auto">
              <div className="min-w-[800px]">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-48">
                        Exercise
                      </th>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
