"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

// Add warm-up exercises constant at the top level
const warmUpExercises = [
  { name: "Foam Roller Walkover" },
  { name: "Hooklying Low Reach" },
  { name: "Side-Lying Split Squat" },
  { name: "1/4 Wall Squat w/Reach" },
  { name: "Toe Touch to Bench (Heels Elevated)" },
];

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  link: string;
}

interface Session {
  [exerciseName: string]: {
    sets: string;
    reps: string;
    link: string;
  };
}

interface WorkoutTemplate {
  "Session A": Session;
  "Session B": Session;
  "Session C": Session;
}

// Exercise options for the dropdown
const exerciseOptions = [
  "Barbell Hip Thrust",
  "Cable Overhead Triceps Extension",
  "Heels Elevated Zercher Squat",
  "One-leg Leg Extension",
  "Scrape Rack L-Seated Shoulder Press",
  "Seated DB Lateral Raise",
  "Face Pull (Half-kneeling)",
  "Leg Curl Seated Calf Raise",
  "One-leg Lying Leg Curl",
  "Snatch-grip Romanian Deadlift",
  "Wide Cable Shrug",
  "Cable Fly (High-to-Low)",
  "Deficit Push-up",
  "Facing Cable Bicep Curl (Fwd Lean)",
  "Neutral Grip Chin-up",
  "One-Arm DB Row",
  "Lat Pulldown",
  "Bench Press",
  "Deadlift",
  "Back Squat",
  "Front Squat",
  "Overhead Press",
  "Bent Over Row",
  "Dumbbell Curl",
  "Tricep Dips",
  "Leg Press",
  "Lunges",
  "Calf Raises",
  "Plank",
  "Russian Twist",
];

const defaultTemplate: WorkoutTemplate = {
  "Session A": {
    "Barbell Hip Thrust": {
      sets: "2",
      reps: "<=12-15 Rep Range",
      link: "",
    },
    "Cable Overhead Triceps Extension": {
      sets: "2",
      reps: "<=15-20 Rep Range",
      link: "",
    },
    "Heels Elevated Zercher Squat": {
      sets: "4",
      reps: "<=8-12 Rep Range",
      link: "",
    },
    "One-leg Leg Extension": {
      sets: "3",
      reps: "<=15-20 Rep Range",
      link: "",
    },
    "Scrape Rack L-Seated Shoulder Press": {
      sets: "4",
      reps: "<=12-15 Rep Range",
      link: "",
    },
    "Seated DB Lateral Raise": {
      sets: "2",
      reps: "<=12-15 Rep Range",
      link: "",
    },
  },
  "Session B": {
    "Face Pull (Half-kneeling)": {
      sets: "4",
      reps: "<=12-15 Rep Range",
      link: "",
    },
    "Leg Curl Seated Calf Raise": {
      sets: "3",
      reps: "<=20-30 Rep Range",
      link: "",
    },
    "One-leg Lying Leg Curl": {
      sets: "3",
      reps: "<=12-15 Rep Range",
      link: "",
    },
    "Snatch-grip Romanian Deadlift": {
      sets: "4",
      reps: "<=8-12 Rep Range",
      link: "",
    },
    "Wide Cable Shrug": {
      sets: "3",
      reps: "<=12-15 Rep Range",
      link: "",
    },
  },
  "Session C": {
    "Cable Fly (High-to-Low)": {
      sets: "3",
      reps: "<=12-15 Rep Range",
      link: "",
    },
    "Deficit Push-up": {
      sets: "4",
      reps: "<=8-12 Rep Range",
      link: "",
    },
    "Facing Cable Bicep Curl (Fwd Lean)": {
      sets: "3",
      reps: "<=12-15 Rep Range",
      link: "",
    },
    "Neutral Grip Chin-up": {
      sets: "4",
      reps: "<=5-8 Rep Range",
      link: "",
    },
    "One-Arm DB Row": {
      sets: "3",
      reps: "<=12-15 Rep Range",
      link: "",
    },
  },
};

export default function EditTemplate() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNav, setShowNav] = useState(false); // Add this line

  // Add date strip generation
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
    const fetchOrCreateTemplate = async () => {
      if (!params?.email) return;

      try {
        const clientEmail = decodeURIComponent(params.email as string);
        const docRef = doc(db, "WorkoutTemplates", clientEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTemplate(docSnap.data() as WorkoutTemplate);
        } else {
          // Initialize with default template
          await setDoc(docRef, defaultTemplate);
          setTemplate(defaultTemplate);
        }
      } catch (err) {
        setError("Failed to fetch or create workout template");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateTemplate();
  }, [params?.email]);

  const handleExerciseChange = (
    session: string,
    oldExerciseName: string,
    newExerciseName: string
  ) => {
    if (!template) return;

    setTemplate((prevTemplate) => {
      if (!prevTemplate) return null;

      const updatedSession = {
        ...prevTemplate[session as keyof WorkoutTemplate],
      };
      const exerciseData = updatedSession[oldExerciseName];

      // Remove old exercise
      delete updatedSession[oldExerciseName];

      // Add with new name
      updatedSession[newExerciseName] = exerciseData;

      return {
        ...prevTemplate,
        [session]: updatedSession,
      };
    });
  };

  const handleValueChange = (
    session: string,
    exerciseName: string,
    field: "sets" | "reps" | "link",
    value: string
  ) => {
    if (!template) return;

    setTemplate((prevTemplate) => {
      if (!prevTemplate) return null;

      return {
        ...prevTemplate,
        [session]: {
          ...prevTemplate[session as keyof WorkoutTemplate],
          [exerciseName]: {
            ...prevTemplate[session as keyof WorkoutTemplate][exerciseName],
            [field]: value,
          },
        },
      };
    });
  };

  const saveTemplate = async () => {
    if (!params?.email || !template) return;

    try {
      setSaving(true);
      const clientEmail = decodeURIComponent(params.email as string);
      const docRef = doc(db, "WorkoutTemplates", clientEmail);
      await setDoc(docRef, template);
      alert("Workout template saved successfully!");
    } catch (err) {
      setError("Failed to save workout template");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!template) return <div className="p-6">No template data found</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Side Navigation Drawer */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          showNav ? "translate-x-0" : "-translate-x-full"
        } bg-[#0a1c3f] text-white w-64 z-30 overflow-y-auto transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={() => setShowNav(false)} className="text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
          <nav>
            <ul className="space-y-4">
              {/* Add all your navigation items */}
              <li>
                <Link
                  href={`/${params.email}/details`}
                  className="flex items-center text-gray-300 hover:text-white"
                >
                  <span className="mr-3">📋</span>
                  Form Responses
                </Link>
              </li>
              <li>
                <Link
                  href={`/${params.email}/workout`}
                  className="flex items-center text-gray-300 hover:text-white"
                >
                  <span className="mr-3">💪</span>
                  Workout
                </Link>
              </li>
              <li>
                <Link
                  href={`/${params.email}/nutrition`}
                  className="flex items-center text-gray-300 hover:text-white"
                >
                  <span className="mr-3">🥗</span>
                  Nutrition
                </Link>
              </li>
              {/* Add more navigation items as needed */}
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          showNav ? "opacity-50 z-20" : "opacity-0 -z-10"
        }`}
        onClick={() => setShowNav(false)}
      ></div>

      {/* Main Content */}
      <div className="min-h-screen">
        {/* Header Bar */}
        <div className="bg-[#0a1c3f] text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button className="mr-3" onClick={() => setShowNav(true)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div className="mr-3">
                <p className="font-bold text-lg">Workout Template</p>
                <p className="text-xs opacity-80">Edit Mode</p>
              </div>
            </div>

            {/* Date Strip - kept same as user page */}
            <div className="flex space-x-4">
              {dateStrip.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-xs text-gray-300">{item.day}</span>
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      item.isToday ? "bg-red-500 text-white" : "text-white"
                    }`}
                  >
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* View/Edit Toggle */}
          <div className="flex space-x-4 my-6">
            <Link
              href={`/${params.email}/workout`}
              className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              View Template
            </Link>
            <button className="px-6 py-2.5 rounded-full bg-red-500 text-white font-medium text-sm">
              Edit Template
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Warm Up & Steps */}
            <div className="lg:col-span-1 space-y-6">
              {/* Warm Up Card */}
              <div className="bg-[#F5F5F5] rounded-xl shadow-sm p-5">
                <h2 className="text-[#1A1A1A] text-lg font-semibold mb-4">
                  Warm Up
                </h2>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-600 text-sm">
                      <th className="pb-3 font-medium">Exercise</th>
                      <th className="pb-3 font-medium text-center w-16">
                        Sets
                      </th>
                      <th className="pb-3 font-medium text-right w-24">Reps</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#333333] text-sm">
                    {warmUpExercises.map((exercise, index) => (
                      <tr key={index} className="h-10">
                        <td className="py-2">{exercise.name}</td>
                        <td className="py-2 text-center">1</td>
                        <td className="py-2 text-right">8 Reps/Breaths</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Steps Goal Card */}
              <div className="bg-[#F5F5F5] rounded-xl shadow-sm p-5">
                <h2 className="text-[#1A1A1A] text-lg font-semibold mb-4">
                  Daily Steps Target
                </h2>
                <div className="space-y-4 text-[#333333] text-sm">
                  <p>
                    Today you will aim to get{" "}
                    <span className="font-bold">8,000–10,000</span> steps.
                  </p>
                  <p>
                    A <span className="font-bold">30 minute</span> morning walk
                    is a great way to kick this off.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Workout Sessions */}
            <div className="lg:col-span-2 space-y-2 mb-6">
              {Object.entries(template).map(([sessionName, exercises]) => (
                <div key={sessionName}>
                  <h3 className="text-[#333333] font-semibold mb-2 text-right">
                    {sessionName}
                  </h3>
                  <div className="bg-[#F5F5F5] rounded-xl shadow-sm p-2">
                    <div className="space-y-0">
                      {Object.entries(exercises).map(
                        ([exerciseName, details]) => (
                          <div
                            key={exerciseName}
                            className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center py-1"
                          >
                            <div>
                              <select
                                className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                                value={exerciseName}
                                onChange={(e) =>
                                  handleExerciseChange(
                                    sessionName,
                                    exerciseName,
                                    e.target.value
                                  )
                                }
                              >
                                {exerciseOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <input
                                type="text"
                                value={details.sets}
                                onChange={(e) =>
                                  handleValueChange(
                                    sessionName,
                                    exerciseName,
                                    "sets",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white border-0 text-sm text-center text-[#333333] focus:ring-2 focus:ring-red-500"
                                placeholder="Sets"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={details.reps}
                                onChange={(e) =>
                                  handleValueChange(
                                    sessionName,
                                    exerciseName,
                                    "reps",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                                placeholder="Reps"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={details.link}
                                onChange={(e) =>
                                  handleValueChange(
                                    sessionName,
                                    exerciseName,
                                    "link",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                                placeholder="Demo link"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="fixed bottom-6 right-6">
            <button
              onClick={saveTemplate}
              disabled={saving}
              className="bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 disabled:bg-gray-400 shadow-lg transform hover:scale-105 transition-all"
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
