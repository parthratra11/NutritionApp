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
  const [editingWarmUp, setEditingWarmUp] = useState(false);
  const [editingSteps, setEditingSteps] = useState(false);
  const [showWarmUpModal, setShowWarmUpModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [clientName, setClientName] = useState<string>("");

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
  const convertToOrderedTemplate = (
    templateData: WorkoutTemplate
  ): OrderedTemplate => {
    const ordered: OrderedTemplate = {
      "Session A": { exercises: [] },
      "Session B": { exercises: [] },
      "Session C": { exercises: [] },
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!orderedTemplate)
    return <div className="p-6">No template data found</div>;

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
          <Link
            href={`/${params.email}/workout/add`}
            className="px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
          >
            Add/Delete Exercise
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Warm Up & Steps */}
          <div className="lg:col-span-1 space-y-6">
            {/* Warm Up Card */}
            <div className="bg-[#F5F5F5] rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[#1A1A1A] text-lg font-semibold">
                  Warm Up
                </h2>
                <button
                  onClick={toggleWarmUpModal}
                  className="text-blue-600 text-sm flex items-center"
                >
                  Edit
                  <svg
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600 text-sm">
                    <th className="pb-3 font-medium">Exercise</th>
                    <th className="pb-3 font-medium text-center w-12">Sets</th>
                    <th className="pb-3 font-medium text-center w-20">Reps</th>
                    <th className="pb-3 font-medium text-center w-16">Link</th>
                  </tr>
                </thead>
                <tbody className="text-[#333333] text-sm">
                  {warmUpExercises.map((exercise, index) => (
                    <tr key={index} className="h-10">
                      <td className="py-2">{exercise.name}</td>
                      <td className="py-2 text-center">{exercise.sets}</td>
                      <td className="py-2 text-center">{exercise.reps}</td>
                      <td className="py-2 text-center">
                        {exercise.link ? (
                          <a
                            href={exercise.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600"
                            title="Video Link"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mx-auto"
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
                          </a>
                        ) : (
                          <span className="text-red-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mx-auto"
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
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Steps Goal Card */}
            <div className="bg-[#F5F5F5] rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[#1A1A1A] text-lg font-semibold">
                  Daily Steps Target
                </h2>
                <button
                  onClick={() => setEditingSteps(!editingSteps)}
                  className="text-blue-600 text-sm flex items-center"
                >
                  {editingSteps ? "Done" : "Edit"}
                  {!editingSteps && (
                    <svg
                      className="h-4 w-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {editingSteps ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg">
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-600 mb-1">
                        Steps Target
                      </label>
                      <input
                        type="text"
                        value={dailySteps.target}
                        onChange={(e) =>
                          setDailySteps({
                            ...dailySteps,
                            target: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                        placeholder="10,000"
                      />
                    </div>
                    <div className="col-span-8">
                      <label className="block text-xs text-gray-600 mb-1">
                        Walk Duration
                      </label>
                      <input
                        type="text"
                        value={dailySteps.walkDuration}
                        onChange={(e) =>
                          setDailySteps({
                            ...dailySteps,
                            walkDuration: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                        placeholder="30 minute"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-[#333333] text-sm">
                  <p>
                    Today you will aim to get{" "}
                    <span className="font-bold">{dailySteps.target}</span>{" "}
                    steps.
                  </p>
                  <p>
                    A{" "}
                    <span className="font-bold">{dailySteps.walkDuration}</span>{" "}
                    morning walk is a great way to kick this off.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Workout Sessions */}
          <div className="lg:col-span-2 space-y-2 mb-6">
            {Object.entries(orderedTemplate).map(([sessionName, session]) => (
              <div key={sessionName}>
                <h3 className="text-[#333333] font-semibold mb-2 text-right">
                  {sessionName}
                </h3>
                <div className="bg-[#F5F5F5] rounded-xl shadow-sm p-2">
                  <div className="space-y-0">
                    {session.exercises.map((exercise, index) => (
                      <div
                        key={`${sessionName}-${exercise.name}-${index}`}
                        className="grid grid-cols-15 gap-2 items-center py-1"
                      >
                        <div className="col-span-5">
                          <select
                            className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                            value={exercise.name}
                            onChange={(e) =>
                              handleExerciseChange(
                                sessionName,
                                index,
                                e.target.value
                              )
                            }
                          >
                            {workoutOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={exercise.Sets}
                            onChange={(e) =>
                              handleValueChange(
                                sessionName,
                                index,
                                "Sets",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-center text-[#333333] focus:ring-2 focus:ring-red-500"
                            placeholder="Sets"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={exercise.Reps}
                            onChange={(e) =>
                              handleValueChange(
                                sessionName,
                                index,
                                "Reps",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                            placeholder="Reps"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={exercise.Weight || ""}
                            onChange={(e) =>
                              handleValueChange(
                                sessionName,
                                index,
                                "Weight",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                            placeholder="kg"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={exercise.Link}
                            onChange={(e) =>
                              handleValueChange(
                                sessionName,
                                index,
                                "Link",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1 rounded-lg bg-white border-0 text-sm text-[#333333] focus:ring-2 focus:ring-red-500"
                            placeholder="https://www.youtube.com"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => deleteExercise(sessionName, index)}
                            className="w-full px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            title="Delete exercise"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mx-auto"
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

                    {/* Add new exercise button */}
                    <div className="py-2 mt-2 text-center">
                      <button
                        onClick={() => addExercise(sessionName)}
                        className="px-4 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium flex items-center mx-auto"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
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
                        Add Exercise
                      </button>
                    </div>
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
