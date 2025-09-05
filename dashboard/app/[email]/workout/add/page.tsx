"use client";

import { useState, useEffect } from "react";
import { db } from "../../../../firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
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
  const [userName, setUserName] = useState<string>("User");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

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

  // Fetch client name
  useEffect(() => {
    const fetchClientName = async () => {
      if (!params?.email) return;
      try {
        const clientEmail = decodeURIComponent(params.email as string);
        const clientDocRef = doc(db, "intakeForms", clientEmail);
        const clientDocSnap = await getDoc(clientDocRef);
        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data();
          setUserName(clientData.fullName || "User");
        }
      } catch (err) {
        console.error("Failed to fetch client name:", err);
      }
    };

    fetchClientName();
  }, [params?.email]);

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

  const deleteExercise = async (exerciseName: string) => {
    try {
      setIsSubmitting(true);

      // Delete from Firestore
      const exerciseDoc = doc(
        db,
        "exerciseLinks",
        category,
        "exercises",
        exerciseName
      );
      await deleteDoc(exerciseDoc);

      // Update local state
      if (category === "warmUp") {
        const updated = warmUpExercises.filter((ex) => ex.name !== exerciseName);
        setWarmUpExercises(updated);
      } else {
        const updated = workoutExercises.filter((ex) => ex.name !== exerciseName);
        setWorkoutExercises(updated);
      }

      setStatus(`Deleted "${exerciseName}" from ${category} category`);
      
      // Clear selected exercise if it was the one deleted
      if (selectedExercise === exerciseName) {
        setSelectedExercise(null);
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const exercises = category === "warmUp" ? warmUpExercises : workoutExercises;

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      <Navigation
        title="Workout"
        subtitle="Add/Delete Exercises"
        email={params.email as string}
        userName={userName}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* View/Edit/Add Toggle */}
        <div className="flex justify-between items-center mt-6">
          <div className="invisible">
            {/* Hidden placeholder to maintain layout */}
            <span>Placeholder</span>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href={`/${params.email}/workout`}
              className="px-4 py-1 rounded bg-[#142437] hover:bg-[#1D325A] text-white text-sm transition-colors"
            >
              View
            </Link>
            <Link
              href={`/${params.email}/workout/edit-template`}
              className="px-4 py-1 rounded bg-[#142437] hover:bg-[#1D325A] text-white text-sm transition-colors"
            >
              Edit
            </Link>
            <button className="px-4 py-1 rounded bg-[#DD3333] text-white text-sm">
              Add/Del
            </button>
          </div>
        </div>

        {/* Category Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-md overflow-hidden">
            <button
              onClick={() => setCategory("warmUp")}
              className={`px-6 py-2 ${
                category === "warmUp" ? "bg-[#DD3333]" : "bg-[#142437]"
              }`}
            >
              Warmup
            </button>
            <button
              onClick={() => setCategory("workout")}
              className={`px-6 py-2 ${
                category === "workout" ? "bg-[#DD3333]" : "bg-[#142437]"
              }`}
            >
              Exercises
            </button>
          </div>
        </div>

        {/* Add Exercise Form */}
        <div className="mt-6 max-w-2xl mx-auto"> {/* Increased from max-w-2xl */}
          <h2 className="text-lg mb-3 text-white">Exercise Name</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full py-3 px-4 bg-[#142437] border border-[#22364F] rounded-lg text-white mb-4"
            placeholder="Enter exercise name..."
          />
          
          <h2 className="text-lg mb-3 text-white">Video Link</h2>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full py-3 px-4 bg-[#142437] border border-[#22364F] rounded-lg text-white mb-4"
            placeholder="Enter video link..."
          />
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#DD3333] rounded-lg text-white font-medium hover:bg-[#c02020] transition-colors mt-2"
          >
            Add Exercise
          </button>
          
          {status && (
            <div className={`mt-4 p-3 rounded-lg ${
              status.includes("Error") ? "bg-red-900/50 border border-red-700" : "bg-green-900/50 border border-green-700"
            }`}>
              {status}
            </div>
          )}
        </div>

        {/* Exercise List - Updated to display all exercises without scrolling */}
        <div className="mt-10 max-w-3xl mx-auto">
          <h2 className="text-xl font-medium mb-4">
            {category === "warmUp" ? "Warm-Up Exercises" : "Workout Exercises"}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              <p className="mt-2">Loading exercises...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="bg-[#D9D9D940] border border-[#22364F] rounded-lg p-6 text-center">
              <p>No exercises found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"> {/* Changed to grid layout */}
              {exercises.map((exercise) => (
                <div
                  key={exercise.name}
                  className={`bg-[#D9D9D940] border border-[#22364F] rounded-lg p-3 flex flex-col h-[80px] ${
                    selectedExercise === exercise.name ? "border-[#DD3333]" : ""
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <h3 className="font-medium text-sm truncate max-w-[70%]">{exercise.name}</h3>
                    <button
                      onClick={() => deleteExercise(exercise.name)}
                      className="text-[#DD3333] hover:text-[#FF6666] ml-auto"
                      aria-label="Delete exercise"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  {exercise.link && (
                    <div className="mt-auto text-xs text-gray-400">
                      <a 
                        href={exercise.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-400"
                      >
                        View Video
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
