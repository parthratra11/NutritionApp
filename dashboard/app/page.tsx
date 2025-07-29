"use client";

import { useState, useEffect, useRef } from "react";
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
  const [showNav, setShowNav] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarRef = useRef<HTMLDivElement>(null);

  const generateDateStrip = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const today = new Date();
    const currentDay = today.getDay();
    const selectedDay = selectedDate.getDay();

    // Get the first day of the week (Sunday)
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDay);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push({
        day: days[i],
        date: date.getDate(),
        fullDate: new Date(date),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    return dates;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week the month starts on (0-6, Sunday-Saturday)
    const startDayOfWeek = firstDay.getDay();

    // Total days in month
    const daysInMonth = lastDay.getDate();

    // Create array for all days to display
    const days = [];

    // Add empty spaces for days before the first of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        date: i,
        fullDate: dayDate,
        isSelected: dayDate.toDateString() === selectedDate.toDateString(),
        isToday: dayDate.toDateString() === new Date().toDateString(),
      });
    }

    return days;
  };

  const changeMonth = (amount: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + amount);
    setCurrentMonth(newMonth);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const dateStrip = generateDateStrip();

  // Menu items for side navigation
  const menuItems = [
    {
      label: "Slack Channel",
      path: "/slack",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      ),
    },
    {
      label: "Slack DMs",
      path: "/slack/dms",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      ),
    },
    {
      label: "Logout",
      path: "/",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
  ];

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
      {/* Side Navigation */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          showNav ? "translate-x-0" : "-translate-x-full"
        } bg-[#0a1c3f] text-white w-64 z-30 overflow-y-auto transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={() => setShowNav(false)} className="text-white">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          <nav>
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li key={`${item.path}-${item.label}`}>
                  <button
                    onClick={() => {
                      router.push(item.path);
                      setShowNav(false);
                    }}
                    className="flex items-center text-gray-300 hover:text-white w-full py-2"
                  >
                    <svg
                      className="h-5 w-5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {item.icon}
                    </svg>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          showNav ? "opacity-50 z-20" : "opacity-0 -z-10"
        }`}
        onClick={() => setShowNav(false)}
      />

      {/* Header Bar with greeting and date strip side by side */}
      <div className="bg-[#0a1c3f] text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button className="mr-3" onClick={() => setShowNav(true)}>
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
            <div className="h-12 w-12 rounded-full mr-3 overflow-hidden flex-shrink-0 relative">
              <Image
                src="/User.png"
                alt="Profile"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          {/* New Date Picker */}
          <div className="flex items-center bg-[#0F1D3C] px-3 h-[60px] rounded-lg relative">
            <div className="flex space-x-1 items-center">
              {generateDateStrip().map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(item.fullDate)}
                  className={`flex flex-col items-center justify-center w-[34px] h-[54px] rounded-full ${
                    item.isSelected
                      ? "bg-[#616A77]/50"
                      : "bg-transparent border border-[#D9D9D9]/50 border-opacity-30"
                  }`}
                >
                  <span className="text-sm font-medium text-white">
                    {item.day}
                  </span>
                  <div
                    className={`flex items-center justify-center w-6 h-6 mt-1 ${
                      item.isSelected ? "bg-[#DD3333] rounded-full" : ""
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        item.isSelected ? "font-bold" : ""
                      }`}
                    >
                      {item.date}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="ml-3 relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-white p-1"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showCalendar && (
                <div
                  className="absolute right-0 top-10 z-50 bg-white rounded-lg shadow-lg p-3"
                  style={{ width: "280px" }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-1 bg-gray-300 hover:bg-gray-500 rounded"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <div className="font-semibold text-gray-800">
                      {currentMonth.toLocaleString("default", {
                        month: "long",
                      })}{" "}
                      {currentMonth.getFullYear()}
                    </div>

                    <button
                      onClick={() => changeMonth(1)}
                      className="p-1 bg-gray-300 hover:bg-grey-500 rounded"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div
                        key={i}
                        className="text-xs font-medium text-gray-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {generateCalendarDays().map((day, index) => (
                      <div
                        key={index}
                        className="h-8 w-8 flex items-center justify-center"
                      >
                        {day ? (
                          <button
                            onClick={() => handleDateSelect(day.fullDate)}
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-sm
                              ${
                                day.isSelected
                                  ? "bg-[#DD3333] text-white"
                                  : day.isToday
                                  ? "bg-gray-200"
                                  : "hover:bg-gray-100 text-gray-800"
                              }`}
                          >
                            {day.date}
                          </button>
                        ) : (
                          <span></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              <div className="h-12 w-12 rounded-full mr-3 overflow-hidden flex-shrink-0 relative">
                <Image
                  src="/User.png"
                  alt="Profile"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="overflow-hidden">
                <h2 className="font-semibold text-white">{form.fullName}</h2>
                <p className="text-xs text-gray-300 truncate">{form.email}</p>
                <p className="text-xs text-gray-300">
                  Joined:{" "}
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
