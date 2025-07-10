"use client";

import Navigation from "@/components/shared/Navigation";
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
  Sets: string;
  Reps: string;
  Link: string;
}

interface Session {
  [exerciseName: string]: {
    Sets: string;
    Reps: string;
    Link: string;
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
      Sets: "2",
      Reps: "<=12-15",
      Link: "",
    },
    "Cable Overhead Triceps Extension": {
      Sets: "2",
      Reps: "<=15-20",
      Link: "",
    },
    "Heels Elevated Zercher Squat": {
      Sets: "4",
      Reps: "<=8-12",
      Link: "",
    },
    "One-leg Leg Extension": {
      Sets: "3",
      Reps: "<=15-20",
      Link: "",
    },
    "Scrape Rack L-Seated Shoulder Press": {
      Sets: "4",
      Reps: "<=12-15",
      Link: "",
    },
    "Seated DB Lateral Raise": {
      Sets: "2",
      Reps: "<=12-15",
      Link: "",
    },
  },
  "Session B": {
    "Face Pull (Half-kneeling)": {
      Sets: "4",
      Reps: "<=12-15",
      Link: "",
    },
    "Leg Curl Seated Calf Raise": {
      Sets: "3",
      Reps: "<=20-30",
      Link: "",
    },
    "One-leg Lying Leg Curl": {
      Sets: "3",
      Reps: "<=12-15",
      Link: "",
    },
    "Snatch-grip Romanian Deadlift": {
      Sets: "4",
      Reps: "<=8-12",
      Link: "",
    },
    "Wide Cable Shrug": {
      Sets: "3",
      Reps: "<=12-15",
      Link: "",
    },
  },
  "Session C": {
    "Cable Fly (High-to-Low)": {
      Sets: "3",
      Reps: "<=12-15",
      Link: "",
    },
    "Deficit Push-up": {
      Sets: "4",
      Reps: "<=8-12",
      Link: "",
    },
    "Facing Cable Bicep Curl (Fwd Lean)": {
      Sets: "3",
      Reps: "<=12-15",
      Link: "",
    },
    "Neutral Grip Chin-up": {
      Sets: "4",
      Reps: "<=5-8",
      Link: "",
    },
    "One-Arm DB Row": {
      Sets: "3",
      Reps: "<=12-15",
      Link: "",
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
  const [clientName, setClientName] = useState<string>("");

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
    field: "Sets" | "Reps" | "Link",
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
      <Navigation
        title={`${clientName || "Client"}'s Workout Template`}
        subtitle="Edit Mode"
        email={params.email as string}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* View/Edit Toggle */}
        <div className="flex space-x-4 my-6">
          <Link
            href={`/${params.email}/workout`}
            className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            View Progress
          </Link>
          <button className="px-6 py-2.5 rounded-lg bg-[#0a1c3f] hover:bg-[#0b2552] text-white font-medium text-sm transition-colors cursor-default">
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
                    <th className="pb-3 font-medium text-center w-16">Sets</th>
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
                  A <span className="font-bold">30 minute</span> morning walk is
                  a great way to kick this off.
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
                              value={details.Sets}
                              onChange={(e) =>
                                handleValueChange(
                                  sessionName,
                                  exerciseName,
                                  "Sets",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-center text-[#333333] focus:ring-2 focus:ring-red-500"
                              placeholder="Sets"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={details.Reps}
                              onChange={(e) =>
                                handleValueChange(
                                  sessionName,
                                  exerciseName,
                                  "Reps",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                              placeholder="Reps"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={details.Link}
                              onChange={(e) =>
                                handleValueChange(
                                  sessionName,
                                  exerciseName,
                                  "Link",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                              placeholder="https://www.youtube.com"
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
  );
}
