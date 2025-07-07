"use client";

import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "@firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface IntakeForm {
  id: string;
  fullName: string;
  email: string;
  timestamp: {
    toDate: () => Date;
  };
}

export default function Home() {
  const router = useRouter();
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const fetchIntakeForms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "intakeForms"));
        const forms = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as IntakeForm[];
        setIntakeForms(forms);
      } catch (err) {
        setError("Failed to fetch intake forms");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntakeForms();
  }, []);

  // Create date strip for current week
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

  // Sort intake forms based on selected option
  const sortedIntakeForms = [...intakeForms].sort((a, b) => {
    if (sortBy === "name") {
      return a.fullName.localeCompare(b.fullName);
    } else {
      // Add null checks for timestamp
      const dateA = a.timestamp?.toDate?.()
        ? a.timestamp.toDate().getTime()
        : 0;
      const dateB = b.timestamp?.toDate?.()
        ? b.timestamp.toDate().getTime()
        : 0;
      return dateB - dateA;
    }
  });

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar with greeting and date strip side by side */}
      <div className="bg-[#0a1c3f] text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button className="mr-3">
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="mr-3">
              <p className="font-medium">Hi, Cymron</p>
              <p className="text-xs opacity-80">See their progress!</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden">
              {/* Placeholder for coach's profile image */}
              <div className="h-full w-full bg-gray-400"></div>
            </div>
          </div>

          {/* Date Strip - on right side of navbar */}
          <div className="flex space-x-4">
            {dateStrip.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className="text-xs text-gray-300">{item.day}</span>
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    item.isToday ? "bg-red-500 text-white" : "text-white"
                  }`}
                >
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex justify-end px-6 py-2 relative">
        <button
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          className="flex items-center text-sm text-gray-700 hover:text-gray-900"
        >
          Sort By <span className="ml-1">▼</span>
        </button>

        {showSortDropdown && (
          <div className="absolute top-full right-6 mt-1 bg-white shadow-md rounded p-2 border z-10">
            <button
              onClick={() => {
                setSortBy("name");
                setShowSortDropdown(false);
              }}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              Alphabetically
            </button>
            <button
              onClick={() => {
                setSortBy("date");
                setShowSortDropdown(false);
              }}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              Join Date
            </button>
            <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
              Active / Inactive
            </button>
          </div>
        )}
      </div>

      {/* Client Cards */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedIntakeForms.map((form) => (
            <div
              key={form.email}
              className="bg-[#0a1c3f] text-white rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer flex items-center"
              onClick={() => router.push(`/${encodeURIComponent(form.email)}`)}
            >
              <div className="h-12 w-12 rounded-full bg-gray-300 mr-3 overflow-hidden flex-shrink-0">
                {/* Placeholder for client profile image */}
                <div className="h-full w-full bg-gray-400"></div>
              </div>
              <div className="overflow-hidden">
                <h2 className="font-semibold text-white">{form.fullName}</h2>
                <p className="text-xs text-gray-300 truncate">{form.email}</p>
                <p className="text-xs text-gray-300">
                  Submitted:{" "}
                  {form.timestamp?.toDate
                    ? form.timestamp.toDate().toLocaleDateString()
                    : "No date"}
                </p>
              </div>
            </div>
          ))}
          {sortedIntakeForms.length === 0 && (
            <p className="text-gray-500 col-span-full">
              No intake forms found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
