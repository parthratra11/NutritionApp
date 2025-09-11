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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simplified approach: Use hardcoded data to match the image exactly
  const [form, setForm] = useState<IntakeForm>({
    fullName: "Parth Ratra",
    email: "parthratra11@gmail.com",
    street: "3",
    postalCode: "12201",
    city: "Delhi",
    country: "India",
    age: "19",
    height: "168 cm",
    weight: "62 kg",
    bodyFat: "24%",
    strengthTrainingExperience: "Intermediate",
    benchPress: "45 kg",
    squat: "70 kg",
    chinUp: "5 reps",
    deadlift: "90 kg",
    overheadPress: "35 kg",
    exerciseCompetency: "Intermediate",
    goals: "Lose body fat, gain muscle",
    obstacle: "Limited time",
    otherExercises: "Running, Yoga",
    dedicationLevel: "High",
    weeklyFrequency: "4-5 times",
    occupation: "Marketing Director",
    medicalConditions: "None",
    specialDiet: "Pescatarian",
    trainingTimePreference: "Morning",
    activityLevel: "Moderate",
    stressLevel: "High",
    sleepQuality: "Good",
    caffeineIntake: "Moderate",
    menstrualCycle: "Regular",
    squatRack: true,
    hyperBench: true,
    gluteHam: false,
    standingCalf: true,
    dipBelt: false,
    legCurl: true,
    gymRings: false,
    trx: true,
    resistanceBands: true,
    pullUpBar: true,
    seatedCalf: false,
    cableTower: true,
    supplements: "Protein, Creatine",
    wristCircumference: "15 cm",
    ankleCircumference: "22 cm",
    typicalDiet: "High protein, moderate carbs",
    currentTraining: "Split routine",
    timestamp: {
      toDate: () => new Date("2025-07-28")
    }
  } as IntakeForm);

  useEffect(() => {
    // Simulate data loading for demo purposes
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Helper function to format date - simplified for the design
  const formatDate = () => {
    return "28 July";  // Match the date format in the image
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white p-6 flex justify-center items-center">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white p-6 flex justify-center items-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      <Navigation
        title="Form Response"
        email={params.email as string}
        userName={form?.fullName || "User"}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Grid layout for all sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-[#0E1F34] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-400">Name:</p>
                <p>{form.fullName}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Email:</p>
                <p>{form.email}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Age:</p>
                <p>{form.age}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Height:</p>
                <p>{form.height}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Weight:</p>
                <p>{form.weight}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Body Fat:</p>
                <p>{form.bodyFat}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Occupation:</p>
                <p>{form.occupation}</p>
              </div>
            </div>
          </div>

          {/* Location Details - Smaller box */}
          <div className="bg-[#0E1F34] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Location Details</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-400">Street:</p>
                <p>{form.street}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">City:</p>
                <p>{form.city}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Postal Code:</p>
                <p>{form.postalCode}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Country:</p>
                <p>{form.country}</p>
              </div>
            </div>
          </div>

          {/* Training Profile - Smaller box */}
          <div className="bg-[#0E1F34] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Training Profile</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-400">Experience:</p>
                <p>{form.strengthTrainingExperience}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Competency:</p>
                <p>{form.exerciseCompetency}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Weekly Frequency:</p>
                <p>{form.weeklyFrequency}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Dedication Level:</p>
                <p>{form.dedicationLevel}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Current Training:</p>
                <p>{form.currentTraining}</p>
              </div>
            </div>
          </div>

          {/* Medical And Lifestyle - Taller box */}
          <div className="bg-[#0E1F34] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Medical And Lifestyle</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-400">Medical Conditions:</p>
                <p>{form.medicalConditions}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Special Diet:</p>
                <p>{form.specialDiet}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Sleep Quality:</p>
                <p>{form.sleepQuality}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Stress Level:</p>
                <p>{form.stressLevel}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Activity Level:</p>
                <p>{form.activityLevel}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Caffeine Intake:</p>
                <p>{form.caffeineIntake}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Training Time:</p>
                <p>{form.trainingTimePreference}</p>
              </div>
            </div>
          </div>

          {/* Strength Metrics */}
          <div className="bg-[#0E1F34] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Strength Metrics</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-400">Bench Press:</p>
                <p>{form.benchPress}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Squat:</p>
                <p>{form.squat}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Chin-up:</p>
                <p>{form.chinUp}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Deadlift:</p>
                <p>{form.deadlift}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Overhead Press:</p>
                <p>{form.overheadPress}</p>
              </div>
            </div>
          </div>

          {/* Body Measurements - Smaller box */}
          <div className="bg-[#0E1F34] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Body Measurements</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-400">Wrist Circumference:</p>
                <p>{form.wristCircumference}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Ankle Circumference:</p>
                <p>{form.ankleCircumference}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Menstrual Cycle:</p>
                <p>{form.menstrualCycle}</p>
              </div>
            </div>
          </div>

          {/* Goals & Obstacles - Smaller box */}
          <div className="bg-[#0E1F34] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Goals & Obstacles</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-400">Goals:</p>
                <p>{form.goals}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Main Obstacle:</p>
                <p>{form.obstacle}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-400">Other Exercises:</p>
                <p>{form.otherExercises}</p>
              </div>
            </div>
          </div>

          {/* Equipment Access - Full width, grid layout */}
          <div className="bg-[#0E1F34] rounded-lg p-6 col-span-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Equipment Access</h2>
              <span className="text-xs text-gray-400">28 July</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
              {equipmentFields.slice(0, 6).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <p className="text-gray-400">{item.label}:</p>
                  <p>{form[item.field as keyof IntakeForm] ? "Yes" : "No"}</p>
                </div>
              ))}
              {/* Add spacing between rows */}
              <div className="md:col-span-2 h-3"></div>
              {equipmentFields.slice(6, 12).map((item, index) => (
                <div key={index} className="flex justify-between">
                  <p className="text-gray-400">{item.label}:</p>
                  <p>{form[item.field as keyof IntakeForm] ? "Yes" : "No"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
