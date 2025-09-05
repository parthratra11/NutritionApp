"use client";

import Navigation from "@/components/shared/Navigation";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../firebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import Link from "next/link";

// Interface definitions
interface Exercise {
  name: string;
  Sets: string;
  Reps: string;
  Weight: string;
  Link: string;
}

interface OrderedExercise {
  name: string;
  Sets: string;
  Reps: string;
  Weight: string;
  Link: string;
}

interface Session {
  [exerciseName: string]: {
    Sets: string;
    Reps: string;
    Weight: string;
    Link: string;
  };
}

interface OrderedSession {
  exercises: OrderedExercise[];
  isOpen?: boolean;
}

interface WorkoutTemplate {
  "Session A": Session;
  "Session B": Session;
  "Session C": Session;
}

interface OrderedTemplate {
  "Session A": OrderedSession;
  "Session B": OrderedSession;
  "Session C": OrderedSession;
}

interface WarmUpExercise {
  name: string;
  sets: string;
  reps: string;
  link: string;
}

interface ExtendedWorkoutTemplate extends WorkoutTemplate {
  warmUp?: WarmUpExercise[];
  dailySteps?: {
    target: string;
    walkDuration: string;
  };
}

// Exercise options for the dropdown
const exerciseOptions = [
  "Back Squat",
  "Barbell Hip Thrust",
  "Bench Press",
  "Bent Over Row",
  "Cable Fly (High-to-Low)",
  "Cable Overhead Triceps Extension",
  "Calf Raises",
  "Deadlift",
  "Deficit Push-up",
  "Dumbbell Curl",
  "Face Pull (Half-kneeling)",
  "Facing Cable Bicep Curl (Fwd Lean)",
  "Front Squat",
  "Heels Elevated Zercher Squat",
  "Lat Pulldown",
  "Leg Curl Seated Calf Raise",
  "Leg Press",
  "Lunges",
  "Neutral Grip Chin-up",
  "One-Arm DB Row",
  "One-leg Leg Extension",
  "One-leg Lying Leg Curl",
  "Overhead Press",
  "Plank",
  "Russian Twist",
  "Scrape Rack L-Seated Shoulder Press",
  "Seated DB Lateral Raise",
  "Snatch-grip Romanian Deadlift",
  "Tricep Dips",
  "Wide Cable Shrug",
].sort();

// Warm-up exercise options
const warmUpExerciseOptions = [
  "Foam Roller Walkover",
  "Hooklying Low Reach",
  "Side-Lying Split Squat",
  "1/4 Wall Squat w/Reach",
  "Toe Touch to Bench (Heels Elevated)",
  "Cat-Cow Stretch",
  "Bird Dog",
  "Glute Bridge",
  "Hip Flexor Stretch",
  "Shoulder Dislocations",
  "Band Pull-Aparts",
  "Arm Circles",
  "Bodyweight Squat",
  "Push-up to Down Dog",
].sort();

// Default template
const defaultTemplate: WorkoutTemplate = {
  "Session A": {
    "Barbell Hip Thrust": {
      Sets: "2",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
    "Cable Overhead Triceps Extension": {
      Sets: "2",
      Reps: "<=15-20",
      Weight: "",
      Link: "",
    },
    "Heels Elevated Zercher Squat": {
      Sets: "4",
      Reps: "<=8-12",
      Weight: "",
      Link: "",
    },
    "One-leg Leg Extension": {
      Sets: "3",
      Reps: "<=15-20",
      Weight: "",
      Link: "",
    },
    "Scrape Rack L-Seated Shoulder Press": {
      Sets: "4",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
    "Seated DB Lateral Raise": {
      Sets: "2",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
  },
  "Session B": {
    "Face Pull (Half-kneeling)": {
      Sets: "4",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
    "Leg Curl Seated Calf Raise": {
      Sets: "3",
      Reps: "<=20-30",
      Weight: "",
      Link: "",
    },
    "One-leg Lying Leg Curl": {
      Sets: "3",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
    "Snatch-grip Romanian Deadlift": {
      Sets: "4",
      Reps: "<=8-12",
      Weight: "",
      Link: "",
    },
    "Wide Cable Shrug": {
      Sets: "3",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
  },
  "Session C": {
    "Cable Fly (High-to-Low)": {
      Sets: "3",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
    "Deficit Push-up": {
      Sets: "4",
      Reps: "<=8-12",
      Weight: "",
      Link: "",
    },
    "Facing Cable Bicep Curl (Fwd Lean)": {
      Sets: "3",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
    "Neutral Grip Chin-up": {
      Sets: "4",
      Reps: "<=5-8",
      Weight: "",
      Link: "",
    },
    "One-Arm DB Row": {
      Sets: "3",
      Reps: "<=12-15",
      Weight: "",
      Link: "",
    },
  },
};

// Default warm-up exercises
const defaultWarmUpExercises: WarmUpExercise[] = [
  { name: "Foam Roller Walkover", sets: "1", reps: "8 Reps", link: "" },
  { name: "Hooklying Low Reach", sets: "1", reps: "8 Reps", link: "" },
  { name: "Side-Lying Split Squat", sets: "1", reps: "8 Reps", link: "" },
  { name: "1/4 Wall Squat w/Reach", sets: "1", reps: "8 Reps", link: "" },
  {
    name: "Toe Touch to Bench (Heels Elevated)",
    sets: "1",
    reps: "8 Reps",
    link: "",
  },
];

// Default steps target
const defaultDailySteps = {
  target: "10,000",
  walkDuration: "30 minute",
};

export default function EditTemplate() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<ExtendedWorkoutTemplate | null>(
    null
  );
  const [orderedTemplate, setOrderedTemplate] =
    useState<OrderedTemplate | null>(null);
  const [warmUpExercises, setWarmUpExercises] = useState<WarmUpExercise[]>(
    defaultWarmUpExercises
  );
  const [dailySteps, setDailySteps] = useState(defaultDailySteps);
  const [editingWarmUp, setEditingWarmUp] = useState(true);
  const [editingSteps, setEditingSteps] = useState(false);
  const [showWarmUpModal, setShowWarmUpModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [clientName, setClientName] = useState<string>("");
  const [userName, setUserName] = useState<string>("User"); // Add userName state

  // State for exercise options and links
  const [warmUpOptions, setWarmUpOptions] = useState<string[]>(
    warmUpExerciseOptions
  );
  const [workoutOptions, setWorkoutOptions] =
    useState<string[]>(exerciseOptions);
  const [exerciseLinks, setExerciseLinks] = useState<{ [key: string]: string }>(
    {}
  );

  // Convert template object to ordered array structure
  const convertToOrderedTemplate = (templateData: WorkoutTemplate): OrderedTemplate => {
  const ordered: OrderedTemplate = {
    "Session A": { exercises: [], isOpen: false },
    "Session B": { exercises: [], isOpen: false },
    "Session C": { exercises: [], isOpen: false },
  };

  Object.entries(templateData).forEach(([sessionKey, session]) => {
    const sessionType = sessionKey as keyof WorkoutTemplate;

    // Sort exercises alphabetically
    const sortedExercises = Object.entries(session)
      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
      .map(([name, details]) => ({
        name,
        ...details,
      }));

    ordered[sessionType].exercises = sortedExercises;
  });

  return ordered;
};

  // Convert ordered array structure back to template object
  const convertToTemplate = (orderedData: OrderedTemplate): WorkoutTemplate => {
    const template: WorkoutTemplate = {
      "Session A": {},
      "Session B": {},
      "Session C": {},
    };

    Object.entries(orderedData).forEach(([sessionKey, session]) => {
      const sessionType = sessionKey as keyof OrderedTemplate;

      session.exercises.forEach((exercise) => {
        const { name, ...details } = exercise;
        template[sessionType][name] = details;
      });
    });

    return template;
  };

  // Function to fetch exercise links from Firestore
  const fetchExerciseLinks = async () => {
    try {
      setLoading(true);

      // Fetch warm-up exercise links
      try {
        const warmUpSnapshot = await getDocs(
          collection(db, "exerciseLinks", "warmUp", "exercises")
        );
        const warmUpLinks: { [key: string]: string } = {};
        const warmUpNames: string[] = [];

        warmUpSnapshot.forEach((doc) => {
          warmUpLinks[doc.id] = doc.data().link || "";
          warmUpNames.push(doc.id);
        });

        // Sort exercise names alphabetically
        warmUpNames.sort((a, b) => a.localeCompare(b));
        setWarmUpOptions(
          warmUpNames.length > 0 ? warmUpNames : warmUpExerciseOptions
        );

        // Update warm-up exercises with links from database
        setWarmUpExercises((prev) =>
          prev.map((exercise) => ({
            ...exercise,
            link: warmUpLinks[exercise.name] || exercise.link,
          }))
        );

        // Add warm up links to the exercise links map
        setExerciseLinks((prevLinks) => ({
          ...prevLinks,
          ...warmUpLinks,
        }));
      } catch (e) {
        console.log("No warm-up exercises found in database, using defaults");
        setWarmUpOptions(warmUpExerciseOptions);
      }

      // Fetch workout exercise links
      try {
        const workoutSnapshot = await getDocs(
          collection(db, "exerciseLinks", "workout", "exercises")
        );
        const workoutLinks: { [key: string]: string } = {};
        const workoutNames: string[] = [];

        workoutSnapshot.forEach((doc) => {
          workoutLinks[doc.id] = doc.data().link || "";
          workoutNames.push(doc.id);
        });

        // Sort exercise names alphabetically
        workoutNames.sort((a, b) => a.localeCompare(b));
        setWorkoutOptions(
          workoutNames.length > 0 ? workoutNames : exerciseOptions
        );

        // Add workout links to the exercise links map
        setExerciseLinks((prevLinks) => ({
          ...prevLinks,
          ...workoutLinks,
        }));
      } catch (e) {
        console.log("No workout exercises found in database, using defaults");
        setWorkoutOptions(exerciseOptions);
      }
    } catch (error) {
      console.error("Error fetching exercise links:", error);
    } finally {
      setLoading(false);
    }
  };

  // Call fetchExerciseLinks when component mounts
  useEffect(() => {
    fetchExerciseLinks();
  }, []);

  // Fetch or create template
  useEffect(() => {
    const fetchOrCreateTemplate = async () => {
      if (!params?.email) return;

      try {
        const clientEmail = decodeURIComponent(params.email as string);
        const docRef = doc(db, "WorkoutTemplates", clientEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const fetchedTemplate = docSnap.data() as ExtendedWorkoutTemplate;

          // Apply any matching links from our exercise links database
          if (fetchedTemplate.warmUp) {
            fetchedTemplate.warmUp = fetchedTemplate.warmUp.map((exercise) => ({
              ...exercise,
              link: exerciseLinks[exercise.name] || exercise.link,
            }));
          }

          // Apply links to workout exercises
          Object.keys(fetchedTemplate).forEach((sessionKey) => {
            if (sessionKey !== "warmUp" && sessionKey !== "dailySteps") {
              const session =
                fetchedTemplate[sessionKey as keyof WorkoutTemplate];
              if (session) {
                Object.keys(session).forEach((exerciseName) => {
                  if (exerciseLinks[exerciseName]) {
                    session[exerciseName].Link = exerciseLinks[exerciseName];
                  }
                });
              }
            }
          });

          setTemplate(fetchedTemplate);
          setOrderedTemplate(convertToOrderedTemplate(fetchedTemplate));

          // Load warm-up exercises if they exist
          if (fetchedTemplate.warmUp) {
            setWarmUpExercises(fetchedTemplate.warmUp);
          }

          // Load daily steps if they exist
          if (fetchedTemplate.dailySteps) {
            setDailySteps(fetchedTemplate.dailySteps);
          }
        } else {
          // Initialize with default template
          const extendedDefault: ExtendedWorkoutTemplate = {
            ...defaultTemplate,
            warmUp: defaultWarmUpExercises,
            dailySteps: defaultDailySteps,
          };
          await setDoc(docRef, extendedDefault);
          setTemplate(extendedDefault);
          setOrderedTemplate(convertToOrderedTemplate(defaultTemplate));
        }
      } catch (err) {
        setError("Failed to fetch or create workout template");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateTemplate();
  }, [params?.email, exerciseLinks]);

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
          setClientName(clientData.fullName);
          setUserName(clientData.fullName || "User");
        }
      } catch (err) {
        console.error("Failed to fetch client name:", err);
      }
    };

    fetchClientName();
  }, [params?.email]);

  // Event handlers
  const handleExerciseChange = (
    sessionName: string,
    index: number,
    newExerciseName: string
  ) => {
    if (!orderedTemplate) return;

    setOrderedTemplate((prev) => {
      if (!prev) return null;

      const sessionType = sessionName as keyof OrderedTemplate;
      const updatedExercises = [...prev[sessionType].exercises];

      updatedExercises[index] = {
        ...updatedExercises[index],
        name: newExerciseName,
        // Apply link from database if available
        Link: exerciseLinks[newExerciseName] || updatedExercises[index].Link,
      };

      // Sort exercises after changing
      updatedExercises.sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...prev,
        [sessionType]: { exercises: updatedExercises },
      };
    });
  };

  const handleValueChange = (
    sessionName: string,
    index: number,
    field: "Sets" | "Reps" | "Weight" | "Link",
    value: string
  ) => {
    if (!orderedTemplate) return;

    setOrderedTemplate((prev) => {
      if (!prev) return null;

      const sessionType = sessionName as keyof OrderedTemplate;
      const updatedExercises = [...prev[sessionType].exercises];

      updatedExercises[index] = {
        ...updatedExercises[index],
        [field]: value,
      };

      return {
        ...prev,
        [sessionType]: { exercises: updatedExercises },
      };
    });
  };

  // Add a new function to add exercises
  const addExercise = (sessionName: string) => {
    if (!orderedTemplate) return;

    setOrderedTemplate((prev) => {
      if (!prev) return null;

      const sessionType = sessionName as keyof OrderedTemplate;
      const defaultName = workoutOptions.length > 0 ? workoutOptions[0] : "";

      // Create a new exercise with default values
      const newExercise: OrderedExercise = {
        name: defaultName,
        Sets: "",
        Reps: "",
        Weight: "",
        Link: exerciseLinks[defaultName] || "",
      };

      const updatedExercises = [...prev[sessionType].exercises, newExercise];

      // Sort exercises alphabetically after adding
      updatedExercises.sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...prev,
        [sessionType]: { exercises: updatedExercises },
      };
    });
  };

  // Add a new function to delete exercises
  const deleteExercise = (sessionName: string, index: number) => {
    if (!orderedTemplate) return;

    setOrderedTemplate((prev) => {
      if (!prev) return null;

      const sessionType = sessionName as keyof OrderedTemplate;
      const updatedExercises = [...prev[sessionType].exercises];

      // Remove the exercise at the specified index
      updatedExercises.splice(index, 1);

      return {
        ...prev,
        [sessionType]: { exercises: updatedExercises },
      };
    });
  };

  // Add/remove warm-up exercise
  const addWarmUpExercise = () => {
    // Use the first warm-up option or an empty string as the default
    const defaultName = warmUpOptions.length > 0 ? warmUpOptions[0] : "";

    setWarmUpExercises([
      ...warmUpExercises,
      {
        name: defaultName,
        sets: "1",
        reps: "8 Reps",
        link: exerciseLinks[defaultName] || "",
      },
    ]);
  };

  const deleteWarmUpExercise = (index: number) => {
    const updated = [...warmUpExercises];
    updated.splice(index, 1);
    setWarmUpExercises(updated);
  };

  const handleWarmUpChange = (
    index: number,
    field: keyof WarmUpExercise,
    value: string
  ) => {
    const updated = [...warmUpExercises];

    if (field === "name") {
      // If changing name, update the link if we have it in the database
      updated[index] = {
        ...updated[index],
        name: value,
        link: exerciseLinks[value] || "", // Apply link from our database if it exists
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setWarmUpExercises(updated);
  };

  const saveTemplate = async () => {
    if (!params?.email || !orderedTemplate) return;

    try {
      setSaving(true);
      const clientEmail = decodeURIComponent(params.email as string);

      // Convert ordered template back to regular template for storage
      const templateToSave = convertToTemplate(orderedTemplate);

      // Add warm-up exercises and daily steps to the saved template
      const extendedTemplate: ExtendedWorkoutTemplate = {
        ...templateToSave,
        warmUp: warmUpExercises,
        dailySteps: dailySteps,
      };

      const docRef = doc(db, "WorkoutTemplates", clientEmail);
      await setDoc(docRef, extendedTemplate);
      setTemplate(extendedTemplate);
      alert("Workout template saved successfully!");
    } catch (err) {
      setError("Failed to save workout template");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Function to toggle warm-up modal
  const toggleWarmUpModal = () => {
    setShowWarmUpModal(!showWarmUpModal);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#07172C] text-white p-6 flex justify-center items-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#07172C] text-white p-6 flex justify-center items-center">
        <div className="text-red-500">{error}</div>
      </div>
    );

  if (!orderedTemplate)
    return (
      <div className="min-h-screen bg-[#07172C] text-white p-6 flex justify-center items-center">
        <div>No template data found</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      <Navigation
        title="Workout"
        subtitle="Edit your workout plan"
        email={params.email as string}
        userName={userName}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Progress Overview with Edit/View Toggle */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <h2 className="text-lg font-semibold">Progress Overview</h2>
          </div>

          <div className="flex space-x-2">
            <Link
              href={`/${params.email}/workout`}
              className="px-4 py-1 rounded bg-[#142437] hover:bg-[#1D325A] text-white text-sm transition-colors"
            >
              View
            </Link>
            <button className="px-4 py-1 rounded bg-[#DD3333] text-white text-sm">
              Edit
            </button>
            <Link
              href={`/${params.email}/workout/add`}
              className="px-4 py-1 rounded bg-[#142437] hover:bg-[#1D325A] text-white text-sm transition-colors"
            >
              Add/Del
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Training Sessions Card */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-6 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-4xl">5</h3>
              <p className="text-gray-400 text-sm mt-1">
                Training Sessions per week
              </p>
            </div>
            <div>
              {/* Icon placeholder */}
            </div>
          </div>

          {/* Steps Card */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-6 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-4xl">8,000-10,000</h3>
              <p className="text-gray-400 text-sm mt-1">Steps per Day</p>
            </div>
            <button
              onClick={() => setEditingSteps(true)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-10 10a2 2 0 01-2.828 0l-1-1a2 2 0 010-2.828l10-10z" />
                <path d="M14 6h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Two Column Layout for Workout Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Warmup */}
          <div className="space-y-4">
            {/* Warmup Section */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg overflow-hidden">
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setEditingWarmUp(!editingWarmUp)}
              >
                <h3 className="font-medium">Warmup</h3>
                <svg
                  className={`w-5 h-5 transform ${
                    editingWarmUp ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* Warmup Content */}
              {editingWarmUp && (
                <div className="px-4 pb-4">
                  {/* Warmup Exercise Headers */}
                  <div className="grid grid-cols-12 text-sm text-gray-400 mb-2">
                    <div className="col-span-6">Exercises</div>
                    <div className="col-span-2 text-center">Sets</div>
                    <div className="col-span-2 text-center">Reps</div>
                    <div className="col-span-2"></div>
                  </div>

                  {/* Warmup Exercises List */}
                  <div className="space-y-2">
                    {warmUpExercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-[#0E1F34] rounded-md p-3 grid grid-cols-12 items-center"
                      >
                        <div className="col-span-6 flex items-center">
                          <span className="bg-[#1E2E47] text-white text-xs rounded px-1.5 py-0.5 mr-2">
                            {index + 1}
                          </span>
                          <span className="truncate">{exercise.name}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          {exercise.sets}
                        </div>
                        <div className="col-span-2 text-center">
                          {exercise.reps}
                        </div>
                        <div className="col-span-2 flex justify-end space-x-2">
                          {exercise.link && (
                            <a
                              href={exercise.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => handleWarmUpChange(index, "link", "")}
                            className="text-gray-400 hover:text-white"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Exercise Button */}
                  <button
                    onClick={addWarmUpExercise}
                    className="w-full mt-3 py-2 text-sm text-gray-300 hover:text-white border border-dashed border-[#22364F] rounded-md flex items-center justify-center"
                  >
                    <span>+ Add Exercise</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sessions */}
          <div className="space-y-4">
            {/* Session A */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg overflow-hidden">
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => {
                  // Toggle Session A visibility
                  setOrderedTemplate((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      "Session A": {
                        ...prev["Session A"],
                        isOpen: !prev["Session A"].isOpen,
                      },
                    };
                  });
                }}
              >
                <h3 className="font-medium">Session A</h3>
                <svg
                  className={`w-5 h-5 transform ${
                    orderedTemplate?.["Session A"]?.isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* Session A Content */}
              {orderedTemplate?.["Session A"]?.isOpen && (
                <div className="px-4 pb-4">
                  {/* Session Exercise Headers */}
                  <div className="grid grid-cols-12 text-sm text-gray-400 mb-2">
                    <div className="col-span-6">Exercises</div>
                    <div className="col-span-2 text-center">Sets</div>
                    <div className="col-span-2 text-center">Reps</div>
                    <div className="col-span-2"></div>
                  </div>

                  {/* Session Exercises List */}
                  <div className="space-y-2">
                    {orderedTemplate["Session A"].exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-[#0E1F34] rounded-md p-3 grid grid-cols-12 items-center"
                      >
                        <div className="col-span-6 flex items-center">
                          <span className="bg-[#1E2E47] text-white text-xs rounded px-1.5 py-0.5 mr-2">
                            {index + 1}
                          </span>
                          <span className="truncate">{exercise.name}</span>
                        </div>
                        <div className="col-span-2 text-center">{exercise.Sets}</div>
                        <div className="col-span-2 text-center">{exercise.Reps}</div>
                        <div className="col-span-2 flex justify-end space-x-2">
                          {exercise.Link && (
                            <a
                              href={exercise.Link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => handleValueChange("Session A", index, "Link", "")}
                            className="text-gray-400 hover:text-white"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Exercise Button */}
                  <button
                    onClick={() => addExercise("Session A")}
                    className="w-full mt-3 py-2 text-sm text-gray-300 hover:text-white border border-dashed border-[#22364F] rounded-md flex items-center justify-center"
                  >
                    <span>+ Add Exercise</span>
                  </button>
                </div>
              )}
            </div>

            {/* Session B */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg overflow-hidden">
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => {
                  // Toggle Session B visibility
                  setOrderedTemplate((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      "Session B": {
                        ...prev["Session B"],
                        isOpen: !prev["Session B"].isOpen,
                      },
                    };
                  });
                }}
              >
                <h3 className="font-medium">Session B</h3>
                <svg
                  className={`w-5 h-5 transform ${
                    orderedTemplate?.["Session B"]?.isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* Session B Content */}
              {orderedTemplate?.["Session B"]?.isOpen && (
                <div className="px-4 pb-4">
                  {/* Session Exercise Headers */}
                  <div className="grid grid-cols-12 text-sm text-gray-400 mb-2">
                    <div className="col-span-6">Exercises</div>
                    <div className="col-span-2 text-center">Sets</div>
                    <div className="col-span-2 text-center">Reps</div>
                    <div className="col-span-2"></div>
                  </div>

                  {/* Session Exercises List */}
                  <div className="space-y-2">
                    {orderedTemplate["Session B"].exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-[#0E1F34] rounded-md p-3 grid grid-cols-12 items-center"
                      >
                        <div className="col-span-6 flex items-center">
                          <span className="bg-[#1E2E47] text-white text-xs rounded px-1.5 py-0.5 mr-2">
                            {index + 1}
                          </span>
                          <span className="truncate">{exercise.name}</span>
                        </div>
                        <div className="col-span-2 text-center">{exercise.Sets}</div>
                        <div className="col-span-2 text-center">{exercise.Reps}</div>
                        <div className="col-span-2 flex justify-end space-x-2">
                          {exercise.Link && (
                            <a
                              href={exercise.Link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => handleValueChange("Session B", index, "Link", "")}
                            className="text-gray-400 hover:text-white"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Exercise Button */}
                  <button
                    onClick={() => addExercise("Session B")}
                    className="w-full mt-3 py-2 text-sm text-gray-300 hover:text-white border border-dashed border-[#22364F] rounded-md flex items-center justify-center"
                  >
                    <span>+ Add Exercise</span>
                  </button>
                </div>
              )}
            </div>

            {/* Session C */}
            <div className="bg-[#142437] border border-[#22364F] rounded-lg overflow-hidden">
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => {
                  // Toggle Session C visibility
                  setOrderedTemplate((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      "Session C": {
                        ...prev["Session C"],
                        isOpen: !prev["Session C"].isOpen,
                      },
                    };
                  });
                }}
              >
                <h3 className="font-medium">Session C</h3>
                <svg
                  className={`w-5 h-5 transform ${
                    orderedTemplate?.["Session C"]?.isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {/* Session C Content */}
              {orderedTemplate?.["Session C"]?.isOpen && (
                <div className="px-4 pb-4">
                  {/* Session Exercise Headers */}
                  <div className="grid grid-cols-12 text-sm text-gray-400 mb-2">
                    <div className="col-span-6">Exercises</div>
                    <div className="col-span-2 text-center">Sets</div>
                    <div className="col-span-2 text-center">Reps</div>
                    <div className="col-span-2"></div>
                  </div>

                  {/* Session Exercises List */}
                  <div className="space-y-2">
                    {orderedTemplate["Session C"].exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-[#0E1F34] rounded-md p-3 grid grid-cols-12 items-center"
                      >
                        <div className="col-span-6 flex items-center">
                          <span className="bg-[#1E2E47] text-white text-xs rounded px-1.5 py-0.5 mr-2">
                            {index + 1}
                          </span>
                          <span className="truncate">{exercise.name}</span>
                        </div>
                        <div className="col-span-2 text-center">{exercise.Sets}</div>
                        <div className="col-span-2 text-center">{exercise.Reps}</div>
                        <div className="col-span-2 flex justify-end space-x-2">
                          {exercise.Link && (
                            <a
                              href={exercise.Link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => handleValueChange("Session C", index, "Link", "")}
                            className="text-gray-400 hover:text-white"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Exercise Button */}
                  <button
                    onClick={() => addExercise("Session C")}
                    className="w-full mt-3 py-2 text-sm text-gray-300 hover:text-white border border-dashed border-[#22364F] rounded-md flex items-center justify-center"
                  >
                    <span>+ Add Exercise</span>
                  </button>
                </div>
              )}
            </div>
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

      {/* Warm Up Edit Modal */}
      {showWarmUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay with improved blur effect */}
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/30"
            onClick={toggleWarmUpModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Warm Up Exercises
              </h2>
              <button
                onClick={toggleWarmUpModal}
                className="text-gray-500 hover:text-gray-700"
              >
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

            <div className="max-h-[70vh] overflow-y-auto p-1">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 items-center pb-2 border-b">
                  <div className="col-span-4 text-gray-700 font-medium">
                    Exercise Name
                  </div>
                  <div className="col-span-1 text-gray-700 font-medium text-center">
                    Sets
                  </div>
                  <div className="col-span-2 text-gray-700 font-medium">
                    Reps
                  </div>
                  <div className="col-span-4 text-gray-700 font-medium">
                    Video Link
                  </div>
                  <div className="col-span-1 text-gray-700 font-medium text-center">
                    Action
                  </div>
                </div>

                {warmUpExercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center py-3 border-b border-gray-100"
                  >
                    <div className="col-span-4">
                      <select
                        value={exercise.name}
                        onChange={(e) =>
                          handleWarmUpChange(index, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#333333] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Exercise</option>
                        {warmUpOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input
                        type="text"
                        value={exercise.sets}
                        onChange={(e) =>
                          handleWarmUpChange(index, "sets", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-center text-[#333333] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Sets"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) =>
                          handleWarmUpChange(index, "reps", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#333333] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Reps"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={exercise.link || ""}
                        onChange={(e) =>
                          handleWarmUpChange(index, "link", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#333333] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://www.youtube.com"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => deleteWarmUpExercise(index)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Button */}
              <div className="mt-5">
                <button
                  onClick={addWarmUpExercise}
                  className="w-full py-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Warm-up Exercise
                </button>
              </div>
            </div>

            {/* Footer with Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={toggleWarmUpModal}
                className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors mr-3"
              >
                Cancel
              </button>
              <button
                onClick={toggleWarmUpModal}
                className="px-6 py-2 rounded-lg bg-[#0a1c3f] hover:bg-[#0b2552] text-white font-medium text-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
