"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  supplements: string;
  wristCircumference: string;
  ankleCircumference: string;
  typicalDiet: string;
  currentTraining: string;
  timestamp: {
    toDate: () => Date;
  };
}

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
    fields: { label: string; value: string | undefined }[]
  ) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid gap-4">
        {fields.map(
          ({ label, value }) =>
            value && (
              <div key={label} className="bg-white p-4 rounded-lg shadow">
                <p className="font-medium text-gray-700">{label}</p>
                <p className="text-gray-600">{value}</p>
              </div>
            )
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>

      {/* Personal Information */}
      {renderSection("Personal Information", [
        { label: "Name", value: form.fullName },
        { label: "Email", value: form.email },
        {
          label: "Address",
          value: `${form.street}, ${form.city}, ${form.postalCode}, ${form.country}`,
        },
        { label: "Age", value: form.age },
        { label: "Height", value: form.height },
        { label: "Weight", value: form.weight },
        { label: "Body Fat", value: form.bodyFat },
      ])}

      {/* Strength Metrics */}
      {renderSection("Strength Metrics", [
        { label: "Bench Press", value: form.benchPress },
        { label: "Squat", value: form.squat },
        { label: "Chin-up", value: form.chinUp },
        { label: "Deadlift", value: form.deadlift },
        { label: "Overhead Press", value: form.overheadPress },
        { label: "Exercise Competency", value: form.exerciseCompetency },
      ])}

      {/* Goals and Training */}
      {renderSection("Goals and Training", [
        { label: "Goals", value: form.goals },
        { label: "Main Obstacle", value: form.obstacle },
        { label: "Other Exercises", value: form.otherExercises },
        { label: "Dedication Level", value: form.dedicationLevel },
        { label: "Weekly Frequency", value: form.weeklyFrequency },
      ])}

      {/* Lifestyle */}
      {renderSection("Lifestyle", [
        { label: "Occupation", value: form.occupation },
        { label: "Medical Conditions", value: form.medicalConditions },
        { label: "Special Diet", value: form.specialDiet },
        {
          label: "Training Time Preference",
          value: form.trainingTimePreference,
        },
        { label: "Activity Level", value: form.activityLevel },
        { label: "Stress Level", value: form.stressLevel },
        { label: "Sleep Quality", value: form.sleepQuality },
        { label: "Caffeine Intake", value: form.caffeineIntake },
      ])}

      {/* Additional Information */}
      {renderSection("Additional Information", [
        { label: "Supplements", value: form.supplements },
        { label: "Wrist Circumference", value: form.wristCircumference },
        { label: "Ankle Circumference", value: form.ankleCircumference },
        { label: "Typical Diet", value: form.typicalDiet },
        { label: "Current Training", value: form.currentTraining },
      ])}

      <div className="mt-6 text-sm text-gray-500">
        Form submitted on: {form.timestamp?.toDate().toLocaleDateString()}
      </div>
    </div>
  );
}
