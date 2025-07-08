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
  const [clientName, setClientName] = useState<string>("");

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

  useEffect(() => {
    const fetchClientName = async () => {
      if (!params?.email) return;
      try {
        const clientEmail = decodeURIComponent(params.email as string);
        const clientDocRef = doc(db, "intakeForms", clientEmail);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          setClientName(clientData.fullName);
        }
      } catch (err) {
        console.error("Failed to fetch client name:", err);
      }
    };

    fetchClientName();
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
        title={`${clientName || "Client"}'s Workout`}
        subtitle="Training Progress"
        email={params.email as string}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View/Edit Toggle */}
        <div className="flex space-x-4 mb-6">
          <button className="px-6 py-2.5 rounded-lg bg-[#0a1c3f] hover:bg-[#0b2552] text-white font-medium text-sm transition-colors cursor-default">
            View Progress
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
        ).map(([session, exercises]) => {
          // Create a map to track notes by date to show only once per day
          const dailyNotes = new Map<string, string>();
          const dailyDurations = new Map<string, string>();

          // Collect all unique notes and durations per date
          Object.values(exercises).forEach((dates) => {
            Object.entries(dates).forEach(([date, data]) => {
              if (data.workoutNote && !dailyNotes.has(date)) {
                dailyNotes.set(date, data.workoutNote);
              }
              if (data.duration && !dailyDurations.has(date)) {
                dailyDurations.set(date, data.duration);
              }
            });
          });

          return (
            <div
              key={session}
              className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
              <h3 className="text-[#333333] font-semibold mb-3 text-right">
                Session {session}
              </h3>

              <div className="bg-[#F5F5F5] rounded-xl shadow-sm p-4">
                <div
                  className="overflow-x-auto"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <div className="min-w-full">
                    <table className="w-full border-separate border-spacing-0">
                      <thead className="sticky top-0">
                        <tr className="text-left text-gray-600 text-sm">
                          <th className="sticky left-0 z-10 bg-[#F5F5F5] pb-3 pl-4 pr-6 font-medium whitespace-nowrap min-w-[160px] max-w-[180px]">
                            Exercise
                          </th>
                          {Array.from(
                            new Set(
                              Object.values(exercises)
                                .flatMap((exercise) => Object.keys(exercise))
                                .sort(
                                  (a, b) =>
                                    new Date(b).getTime() -
                                    new Date(a).getTime()
                                )
                            )
                          ).map((date) => (
                            <th
                              key={date}
                              className="pb-3 px-2 font-medium whitespace-nowrap min-w-[100px] max-w-[120px]"
                            >
                              <div className="font-medium text-sm text-gray-600">
                                {date}
                              </div>
                              {dailyDurations.get(date) && (
                                <div className="text-xs text-gray-500 font-normal">
                                  <span className="font-medium">Time:</span>{" "}
                                  {dailyDurations.get(date)}
                                </div>
                              )}
                              {dailyNotes.get(date) && (
                                <div className="text-xs text-gray-500 font-normal relative group">
                                  <span className="font-medium">Note:</span>{" "}
                                  <span className="truncate inline-block max-w-[80px] cursor-help align-middle">
                                    {dailyNotes.get(date)!.length > 15
                                      ? `${dailyNotes
                                          .get(date)!
                                          .substring(0, 15)}...`
                                      : dailyNotes.get(date)}
                                  </span>
                                  <div className="hidden group-hover:block absolute z-50 mb-0 left-0 bg-gray-800 text-white rounded p-2 text-xs min-w-[200px] max-w-[300px] shadow-lg whitespace-normal break-words">
                                    {dailyNotes.get(date)}
                                  </div>
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-[#333333] text-sm divide-y divide-gray-200">
                        {Object.entries(exercises).map(
                          ([exercise, dates], exerciseIndex) => (
                            <tr
                              key={exercise}
                              className={
                                exerciseIndex % 2 === 0 ? "bg-gray-50" : ""
                              }
                            >
                              <td
                                className={`sticky left-0 z-10 ${
                                  exerciseIndex % 2 === 0
                                    ? "bg-gray-50"
                                    : "bg-[#F5F5F5]"
                                } py-3 pl-4 pr-6 font-medium whitespace-nowrap min-w-[160px] max-w-[180px] overflow-hidden text-ellipsis border-l-4 border-[#0a1c3f]`}
                              >
                                {exercise}
                              </td>
                              {Array.from(
                                new Set(
                                  Object.values(exercises)
                                    .flatMap((exercise) =>
                                      Object.keys(exercise)
                                    )
                                    .sort(
                                      (a, b) =>
                                        new Date(b).getTime() -
                                        new Date(a).getTime()
                                    )
                                )
                              ).map((date) => {
                                const data = dates[date];
                                return (
                                  <td
                                    key={date}
                                    className={`py-2 px-2 min-w-[100px] max-w-[120px] ${
                                      exerciseIndex % 2 === 0
                                        ? "bg-gray-50"
                                        : ""
                                    }`}
                                  >
                                    {data ? (
                                      <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                                        {data.sets.map((set, index) => (
                                          <div
                                            key={set.id}
                                            className={`${
                                              set.completed
                                                ? "text-green-600"
                                                : "text-gray-500"
                                            } py-0.5 flex items-center border-b border-gray-100 last:border-0 text-xs`}
                                          >
                                            <span className="font-medium whitespace-nowrap">
                                              {set.weight}
                                              <span className="mx-0.5">×</span>
                                              {set.reps}
                                            </span>
                                            <span className="ml-1">
                                              {set.completed ? (
                                                <svg
                                                  className="h-3 w-3 text-green-500"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                  />
                                                </svg>
                                              ) : (
                                                <svg
                                                  className="h-3 w-3 text-gray-400"
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
                                              )}
                                            </span>
                                          </div>
                                        ))}
                                        {/* Remove the note and duration from individual exercise cells */}
                                      </div>
                                    ) : (
                                      <div className="text-center text-gray-400">
                                        —
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Scroll indicator */}
                <div className="flex justify-center mt-2">
                  <div className="text-xs text-gray-500 flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    Scroll horizontally to see more dates
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
