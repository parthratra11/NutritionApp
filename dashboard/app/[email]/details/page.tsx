"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navigation from "@/components/shared/Navigation";

interface IntakeForm {
  fullName: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  age: string;
  height: string;
  weight: string;
  bodyFat: string;
  strengthTrainingExperience: string;
  benchPress: string;
  squat: string;
  chinUp: string;
  deadlift: string;
  overheadPress: string;
  exerciseCompetency: string;
  goals: string;
  obstacle: string;
  otherExercises: string;
  dedicationLevel: string;
  weeklyFrequency: string;
  occupation: string;
  medicalConditions: string;
  specialDiet: string;
  trainingTimePreference: string;
  activityLevel: string;
  stressLevel: string;
  sleepQuality: string;
  caffeineIntake: string;
  menstrualCycle: string;
  squatRack: boolean;
  hyperBench: boolean;
  gluteHam: boolean;
  standingCalf: boolean;
  dipBelt: boolean;
  legCurl: boolean;
  gymRings: boolean;
  trx: boolean;
  resistanceBands: boolean;
  pullUpBar: boolean;
  seatedCalf: boolean;
  cableTower: boolean;
  supplements: string;
  wristCircumference: string;
  ankleCircumference: string;
  typicalDiet: string;
  currentTraining: string;
  timestamp: {
    toDate: () => Date;
  };
}

const equipmentFields = [
  { field: "squatRack", label: "Squat cage or rack" },
  { field: "hyperBench", label: "45° hyperextension bench" },
  { field: "gluteHam", label: "Glute-ham raise" },
  { field: "standingCalf", label: "Standing calf raise machine" },
  { field: "dipBelt", label: "Dip/chin-up belt" },
  { field: "legCurl", label: "Leg curl machine" },
  { field: "gymRings", label: "Gymnastic rings" },
  { field: "trx", label: "TRX" },
  { field: "resistanceBands", label: "Resistance bands" },
  { field: "pullUpBar", label: "Pull-up bar" },
  { field: "seatedCalf", label: "Seated calf raise machine" },
  { field: "cableTower", label: "Cable tower" },
];

export default function UserDetails() {
  const params = useParams();
  const [form, setForm] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [params?.id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!form) return <div className="p-6">No data found</div>;

  const renderSection = (
    title: string,
    fields: { label: string; value: string | boolean | undefined }[]
  ) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid gap-4">
        {fields.map(
          ({ label, value }) =>
            value !== undefined && (
              <div key={label} className="bg-white p-4 rounded-lg shadow">
                <p className="font-medium text-gray-700">{label}</p>
                <p className="text-gray-600">
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
                </p>
              </div>
            )
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        title={`${form?.fullName || "Client"}'s Details`}
        subtitle="Client Information"
        email={params.email as string}
        userName={form?.fullName || "User"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Client Profile
              </h1>
              <p className="text-gray-600">
                Form submitted: {form?.timestamp?.toDate().toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/${params.email}`}
              className="text-[#0a1c3f] hover:text-[#0b2552] font-medium"
            >
              Back to Overview
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Basic Information
            </h2>
            <div className="space-y-4">
              {(
                [
                  { label: "Name", value: form?.fullName },
                  { label: "Email", value: form?.email },
                  { label: "Age", value: form?.age },
                  { label: "Height", value: form?.height },
                  { label: "Weight", value: form?.weight },
                  { label: "Body Fat", value: form?.bodyFat },
                  { label: "Occupation", value: form?.occupation },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical & Lifestyle */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Medical & Lifestyle
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Medical Conditions",
                    value: form?.medicalConditions,
                  },
                  { label: "Special Diet", value: form?.specialDiet },
                  { label: "Sleep Quality", value: form?.sleepQuality },
                  { label: "Stress Level", value: form?.stressLevel },
                  { label: "Activity Level", value: form?.activityLevel },
                  { label: "Caffeine Intake", value: form?.caffeineIntake },
                  {
                    label: "Training Time",
                    value: form?.trainingTimePreference,
                  },
                ] as const
              ).map((item) => (
                <div key={item.label} className="space-y-1">
                  <span className="text-gray-500 text-sm">{item.label}</span>
                  <p className="font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Location Details
            </h2>
            <div className="space-y-4">
              {(
                [
                  { label: "Street", value: form?.street },
                  { label: "City", value: form?.city },
                  { label: "Postal Code", value: form?.postalCode },
                  { label: "Country", value: form?.country },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Training Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Training Profile
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Experience",
                    value: form?.strengthTrainingExperience,
                  },
                  { label: "Competency", value: form?.exerciseCompetency },
                  { label: "Weekly Frequency", value: form?.weeklyFrequency },
                  { label: "Dedication Level", value: form?.dedicationLevel },
                  { label: "Current Training", value: form?.currentTraining },
                ] as const
              ).map((item) => (
                <div key={item.label} className="space-y-1">
                  <span className="text-gray-500 text-sm">{item.label}</span>
                  <p className="font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strength Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Strength Metrics
            </h2>
            <div className="space-y-4">
              {(
                [
                  { label: "Bench Press", value: form?.benchPress },
                  { label: "Squat", value: form?.squat },
                  { label: "Chin-up", value: form?.chinUp },
                  { label: "Deadlift", value: form?.deadlift },
                  { label: "Overhead Press", value: form?.overheadPress },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Body Measurements */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Body Measurements
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Wrist Circumference",
                    value: form?.wristCircumference,
                  },
                  {
                    label: "Ankle Circumference",
                    value: form?.ankleCircumference,
                  },
                  { label: "Menstrual Cycle", value: form?.menstrualCycle },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Access */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Equipment Access
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {equipmentFields.map(({ field, label }) => (
                <div key={field} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      form?.[field as keyof IntakeForm]
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals and Obstacles */}
          <div className="bg-white rounded-lg shadow-sm p-6 col-span-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Goals & Obstacles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-gray-500">Goals</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {form?.goals}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Main Obstacle</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {form?.obstacle}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Other Exercises</span>
                <p className="font-medium text-gray-900 mt-1">
                  {form?.otherExercises}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 col-span-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-gray-500">Supplements</span>
                <p className="font-medium text-gray-900 mt-1">
                  {form?.supplements}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Typical Diet</span>
                <p className="font-medium text-gray-900 mt-1">
                  {form?.typicalDiet}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
