"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Workout Template</h1>
        <Link
          href={`/${params.email}/workout`}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Workout
        </Link>
      </div>

      <div className="space-y-10">
        {Object.entries(template).map(([sessionName, exercises]) => (
          <div key={sessionName} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{sessionName}</h2>

            <div className="space-y-4">
              {Object.entries(exercises).map(([exerciseName, details]) => (
                <div key={exerciseName} className="border p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Exercise Name Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercise
                      </label>
                      <select
                        className="w-full p-2 border rounded"
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

                    {/* Sets Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sets
                      </label>
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
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    {/* Reps Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reps
                      </label>
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
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    {/* Link Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link (Optional)
                      </label>
                      <input
                        type="text"
                        value={details.link}
                        placeholder="Exercise demonstration link"
                        onChange={(e) =>
                          handleValueChange(
                            sessionName,
                            exerciseName,
                            "link",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={saveTemplate}
          disabled={saving}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
      </div>
    </div>
  );
}
