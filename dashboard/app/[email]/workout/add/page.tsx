"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import Link from "next/link";

interface ExerciseLink {
  name: string;
  link: string;
}

export default function AddExerciseLinks() {
  const params = useParams();
  const [category, setCategory] = useState<"warmUp" | "workout">("warmUp");
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warmUpExercises, setWarmUpExercises] = useState<ExerciseLink[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<ExerciseLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default warm-up exercises with placeholder links
  const defaultWarmUpExercises = [
    {
      name: "Foam Roller Walkover",
      link: "https://youtube.com/watch?v=example1",
    },
    {
      name: "Hooklying Low Reach",
      link: "https://youtube.com/watch?v=example2",
    },
    {
      name: "Side-Lying Split Squat",
      link: "https://youtube.com/watch?v=example3",
    },
    {
      name: "1/4 Wall Squat w/Reach",
      link: "https://youtube.com/watch?v=example4",
    },
    {
      name: "Toe Touch to Bench (Heels Elevated)",
      link: "https://youtube.com/watch?v=example5",
    },
    { name: "Cat-Cow Stretch", link: "https://youtube.com/watch?v=example6" },
    { name: "Bird Dog", link: "https://youtube.com/watch?v=example7" },
    { name: "Glute Bridge", link: "https://youtube.com/watch?v=example8" },
    {
      name: "Hip Flexor Stretch",
      link: "https://youtube.com/watch?v=example9",
    },
    {
      name: "Shoulder Dislocations",
      link: "https://youtube.com/watch?v=example10",
    },
    { name: "Band Pull-Aparts", link: "https://youtube.com/watch?v=example11" },
    { name: "Arm Circles", link: "https://youtube.com/watch?v=example12" },
    { name: "Bodyweight Squat", link: "https://youtube.com/watch?v=example13" },
    {
      name: "Push-up to Down Dog",
      link: "https://youtube.com/watch?v=example14",
    },
  ];

  // Default workout exercises with placeholder links
  const defaultWorkoutExercises = [
    { name: "Back Squat", link: "https://youtube.com/watch?v=workout1" },
    {
      name: "Barbell Hip Thrust",
      link: "https://youtube.com/watch?v=workout2",
    },
    { name: "Bench Press", link: "https://youtube.com/watch?v=workout3" },
    { name: "Bent Over Row", link: "https://youtube.com/watch?v=workout4" },
    {
      name: "Cable Fly (High-to-Low)",
      link: "https://youtube.com/watch?v=workout5",
    },
    {
      name: "Cable Overhead Triceps Extension",
      link: "https://youtube.com/watch?v=workout6",
    },
    { name: "Calf Raises", link: "https://youtube.com/watch?v=workout7" },
    { name: "Deadlift", link: "https://youtube.com/watch?v=workout8" },
    { name: "Deficit Push-up", link: "https://youtube.com/watch?v=workout9" },
    { name: "Dumbbell Curl", link: "https://youtube.com/watch?v=workout10" },
    {
      name: "Face Pull (Half-kneeling)",
      link: "https://youtube.com/watch?v=workout11",
    },
    {
      name: "Facing Cable Bicep Curl (Fwd Lean)",
      link: "https://youtube.com/watch?v=workout12",
    },
    { name: "Front Squat", link: "https://youtube.com/watch?v=workout13" },
    {
      name: "Heels Elevated Zercher Squat",
      link: "https://youtube.com/watch?v=workout14",
    },
    { name: "Lat Pulldown", link: "https://youtube.com/watch?v=workout15" },
    {
      name: "Leg Curl Seated Calf Raise",
      link: "https://youtube.com/watch?v=workout16",
    },
    { name: "Leg Press", link: "https://youtube.com/watch?v=workout17" },
    { name: "Lunges", link: "https://youtube.com/watch?v=workout18" },
    {
      name: "Neutral Grip Chin-up",
      link: "https://youtube.com/watch?v=workout19",
    },
    { name: "One-Arm DB Row", link: "https://youtube.com/watch?v=workout20" },
    {
      name: "One-leg Leg Extension",
      link: "https://youtube.com/watch?v=workout21",
    },
    {
      name: "One-leg Lying Leg Curl",
      link: "https://youtube.com/watch?v=workout22",
    },
    { name: "Overhead Press", link: "https://youtube.com/watch?v=workout23" },
    { name: "Plank", link: "https://youtube.com/watch?v=workout24" },
    { name: "Russian Twist", link: "https://youtube.com/watch?v=workout25" },
    {
      name: "Scrape Rack L-Seated Shoulder Press",
      link: "https://youtube.com/watch?v=workout26",
    },
    {
      name: "Seated DB Lateral Raise",
      link: "https://youtube.com/watch?v=workout27",
    },
    {
      name: "Snatch-grip Romanian Deadlift",
      link: "https://youtube.com/watch?v=workout28",
    },
    { name: "Tricep Dips", link: "https://youtube.com/watch?v=workout29" },
    { name: "Wide Cable Shrug", link: "https://youtube.com/watch?v=workout30" },
  ];

  // Fetch existing exercises on component mount
  useEffect(() => {
    async function fetchExerciseLinks() {
      try {
        setIsLoading(true);

        try {
          // Check if the exerciseLinks collection exists for warm-up exercises
          const warmUpSnapshot = await getDocs(
            collection(db, "exerciseLinks", "warmUp", "exercises")
          );
          const warmUpData = warmUpSnapshot.docs.map((doc) => ({
            name: doc.id,
            link: doc.data().link || "",
          }));
          setWarmUpExercises(warmUpData);
        } catch (e) {
          console.log("No warm-up exercises found in database");
          setWarmUpExercises([]);
        }

        try {
          // Check if the exerciseLinks collection exists for workout exercises
          const workoutSnapshot = await getDocs(
            collection(db, "exerciseLinks", "workout", "exercises")
          );
          const workoutData = workoutSnapshot.docs.map((doc) => ({
            name: doc.id,
            link: doc.data().link || "",
          }));
          setWorkoutExercises(workoutData);
        } catch (e) {
          console.log("No workout exercises found in database");
          setWorkoutExercises([]);
        }
      } catch (error) {
        console.error("Error fetching exercise links:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExerciseLinks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setStatus("Exercise name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Saving exercise link...");

      // Add the exercise to the appropriate subcollection
      const exerciseDoc = doc(
        db,
        "exerciseLinks",
        category,
        "exercises",
        name.trim()
      );
      await setDoc(exerciseDoc, { link });

      // Update the local state
      if (category === "warmUp") {
        setWarmUpExercises([...warmUpExercises, { name: name.trim(), link }]);
      } else {
        setWorkoutExercises([...workoutExercises, { name: name.trim(), link }]);
      }

      // Clear the form
      setName("");
      setLink("");
      setStatus(`Exercise "${name.trim()}" added to ${category} category!`);

      // Clear status after a delay
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error adding exercise link:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExercise = async (
    exerciseName: string,
    exerciseCategory: "warmUp" | "workout"
  ) => {
    if (!confirm(`Are you sure you want to delete "${exerciseName}"?`)) return;

    try {
      setIsSubmitting(true);

      // Delete from Firestore
      const exerciseDoc = doc(
        db,
        "exerciseLinks",
        exerciseCategory,
        "exercises",
        exerciseName
      );
      await setDoc(exerciseDoc, { link: "" });

      // Update local state
      if (exerciseCategory === "warmUp") {
        const updated = warmUpExercises.filter(
          (ex) => ex.name !== exerciseName
        );
        setWarmUpExercises(updated);
      } else {
        const updated = workoutExercises.filter(
          (ex) => ex.name !== exerciseName
        );
        setWorkoutExercises(updated);
      }

      setStatus(`Deleted "${exerciseName}" from ${exerciseCategory} category`);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const populateExerciseLinks = async () => {
    try {
      setIsSubmitting(true);
      setStatus("Populating database with exercise links...");

      // Create warm-up exercises
      for (const exercise of defaultWarmUpExercises) {
        const docRef = doc(
          db,
          "exerciseLinks",
          "warmUp",
          "exercises",
          exercise.name
        );
        await setDoc(docRef, { link: exercise.link });
      }

      // Create workout exercises
      for (const exercise of defaultWorkoutExercises) {
        const docRef = doc(
          db,
          "exerciseLinks",
          "workout",
          "exercises",
          exercise.name
        );
        await setDoc(docRef, { link: exercise.link });
      }

      // Refresh the local state with the new data
      setWarmUpExercises(defaultWarmUpExercises);
      setWorkoutExercises(defaultWorkoutExercises);

      setStatus("Successfully populated database with exercise links!");

      // Clear status after a delay
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error("Error populating exercise links:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        title="Exercise Library"
        subtitle="Add Exercise Links"
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
          <Link
            href={`/${params.email}/workout/edit-template`}
            className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            Edit Template
          </Link>
          <button className="px-6 py-2.5 rounded-lg bg-[#0a1c3f] hover:bg-[#0b2552] text-white font-medium text-sm transition-colors cursor-default">
            Add/Delete Exercise
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setCategory("warmUp")}
                    className={`px-4 py-2 rounded-md ${
                      category === "warmUp"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    Warm-Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("workout")}
                    className={`px-4 py-2 rounded-md ${
                      category === "workout"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    Workout
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Exercise Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter exercise name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="link"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Video Link
                </label>
                <input
                  type="url"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.youtube.com/..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-4 py-2 rounded-md ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSubmitting ? "Saving..." : "Add Exercise"}
              </button>

              {status && (
                <div
                  className={`p-3 rounded-md ${
                    status.includes("Error")
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {status}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Warm-Up Exercises List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Warm-Up Exercises</h2>
            {isLoading ? (
              <p>Loading warm-up exercises...</p>
            ) : warmUpExercises.length === 0 ? (
              <p className="text-gray-500">No warm-up exercises added yet.</p>
            ) : (
              <ul className="space-y-2">
                {warmUpExercises.map((exercise) => (
                  <li
                    key={exercise.name}
                    className="p-3 bg-white rounded-lg border border-gray-200 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      {exercise.link && (
                        <a
                          href={exercise.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Video
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => deleteExercise(exercise.name, "warmUp")}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Workout Exercises List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Workout Exercises</h2>
            {isLoading ? (
              <p>Loading workout exercises...</p>
            ) : workoutExercises.length === 0 ? (
              <p className="text-gray-500">No workout exercises added yet.</p>
            ) : (
              <ul className="space-y-2">
                {workoutExercises.map((exercise) => (
                  <li
                    key={exercise.name}
                    className="p-3 bg-white rounded-lg border border-gray-200 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      {exercise.link && (
                        <a
                          href={exercise.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Video
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => deleteExercise(exercise.name, "workout")}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
