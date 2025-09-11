"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Navigation from "../../../../components/shared/Navigation";

interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseSetHistory {
  sets: string[];
  completed: boolean;
}

interface ExerciseHistory {
  name: string;
  standardWeight: string;
  standardReps: string;
  standardSets: number;
  perSide?: boolean;
  history: ExerciseSetHistory[][];
}

export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionType = searchParams?.get("type") || "Session A";

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Aria Michele");
  const [sessionName, setSessionName] = useState<string>(sessionType);
  const email = params.email as string;

  // Mock workout dates
  const workoutDates = [
    {
      date: "1 July 2025",
      time: "08:00 AM - 09:30 AM",
      note: "Shoulder press felt strong today, increased weight",
      warmupCompleted: true,
    },
    {
      date: "24 June 2025",
      time: "08:00 AM - 09:30 AM",
      note: "Recovery was good since last session",
      warmupCompleted: false,
    },
    {
      date: "17 June 2025",
      time: "08:00 AM - 09:30 AM",
      note: "Great leg day, focused on hip thrusts and squat form",
      warmupCompleted: true,
    },
  ];

  // Mock exercise data
  const exercisesData: ExerciseHistory[] = [
    {
      name: "Barbell Hip Thrust",
      standardWeight: "80 kg",
      standardReps: "10 reps",
      standardSets: 3,
      history: [
        [
          { sets: ["80×10", "80×9", "80×8"], completed: true },
          { sets: ["80×10", "75×9", "75×8"], completed: true },
          { sets: ["80×10", "70×9", "70×8"], completed: true },
        ],
      ],
    },
    {
      name: "Cable Overhead Triceps Extension",
      standardWeight: "25 kg",
      standardReps: "12 reps",
      standardSets: 4,
      history: [
        [
          { sets: ["25×12", "25×11", "25×10"], completed: true },
          {
            sets: ["25×12", "25×10", "25×10", "25×9", "25×8"],
            completed: false,
          },
          { sets: ["20×12", "20×11", "20×10"], completed: true },
        ],
      ],
    },
    {
      name: "Heels Elevated Zercher Squat",
      standardWeight: "60 kg",
      standardReps: "8 reps",
      standardSets: 3,
      history: [
        [
          { sets: ["60×8", "60×8", "60×7", "60×7", "60×6"], completed: true },
          { sets: ["55×8", "55×8", "55×7"], completed: true },
          { sets: ["50×9", "50×8", "50×8", "50×7", "50×7"], completed: true },
        ],
      ],
    },
    {
      name: "One-leg Leg Extension",
      standardWeight: "20 kg",
      standardReps: "15 reps",
      standardSets: 3,
      perSide: true,
      history: [
        [
          {
            sets: ["20×15", "20×14", "20×13", "20×12", "20×12"],
            completed: false,
          },
          {
            sets: ["15×15", "15×14", "15×14", "15×13", "15×12"],
            completed: true,
          },
          {
            sets: ["15×15", "15×15", "15×14", "15×13", "15×12"],
            completed: true,
          },
        ],
      ],
    },
    {
      name: "Scrape Rack L-Seated Shoulder Press",
      standardWeight: "40 kg",
      standardReps: "10 reps",
      standardSets: 3,
      history: [
        [
          { sets: ["40×10", "40×9", "40×8", "40×8", "40×7"], completed: false },
          { sets: ["35×10", "35×10", "35×9", "35×9", "35×8"], completed: true },
          {
            sets: ["30×10", "30×10", "30×10", "30×9", "30×9"],
            completed: true,
          },
        ],
      ],
    },
    {
      name: "Seated DB Lateral Raise",
      standardWeight: "7.5 kg",
      standardReps: "12 reps",
      standardSets: 4,
      perSide: true,
      history: [
        [
          { sets: ["10×12", "10×11", "10×10", "10×10"], completed: true },
          { sets: ["7.5×12", "7.5×12", "7.5×11"], completed: true },
          { sets: ["5×12", "5×12", "5×11", "5×10"], completed: false },
        ],
      ],
    },
  ];

  useEffect(() => {
    const fetchClientName = async () => {
      if (!params?.email) return;
      try {
        const clientEmail = decodeURIComponent(params.email as string);
        const clientDocRef = doc(db, "intakeForms", clientEmail);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          setUserName(clientData.fullName || "Aria Michele");
        }
      } catch (err) {
        console.error("Failed to fetch client name:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientName();
  }, [params?.email]);

  // Determine performance trend for exercise (up, down or neutral)
  const getExerciseTrend = (
    exercise: ExerciseHistory,
    dateIndex: number
  ): "up" | "down" | "neutral" => {
    if (dateIndex === 0) return "neutral"; // First session has no trend

    // For demo, just return based on the exercise name and date index for variety
    if (dateIndex === 1) {
      if (
        [
          "Cable Overhead Triceps Extension",
          "One-leg Leg Extension",
          "Seated DB Lateral Raise",
        ].includes(exercise.name)
      ) {
        return "down";
      } else if (
        [
          "Heels Elevated Zercher Squat",
          "Scrape Rack L-Seated Shoulder Press",
        ].includes(exercise.name)
      ) {
        return "up";
      }
    } else if (dateIndex === 2) {
      if (["Seated DB Lateral Raise"].includes(exercise.name)) {
        return "down";
      } else if (
        [
          "Cable Overhead Triceps Extension",
          "One-leg Leg Extension",
          "Scrape Rack L-Seated Shoulder Press",
        ].includes(exercise.name)
      ) {
        return "up";
      }
    }

    return "neutral";
  };

  // Add this function to handle session selection
  const handleSessionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSession = e.target.value;
    if (selectedSession !== "All Sessions") {
      router.push(`/${params.email}/workout/session?type=${selectedSession}`);
    } else {
      // Navigate back to main workout page if "All Sessions" is selected
      router.push(`/${params.email}/workout`);
    }
  };

  // Function to normalize sets data to ensure consistent number of sets across all days
  const normalizeSetsData = (exercise: ExerciseHistory) => {
    return exercise.history[0].map((dayData) => {
      const normalizedSets = [...dayData.sets];

      // Add or remove sets to match the standardSets for this exercise
      if (normalizedSets.length < exercise.standardSets) {
        // Need to add more sets
        const lastSet = normalizedSets[normalizedSets.length - 1] || "";
        const weightPart = lastSet.split("×")[0];

        // For each missing set, add a new set with decreasing reps
        for (let i = normalizedSets.length; i < exercise.standardSets; i++) {
          const lastReps = parseInt(
            normalizedSets[i - 1]?.split("×")[1] || "5"
          );
          // Decrease reps slightly for additional sets (but not below 4)
          const newReps = Math.max(lastReps - 1, 4);
          normalizedSets.push(`${weightPart}×${newReps}`);
        }
      } else if (normalizedSets.length > exercise.standardSets) {
        // Need to remove extra sets
        normalizedSets.splice(exercise.standardSets);
      }

      return {
        ...dayData,
        sets: normalizedSets,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white p-6 flex justify-center items-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Navigation component */}
      <Navigation title="Workout" email={email as string} userName={userName} />

      {/* Progress Overview */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <h2 className="text-lg font-semibold">Progress Overview</h2>
          </div>

          <div className="flex space-x-2">
            <button className="px-4 py-1 rounded bg-[#DD3333] text-white text-sm">
              View
            </button>
            <button
              onClick={() =>
                router.push(`/${params.email}/workout/edit-template`)
              }
              className="px-4 py-1 rounded bg-[#142437] hover:bg-[#1D325A] text-white text-sm transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Workout History */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* Workout History Box - Matched to the layout in workout/page.tsx */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg">
          <div className="flex justify-between items-center p-6 pb-4">
            <h3 className="text-xl font-semibold">Workout History</h3>

            {/* Status Legend */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-[#4CAF50]"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-[#FFC107]"></div>
                <span>Modified</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-[#D94343]"></div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls - Matched to the layout in workout/page.tsx */}
          <div className="flex flex-wrap gap-3 px-6 pb-6 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Workout..."
                className="pl-9 pr-3 py-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white text-sm w-[250px]"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="relative">
              <select
                value={sessionType}
                onChange={handleSessionSelect}
                className="pl-3 pr-8 py-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white text-sm appearance-none"
              >
                <option>All Sessions</option>
                <option>Session A</option>
                <option>Session B</option>
                <option>Session C</option>
              </select>
              <svg
                className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            <div className="relative">
              <select className="pl-3 pr-8 py-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white text-sm appearance-none">
                <option>Modifications</option>
                <option>All</option>
                <option>None</option>
              </select>
              <svg
                className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            <div className="p-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white cursor-pointer hover:bg-[#1D325A] transition-colors">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>

            <button className="ml-auto flex items-center gap-1 p-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Workout Table - Separate box with fixed column widths */}
        <div className="bg-[#07172C] border border-[#07172C] rounded-lg mt-4 p-4 overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed">
            <colgroup>
              <col className="w-72" />
              {workoutDates.map((_, index) => (
                <col key={index} className="w-60" />
              ))}
            </colgroup>
            <thead>
              <tr className="text-left">
                <th className="p-3 border-b border-[#22364F]">Exercise</th>
                {workoutDates.map((date, index) => (
                  <th key={index} className="p-3 border-b border-[#22364F]">
                    <div className="font-semibold">{date.date}</div>
                    <div className="text-xs text-gray-400">
                      Time: {date.time}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      Note: {date.note}
                    </div>
                    <div className="text-xs mt-1 flex items-center">
                      Warmup:
                      {date.warmupCompleted ? (
                        <svg
                          className="w-4 h-4 ml-1 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 ml-1 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exercisesData.map((exercise, exIndex) => {
                const normalizedData = normalizeSetsData(exercise);

                return (
                  <tr key={exIndex} className="border-b border-[#22364F]">
                    <td className="p-3">
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-xs text-gray-400">
                        {exercise.standardWeight} × {exercise.standardReps} ×{" "}
                        {exercise.standardSets} sets
                        {exercise.perSide ? " (per leg)" : ""}
                      </div>
                    </td>

                    {normalizedData.map((dayData, dateIndex) => {
                      return (
                        <td key={dateIndex} className="p-2 relative">
                          <div className="flex flex-col w-full">
                            {dayData.sets.map((set, setIndex) => (
                              <div
                                key={setIndex}
                                className="relative py-2 px-2 w-full bg-[#FFFFFF80] text-white"
                                style={{
                                  borderRadius:
                                    setIndex === 0
                                      ? "0.375rem 0.375rem 0 0"
                                      : setIndex === dayData.sets.length - 1
                                      ? "0 0 0.375rem 0.375rem"
                                      : "none",
                                }}
                              >
                                {set}
                                {setIndex < dayData.sets.length - 1 && (
                                  <div className="absolute bottom-0 left-[2%] w-[90%] h-[1px] bg-white/20"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
