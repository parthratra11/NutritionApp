"use client";

import Navigation from "@/components/shared/Navigation";
import { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Keep your existing interfaces
interface SetData {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseData {
  name: string;
  sets: SetData[];
}

interface DayData {
  workoutName: string;
  workoutNote: string;
  startTime: string;
  endTime: string;
  exercises: ExerciseData[];
  timestamp: string;
  isRestDay?: boolean;
}

interface WeekData {
  [day: string]: DayData;
}

interface WorkoutData {
  firstEntryDate: string;
  [week: string]: WeekData | string;
}

export default function WorkoutDashboard() {
  const params = useParams();
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");

  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Sessions");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedSingleDate, setSelectedSingleDate] = useState<string>("");

  // New state variables for graph and workout details
  const [selectedWorkout, setSelectedWorkout] = useState<{
    date: string;
    session: string;
    duration: string;
    exercises?: Array<{
      name: string;
      sets: number;
      reps: number;
      weight: string;
    }>;
  } | null>(null);

  const [timeRange, setTimeRange] = useState<"Weekly" | "Monthly" | "Yearly">(
    "Monthly"
  );

  // Mock data for the workout history - replace with your actual data when available
  const workoutHistory = [
    {
      date: "07 July 2025",
      session: "Session A",
      duration: "88 min",
      completed: true,
    },
    {
      date: "08 July 2025",
      session: "Session B",
      duration: "84 min",
      completed: true,
    },
    {
      date: "09 July 2025",
      session: "Session C",
      duration: "84 min",
      completed: true,
    },
    {
      date: "10 July 2025",
      session: "Session A",
      duration: "60 min",
      completed: true,
    },
    {
      date: "11 July 2025",
      session: "Session B",
      duration: "72 min",
      completed: true,
    },
    {
      date: "12 July 2025",
      session: "Session C",
      duration: "88 min",
      completed: true,
    },
    {
      date: "13 July 2025",
      session: "Session A",
      duration: "84 min",
      completed: true,
    },
    {
      date: "14 July 2025",
      session: "Session B",
      duration: "60 min",
      completed: true,
    },
    {
      date: "15 July 2025",
      session: "Session C",
      duration: "72 min",
      completed: true,
    },
    {
      date: "16 July 2025",
      session: "Session A",
      duration: "60 min",
      completed: true,
    },
    {
      date: "17 July 2025",
      session: "Session B",
      duration: "0 min",
      completed: false,
    },
    {
      date: "18 July 2025",
      session: "Session C",
      duration: "60 min",
      completed: true,
    },
    {
      date: "19 July 2025",
      session: "Session A",
      duration: "72 min",
      completed: true,
    },
    {
      date: "20 July 2025",
      session: "Session B",
      duration: "84 min",
      completed: true,
    },
    {
      date: "21 July 2025",
      session: "Session C",
      duration: "60 min",
      completed: true,
    },
    {
      date: "22 July 2025",
      session: "Session A",
      duration: "72 min",
      completed: true,
    },
    {
      date: "23 July 2025",
      session: "Session B",
      duration: "88 min",
      completed: true,
    },
    {
      date: "24 July 2025",
      session: "Session C",
      duration: "60 min",
      completed: true,
    },
    {
      date: "25 July 2025",
      session: "Session A",
      duration: "88 min",
      completed: true,
    },
    {
      date: "26 July 2025",
      session: "Session B",
      duration: "84 min",
      completed: true,
    },
    {
      date: "27 July 2025",
      session: "Session C",
      duration: "88 min",
      completed: true,
    },
    {
      date: "28 July 2025",
      session: "Session A",
      duration: "84 min",
      completed: true,
    },
  ];

  // Filter workout history based on search, filter, and date range
  const filteredWorkoutHistory = workoutHistory.filter((workout) => {
    const matchesSearch =
      workout.date.toLowerCase().includes(search.toLowerCase()) ||
      workout.session.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All Sessions" || workout.session === filter;

    // Enhanced date filtering
    let matchesDateFilter = true;
    if (dateFilter !== "all") {
      const workoutDate = new Date(workout.date);
      const now = new Date();

      if (dateFilter === "custom") {
        if (customStartDate && customEndDate) {
          // Custom date range
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDateFilter =
            workoutDate >= startDate && workoutDate <= endDate;
        } else if (selectedSingleDate) {
          // Single date selection
          const selectedDate = new Date(selectedSingleDate);
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          matchesDateFilter =
            workoutDate >= selectedDate && workoutDate < nextDay;
        } else {
          matchesDateFilter = true; // No custom filter applied
        }
      } else {
        const cutoffDate = new Date();
        switch (dateFilter) {
          case "weekly":
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case "monthly":
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case "quarterly":
            cutoffDate.setMonth(now.getMonth() - 3);
            break;
          case "yearly":
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        matchesDateFilter = workoutDate >= cutoffDate;
      }
    }

    return matchesSearch && matchesFilter && matchesDateFilter;
  });

  // Helper function to get status class
  const getSessionStatusClass = (session: string, completed: boolean) => {
    if (!completed) return "bg-[#D9434326] text-[#D94343]"; // Red for cancelled
    if (session === "Session A") return "bg-[#4CAF5033] text-[#4CAF50]"; // Green for completed Session A
    if (session === "Session B") return "bg-[#4CAF5033] text-[#4CAF50]"; // Green for completed Session B
    if (session === "Session C") return "bg-[#4CAF5033] text-[#4CAF50]"; // Green for completed Session C
    return "bg-[#4CAF5033] text-[#4CAF50]"; // Default green
  };

  // Calendar helpers
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDaysArray = (date: Date) => {
    const days = [];
    const firstDay = firstDayOfMonth(date);
    const totalDays = daysInMonth(date);

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: "", empty: true });
    }

    // Add the days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i.toString(), empty: false });
    }

    return days;
  };

  // Get days of the week starting with Sunday
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Mock get workout status for calendar
  const getWorkoutStatusForDay = (day: string) => {
    // In a real app, check your workout data to see if there was a workout on this day
    if (!day) return null;
    const dayNumber = parseInt(day);
    if (dayNumber === 18) return "bg-[#D94343] text-white"; // Red for cancelled
    if (dayNumber >= 7 && dayNumber <= 28) return "bg-[#4CAF50] text-white"; // Green for completed
    return null;
  };

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
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch client name:", err);
        setLoading(false);
      }
    };

    fetchClientName();
  }, [params?.email]);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Add this function to handle opening workout details
  const openWorkoutDetails = (workout: {
    date: string;
    session: string;
    duration: string;
  }) => {
    // Mock exercise data based on session type
    const exercises =
      {
        "Session A": [
          {
            name: "Heels Elevated Zercher Squat",
            sets: 3,
            reps: 11,
            weight: "145lbs",
          },
          {
            name: "Scrape Rack L-Seated Shoulder Press",
            sets: 3,
            reps: 12,
            weight: "122lbs",
          },
          {
            name: "One-leg Leg Extension",
            sets: 2,
            reps: 15,
            weight: "145lbs",
          },
          {
            name: "Seated DB Lateral Raise",
            sets: 4,
            reps: 13,
            weight: "72lbs",
          },
        ],
        "Session B": [
          {
            name: "Barbell Romanian Deadlift",
            sets: 4,
            reps: 10,
            weight: "185lbs",
          },
          { name: "Incline DB Press", sets: 3, reps: 12, weight: "65lbs" },
          { name: "Single Arm Cable Row", sets: 3, reps: 15, weight: "55lbs" },
        ],
        "Session C": [
          { name: "Hip Thrust", sets: 4, reps: 12, weight: "205lbs" },
          { name: "Pull-ups", sets: 3, reps: 8, weight: "Bodyweight" },
          { name: "Standing Cable Fly", sets: 3, reps: 15, weight: "25lbs" },
          { name: "Ab Wheel Rollout", sets: 3, reps: 12, weight: "Bodyweight" },
        ],
      }[workout.session] || [];

    setSelectedWorkout({
      ...workout,
      exercises,
    });
  };

  // Add this useEffect hook to close the calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (showCalendar && !target.closest("[data-calendar]")) {
        setShowCalendar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  // Helper function to format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Helper function to handle single date selection from calendar
  const handleCalendarDateClick = (day: string) => {
    if (!day) return;

    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      parseInt(day)
    );

    const dateString = formatDateForInput(selectedDate);
    setSelectedSingleDate(dateString);
    setDateFilter("custom");

    // Clear custom range when selecting single date
    setCustomStartDate("");
    setCustomEndDate("");

    setShowCalendar(false);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#07172C] text-white p-6 flex justify-center items-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      <Navigation
        title="Workout"
        subtitle="View your workout progress"
        email={params.email as string}
        userName={userName}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Progress Overview with View/Edit/Add Toggle */}
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
            <button className="px-4 py-1 rounded bg-[#DD3333] text-white text-sm">
              View
            </button>
            <Link
              href={`/${params.email}/workout/edit-template`}
              className="px-4 py-1 rounded bg-[#142437] hover:bg-[#1D325A] text-white text-sm transition-colors"
            >
              Edit
            </Link>
            <Link
              href={`/${params.email}/workout/add`}
              className="px-4 py-1 rounded bg-[#142437] hover:bg-[#1D325A] text-white text-sm transition-colors"
            >
              Add/Del
            </Link>
          </div>
        </div>

        {/* Workout History Section */}
        <div className="mt-8">
          {/* Workout History Box */}
          <div className="bg-[#142437] border border-[#22364F] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Workout History</h3>

              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-1 rounded text-sm ${
                    viewMode === "table"
                      ? "bg-[#DD3333] text-white"
                      : "bg-[#142437] border border-[#22364F] text-white"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={`px-4 py-1 rounded text-sm ${
                    viewMode === "graph"
                      ? "bg-[#DD3333] text-white"
                      : "bg-[#142437] border border-[#22364F] text-white"
                  }`}
                >
                  Graph
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Workout..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white text-sm w-[250px]"
                />
                <svg
                  className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white text-sm appearance-none"
                >
                  <option>All Sessions</option>
                  <option>Session A</option>
                  <option>Session B</option>
                  <option>Session C</option>
                </select>
                <svg
                  className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              <div className="relative">
                <select className="pl-3 pr-8 py-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white text-sm appearance-none">
                  <option>Modifications</option>
                  <option>All</option>
                  <option>None</option>
                </select>
                <svg
                  className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Update the calendar button and implement a simple calendar popup */}
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="p-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white relative"
                data-calendar
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>

                {/* Enhanced Calendar Popup with Date Filtering */}
                {showCalendar && (
                  <div
                    className="absolute top-full left-0 mt-2 z-10 bg-[#142437] border border-[#22364F] rounded-lg shadow-lg p-4 w-80"
                    data-calendar
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Quick Date Filters
                    <div className="mb-4 p-3 bg-[#0E1F34] rounded border border-[#22364F]">
                      <h5 className="text-sm font-medium text-gray-300 mb-3">
                        Quick Filters
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateFilter("weekly");
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setSelectedSingleDate("");
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            dateFilter === "weekly"
                              ? "bg-[#DD3333] text-white"
                              : "bg-[#22364F] text-gray-300 hover:bg-[#1D325A]"
                          }`}
                        >
                          Last Week
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateFilter("monthly");
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setSelectedSingleDate("");
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            dateFilter === "monthly"
                              ? "bg-[#DD3333] text-white"
                              : "bg-[#22364F] text-gray-300 hover:bg-[#1D325A]"
                          }`}
                        >
                          Last Month
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateFilter("quarterly");
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setSelectedSingleDate("");
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            dateFilter === "quarterly"
                              ? "bg-[#DD3333] text-white"
                              : "bg-[#22364F] text-gray-300 hover:bg-[#1D325A]"
                          }`}
                        >
                          Last 3 Months
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateFilter("yearly");
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setSelectedSingleDate("");
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            dateFilter === "yearly"
                              ? "bg-[#DD3333] text-white"
                              : "bg-[#22364F] text-gray-300 hover:bg-[#1D325A]"
                          }`}
                        >
                          Last Year
                        </button>
                      </div>
                    </div> */}
                    {/* Single Date Selection */}
                    <div className="mb-4 p-3 bg-[#0E1F34] rounded border border-[#22364F]">
                      <h5 className="text-sm font-medium text-gray-300 mb-3">
                        Single Date Selection
                      </h5>
                      <input
                        type="date"
                        value={selectedSingleDate}
                        onChange={(e) => {
                          setSelectedSingleDate(e.target.value);
                          setDateFilter("custom");
                          setCustomStartDate("");
                          setCustomEndDate("");
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 bg-[#142437] border border-[#22364F] text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#DD3333]"
                      />
                    </div>
                    {/* Custom Date Range Inputs */}
                    <div className="mb-4 p-3 bg-[#0E1F34] rounded border border-[#22364F]">
                      <h5 className="text-sm font-medium text-gray-300 mb-3">
                        Custom Date Range
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => {
                              setCustomStartDate(e.target.value);
                              setDateFilter("custom");
                              setSelectedSingleDate("");
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 bg-[#142437] border border-[#22364F] text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#DD3333]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => {
                              setCustomEndDate(e.target.value);
                              setDateFilter("custom");
                              setSelectedSingleDate("");
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 bg-[#142437] border border-[#22364F] text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#DD3333]"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Calendar Navigation */}
                    {/* <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-sm">
                        {formatMonthYear(currentMonth)}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            previousMonth();
                          }}
                          className="p-1 hover:bg-[#1D325A] rounded"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextMonth();
                          }}
                          className="p-1 hover:bg-[#1D325A] rounded"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day}
                          className="py-1 text-xs font-medium text-gray-400"
                        >
                          {day}
                        </div>
                      ))}

                      {getDaysArray(currentMonth).map((day, index) => {
                        const dayWorkout = workoutHistory.find((w) => {
                          if (day.empty) return false;
                          const workoutDate = new Date(w.date);
                          const calendarDate = new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            parseInt(day.day)
                          );
                          return (
                            workoutDate.toDateString() ===
                            calendarDate.toDateString()
                          );
                        });

                        const isSelectedDate =
                          !day.empty &&
                          selectedSingleDate &&
                          new Date(selectedSingleDate).toDateString() ===
                            new Date(
                              currentMonth.getFullYear(),
                              currentMonth.getMonth(),
                              parseInt(day.day)
                            ).toDateString();

                        return (
                          <div
                            key={index}
                            className={`p-1 text-center ${
                              day.empty
                                ? "invisible"
                                : "cursor-pointer hover:bg-[#1D325A] rounded"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!day.empty) {
                                handleCalendarDateClick(day.day);
                              }
                            }}
                          >
                            <span
                              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                isSelectedDate
                                  ? "bg-[#DD3333] text-white border-2 border-white"
                                  : dayWorkout
                                  ? dayWorkout.completed
                                    ? "bg-[#4CAF50] text-white"
                                    : "bg-[#D94343] text-white"
                                  : ""
                              }`}
                            >
                              {day.day}
                            </span>
                          </div>
                        );
                      })}
                    </div> */}
                    {/* Legend */}
                    <div className="mt-4 pt-3 border-t border-[#22364F]">
                      <div className="flex justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
                          <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#D94343]"></div>
                          <span>Cancelled</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#DD3333] border border-white"></div>
                          <span>Selected</span>
                        </div>
                      </div>
                    </div>
                    {/* Apply/Close Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateFilter("all");
                          setCustomStartDate("");
                          setCustomEndDate("");
                          setSelectedSingleDate("");
                          setShowCalendar(false);
                        }}
                        className="flex-1 px-3 py-2 bg-[#22364F] hover:bg-[#1D325A] text-white rounded text-sm transition-colors"
                      >
                        Clear Filter
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (customStartDate && customEndDate) {
                            setDateFilter("custom");
                            setSelectedSingleDate("");
                          } else if (selectedSingleDate) {
                            setDateFilter("custom");
                            setCustomStartDate("");
                            setCustomEndDate("");
                          }
                          setShowCalendar(false);
                        }}
                        className="flex-1 px-3 py-2 bg-[#DD3333] hover:bg-[#BB2828] text-white rounded text-sm transition-colors"
                      >
                        Apply Filter
                      </button>
                    </div>
                  </div>
                )}
              </button>

              <button className="ml-auto flex items-center gap-1 p-2 bg-[#0E1F34] border border-[#22364F] rounded-md text-white">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export CSV</span>
              </button>
            </div>

            {/* Status Legend */}
            <div className="flex gap-4 mb-4 justify-end">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-[#4CAF50]"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-[#FFC107]"></div>
                <span>Modified</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-[#D94343]"></div>
                <span>Cancelled</span>
              </div>
            </div>

            {/* Workout History Table */}
            {viewMode === "table" && (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#22364F] text-left">
                      <th className="py-3 px-4 font-medium">Date Of Workout</th>
                      <th className="py-3 px-4 font-medium">Type</th>
                      <th className="py-3 px-4 font-medium">Duration</th>
                      <th className="py-3 px-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkoutHistory.map((workout, index) => (
                      <tr
                        key={index}
                        className="border-b border-[#22364F] last:border-b-0"
                      >
                        <td className="py-3 px-4">{workout.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-md ${getSessionStatusClass(
                              workout.session,
                              workout.completed
                            )}`}
                          >
                            {workout.session}
                          </span>
                        </td>
                        <td className="py-3 px-4">{workout.duration}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openWorkoutDetails(workout)}
                            className="text-gray-400 hover:text-white"
                          >
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Graph View Placeholder */}
            {viewMode === "graph" && (
              <div className="bg-[#142437] rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center">
                      Overall Exercise Progress
                      <svg
                        className="w-5 h-5 ml-2 text-green-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-[#4CAF5033] text-[#4CAF50] rounded">
                        On Track
                      </span>
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Based on Progressive Overload
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTimeRange("Weekly")}
                      className={`px-4 py-1 rounded text-sm ${
                        timeRange === "Weekly"
                          ? "bg-[#22364F] text-white"
                          : "text-gray-400"
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setTimeRange("Monthly")}
                      className={`px-4 py-1 rounded text-sm ${
                        timeRange === "Monthly"
                          ? "bg-[#22364F] text-white"
                          : "text-gray-400"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setTimeRange("Yearly")}
                      className={`px-4 py-1 rounded text-sm ${
                        timeRange === "Yearly"
                          ? "bg-[#22364F] text-white"
                          : "text-gray-400"
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                {/* Graph Section */}
                <div className="h-64 relative">
                  {/* Y-Axis Labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
                    <div>30%</div>
                    <div>21.25%</div>
                    <div>12.5%</div>
                    <div>3.75%</div>
                    <div>-5%</div>
                  </div>

                  {/* Horizontal Grid Lines */}
                  <div className="absolute left-10 right-0 top-0 h-full flex flex-col justify-between">
                    <div className="border-t border-[#22364F] w-full h-0"></div>
                    <div className="border-t border-[#22364F] w-full h-0"></div>
                    <div className="border-t border-[#22364F] w-full h-0"></div>
                    <div className="border-t border-[#22364F] w-full h-0"></div>
                    <div className="border-t border-[#22364F] w-full h-0"></div>
                  </div>

                  {/* Progress Line Graph */}
                  <div className="absolute left-10 right-0 top-0 h-full">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 1000 240"
                      preserveAspectRatio="none"
                    >
                      {/* The progress line */}
                      <path
                        d="M0,220 L83,200 L166,170 L249,180 L332,160 L415,140 L498,155 L581,150 L664,148 L747,120 L830,100 L913,90 L1000,95"
                        stroke="#DD3333"
                        strokeWidth="3"
                        fill="none"
                      />

                      {/* Data points */}
                      <circle cx="0" cy="220" r="5" fill="#DD3333" />
                      <circle cx="83" cy="200" r="5" fill="#DD3333" />
                      <circle cx="166" cy="170" r="5" fill="#DD3333" />
                      <circle cx="249" cy="180" r="5" fill="#DD3333" />
                      <circle cx="332" cy="160" r="5" fill="#DD3333" />
                      <circle cx="415" cy="140" r="5" fill="#DD3333" />
                      <circle cx="498" cy="155" r="5" fill="#DD3333" />
                      <circle cx="581" cy="150" r="5" fill="#DD3333" />
                      <circle cx="664" cy="148" r="5" fill="#DD3333" />
                      <circle cx="747" cy="120" r="5" fill="#DD3333" />
                      <circle cx="830" cy="100" r="5" fill="#DD3333" />
                      <circle cx="913" cy="90" r="5" fill="#DD3333" />
                      <circle cx="1000" cy="95" r="5" fill="#DD3333" />
                    </svg>
                  </div>

                  {/* X-Axis Labels */}
                  <div className="absolute left-10 right-0 bottom-0 flex justify-between text-xs text-gray-400 pt-2">
                    <div>Week 1</div>
                    <div>Week 2</div>
                    <div>Week 3</div>
                    <div>Week 4</div>
                    <div>Week 5</div>
                    <div>Week 6</div>
                    <div>Week 7</div>
                    <div>Week 8</div>
                    <div>Week 9</div>
                    <div>Week 10</div>
                    <div>Week 11</div>
                    <div>Week 12</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add the modal component for the exercise details */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-[#142437]/50 rounded-lg w-[550px] max-h-[80vh] overflow-hidden relative">
            {/* Modal Header with Close Button */}
            <div className="flex justify-between items-center p-5 border-b border-[#22364F]">
              <h3 className="text-xl font-medium">
                {selectedWorkout.session} - {selectedWorkout.date}
              </h3>
              <button
                onClick={() => setSelectedWorkout(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Duration Section */}
              <div className="bg-[#0E1F34] rounded-md py-2 px-4 mb-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <h4 className="text-base font-medium">Duration</h4>
                </div>
                <p className="text-gray-300 ml-7">
                  {selectedWorkout.duration.replace(" min", " minutes")}
                </p>
              </div>

              {/* Last Modified Section */}
              <div className="mb-6 bg-[#0E1F34] rounded-md py-2 px-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  <h4 className="text-base font-medium">Last Modified By</h4>
                </div>
                <p className="text-gray-300 ml-7">Trainer</p>
              </div>

              {/* Exercise Breakdown Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Exercise Breakdown</h3>

                {selectedWorkout.exercises?.map((exercise, index) => (
                  <div key={index} className="bg-[#0E1F34] rounded-md p-4 mb-3">
                    <h4 className="font-medium mb-2">{exercise.name}</h4>
                    <div className="flex gap-5 text-sm text-gray-300">
                      <div>Sets: {exercise.sets}</div>
                      <div>Reps: {exercise.reps}</div>
                      <div>Weight: {exercise.weight}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this helper function
function formatMonthYear(date: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
