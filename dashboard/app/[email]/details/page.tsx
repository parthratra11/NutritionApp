"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navigation from "@/components/shared/Navigation";
import Image from "next/image";

interface IntakeForm {
  fullName: string;
  email: string;
  phoneNumber: string;
  userId: string;
  createdAt: string;

  // Address fields
  houseNumber: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  addressUpdatedAt: {
    toDate: () => Date;
  };

  // Personal metrics
  age: string;
  height: string;
  weight: string;
  bodyFat: string;
  measurementSystem: string;
  weightHeightCompleted: boolean;

  // Body photos
  bodyPhotoUrls: string[];

  // Genetic data
  genetics: {
    wristCircumference: string;
    ankleCircumference: string;
  };
  geneticsCompleted: boolean;

  // Training experience
  strengthTrainingExperience: string;
  strengthCompetency: string;
  strengthCompetencyValue: number;
  strengthCompetencyComments: string;
  strengthChoiceCompleted: boolean;

  // Strength metrics
  benchPressWeight: string;
  benchPressReps: string;
  squatWeight: string;
  squatReps: string;
  chinUpWeight: string;
  chinUpReps: string;
  deadliftWeight: string;
  deadliftReps: string;
  overheadPressWeight: string;
  overheadPressReps: string;
  strength1Completed: boolean;
  strength2Completed: boolean;

  // Training preferences
  goal1: string;
  goal2: string;
  goal3: string;
  goalsCompleted: boolean;
  obstacle: string;
  otherExercises: string;
  otherExerciseCompleted: boolean;
  dedicationLevel: string;
  dedicationLevelCompleted: boolean;
  weeklyFrequency: string;
  trainingFrequencyCompleted: boolean;
  trainingProgram: string;
  currentProgramCompleted: boolean;

  // Lifestyle and health
  occupation: string;
  occupationCompleted: boolean;
  medicalConditions: string;
  diet: string;
  dietDescription: string;
  trainingTimePreference: string;
  trainingTimeCompleted: boolean;
  activityLevel: string;
  activityLevelCompleted: boolean;
  stressLevel: string;
  stressLevelCompleted: boolean;
  caffeine: string;
  caffeineCompleted: boolean;
  menstrualInfo: string;

  // Equipment
  hasMeasuringTape: boolean;
  skinfoldCalipers: string;
  gymEquipment: string[];
  cardioEquipment: string[];
  dumbbellInfo: {
    isFullSet: boolean;
    minWeight: string;
    maxWeight: string;
  };
  additionalEquipmentInfo: string;
  legCurlType: string;
  equipment1Completed: boolean;
  equipment2Completed: boolean;
  equipment3Completed: boolean;
  equipment4Completed: boolean;

  // Additional information
  supplements: string;
  supplementsCompleted: boolean;
  fitnessTech: string;

  // System fields
  intakeFormCompleted: boolean;
  isSignupOnly: boolean;
  lastUpdated: {
    toDate: () => Date;
  };
  timestamp: {
    toDate: () => Date;
  };
}

// Helper function to format equipment names
const formatEquipment = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function UserDetails() {
  const params = useParams();
  const [form, setForm] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);
        const docRef = doc(db, "intakeForms", decodedEmail);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setForm({ ...docSnap.data(), id: docSnap.id } as IntakeForm);
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError("Failed to fetch user details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [params?.email]);

  if (loading)
    return <div className="p-6 text-white bg-[#07172C]">Loading...</div>;
  if (error)
    return <div className="p-6 text-red-500 bg-[#07172C]">{error}</div>;
  if (!form)
    return <div className="p-6 text-white bg-[#07172C]">No data found</div>;

  // Format date function
  const formatDate = (dateObj: { toDate: () => Date } | undefined) => {
    if (!dateObj) return "N/A";
    try {
      const date = dateObj.toDate();
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Photo gallery modal
  const PhotoModal = ({ url, onClose }: { url: string; onClose: () => void }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
        <div className="max-w-4xl max-h-[90vh] relative">
          <button
            className="absolute top-4 right-4 text-white bg-red-600 rounded-full p-1 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="rounded-lg overflow-hidden bg-[#07172C] p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Body photo"
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      <Navigation
        title={`${form?.fullName || "Client"}'s Details`}
        subtitle="Client Information"
        email={params.email as string}
        userName={form?.fullName || "User"}
      />

      {/* Show selected photo modal if a photo is selected */}
      {selectedPhoto && (
        <PhotoModal url={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Account Status */}
        <div className="bg-[#142437] rounded-lg shadow-sm p-6 mb-6 border border-[#22364F]">
          <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
            Account Status
          </h2>
          <div className="grid grid-row-1 md:grid-row-2 gap-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Signup Status</span>
              <span
                className={`font-medium ${
                  form?.intakeFormCompleted
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {form?.intakeFormCompleted ? "Completed" : "Incomplete"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Updated</span>
              <span className="font-medium text-white">
                {formatDate(form?.lastUpdated)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Basic Information
            </h2>
            <div className="space-y-4">
              {(
                [
                  { label: "Name", value: form?.fullName },
                  { label: "Email", value: form?.email },
                  { label: "Phone", value: form?.phoneNumber },
                  { label: "Age", value: form?.age },
                  { label: "Height", value: form?.height },
                  { label: "Weight", value: form?.weight },
                  { label: "Body Fat", value: form?.bodyFat },
                  { label: "System", value: form?.measurementSystem },
                  { label: "Occupation", value: form?.occupation },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-white">
                    {item.value || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical & Lifestyle */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Medical & Lifestyle
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Medical Conditions",
                    value: form?.medicalConditions,
                  },
                  { label: "Diet Type", value: form?.diet },
                  { label: "Diet Details", value: form?.dietDescription },
                  { label: "Sleep Quality", value: form?.stressLevel },
                  { label: "Activity Level", value: form?.activityLevel },
                  { label: "Caffeine Intake", value: form?.caffeine },
                  {
                    label: "Training Time",
                    value: form?.trainingTimePreference,
                  },
                  { label: "Menstrual Info", value: form?.menstrualInfo },
                ] as const
              ).map((item) => (
                <div key={item.label} className="space-y-1">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <p className="font-medium text-white">
                    {item.value || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Location Details
            </h2>
            <div className="space-y-4">
              {(
                [
                  { label: "House Number", value: form?.houseNumber },
                  { label: "Street", value: form?.street },
                  { label: "City", value: form?.city },
                  { label: "Postal Code", value: form?.postalCode },
                  { label: "Country", value: form?.country },
                  {
                    label: "Address Updated",
                    value: formatDate(form?.addressUpdatedAt),
                  },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-white">
                    {item.value || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Training Profile */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Training Profile
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Experience",
                    value: form?.strengthTrainingExperience,
                  },
                  { label: "Competency", value: form?.strengthCompetency },
                  {
                    label: "Competency Level",
                    value: form?.strengthCompetencyValue
                      ? `${Math.round(form.strengthCompetencyValue * 100)}%`
                      : "N/A",
                  },
                  { label: "Weekly Frequency", value: form?.weeklyFrequency },
                  { label: "Dedication Level", value: form?.dedicationLevel },
                  { label: "Current Program", value: form?.trainingProgram },
                ] as const
              ).map((item) => (
                <div key={item.label} className="space-y-1">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <p className="font-medium text-white">
                    {item.value || "N/A"}
                  </p>
                </div>
              ))}

              {form?.strengthCompetencyComments && (
                <div className="space-y-1 mt-2">
                  <span className="text-gray-400 text-sm">
                    Additional Comments
                  </span>
                  <p className="font-medium text-white">
                    {form.strengthCompetencyComments}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Strength Metrics */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Strength Metrics
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Bench Press",
                    value:
                      form?.benchPressWeight && form?.benchPressReps
                        ? `${form.benchPressWeight}kg × ${form.benchPressReps} reps`
                        : "N/A",
                  },
                  {
                    label: "Squat",
                    value:
                      form?.squatWeight && form?.squatReps
                        ? `${form.squatWeight}kg × ${form.squatReps} reps`
                        : "N/A",
                  },
                  {
                    label: "Chin-up",
                    value:
                      form?.chinUpWeight && form?.chinUpReps
                        ? `${form.chinUpWeight}kg × ${form.chinUpReps} reps`
                        : "N/A",
                  },
                  {
                    label: "Deadlift",
                    value:
                      form?.deadliftWeight && form?.deadliftReps
                        ? `${form.deadliftWeight}kg × ${form.deadliftReps} reps`
                        : "N/A",
                  },
                  {
                    label: "Overhead Press",
                    value:
                      form?.overheadPressWeight && form?.overheadPressReps
                        ? `${form.overheadPressWeight}kg × ${form.overheadPressReps} reps`
                        : "N/A",
                  },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Body Measurements */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Body Measurements
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Wrist Circumference",
                    value: form?.genetics?.wristCircumference,
                  },
                  {
                    label: "Ankle Circumference",
                    value: form?.genetics?.ankleCircumference,
                  },
                  {
                    label: "Measuring Tools",
                    value: form?.hasMeasuringTape
                      ? "Has measuring tape"
                      : "No measuring tape",
                  },
                  {
                    label: "Skinfold Calipers",
                    value: form?.skinfoldCalipers,
                  },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="font-medium text-white">
                    {item.value || "N/A"}
                  </span>
                </div>
              ))}

              {form?.bodyPhotoUrls && form.bodyPhotoUrls.length > 0 && (
                <div className="space-y-1 mt-2">
                  <span className="text-gray-400 text-sm">Body Photos</span>
                  <p className="font-medium text-white">
                    {form.bodyPhotoUrls.length} photo(s) uploaded
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Body Photos Section - Add this section before Equipment Access */}
          {form?.bodyPhotoUrls && form.bodyPhotoUrls.length > 0 && (
            <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F] col-span-full">
              <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
                Body Photos ({form.bodyPhotoUrls.length})
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {form.bodyPhotoUrls.map((photoUrl, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-[3/4] bg-[#0A1B30] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedPhoto(photoUrl)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={photoUrl} 
                      alt={`Body photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2">
                      Photo {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Access */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 border border-[#22364F] col-span-full">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Equipment Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gym Equipment */}
              <div>
                <h3 className="text-md font-medium mb-3 text-blue-300">
                  Gym Equipment
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {form?.gymEquipment?.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-300">
                        {formatEquipment(item)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cardio Equipment */}
              <div>
                <h3 className="text-md font-medium mb-3 text-blue-300">
                  Cardio Equipment
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {form?.cardioEquipment?.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-300">
                        {formatEquipment(item)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dumbbell Information */}
              <div className="col-span-full mt-4">
                <h3 className="text-md font-medium mb-3 text-blue-300">
                  Dumbbell Set
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Full Set:</span>
                    <span className="text-white">
                      {form?.dumbbellInfo?.isFullSet ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Min Weight:</span>
                    <span className="text-white">
                      {form?.dumbbellInfo?.minWeight || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Max Weight:</span>
                    <span className="text-white">
                      {form?.dumbbellInfo?.maxWeight || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Equipment Info */}
              {form?.additionalEquipmentInfo && (
                <div className="col-span-full mt-4">
                  <h3 className="text-md font-medium mb-2 text-blue-300">
                    Additional Equipment Info
                  </h3>
                  <p className="text-white">{form.additionalEquipmentInfo}</p>
                </div>
              )}

              {/* Leg Curl Type */}
              {form?.legCurlType && (
                <div className="col-span-full mt-4">
                  <h3 className="text-md font-medium mb-2 text-blue-300">
                    Leg Curl Type
                  </h3>
                  <p className="text-white">{form.legCurlType}</p>
                </div>
              )}

              {/* Fitness Technology */}
              {form?.fitnessTech && (
                <div className="col-span-full mt-4">
                  <h3 className="text-md font-medium mb-2 text-blue-300">
                    Fitness Technology
                  </h3>
                  <p className="text-white">{form.fitnessTech}</p>
                </div>
              )}
            </div>
          </div>

          {/* Goals and Obstacles */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 col-span-full border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Goals & Obstacles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400">Primary Goal</span>
                  <p className="font-medium text-white mt-1">
                    {form?.goal1 || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Secondary Goal</span>
                  <p className="font-medium text-white mt-1">
                    {form?.goal2 || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Tertiary Goal</span>
                  <p className="font-medium text-white mt-1">
                    {form?.goal3 || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400">Main Obstacle</span>
                  <p className="font-medium text-white mt-1">
                    {form?.obstacle || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Other Exercises</span>
                  <p className="font-medium text-white mt-1">
                    {form?.otherExercises || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-[#142437] rounded-lg shadow-sm p-6 col-span-full border border-[#22364F]">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#22364F] pb-2">
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-gray-400">Supplements</span>
                <p className="font-medium text-white mt-1">
                  {form?.supplements || "N/A"}
                </p>
              </div>
              <div className="mt-4">
                <span className="text-gray-400">Account Created</span>
                <p className="font-medium text-white mt-1">
                  {formatDate(form?.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
