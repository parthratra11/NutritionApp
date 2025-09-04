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

// Utility function to format date as DD-MM-YYYY
const formatDMY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function Home() {
  const router = useRouter();
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date" | "active" | "age">(
    "date"
  );
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const calendarRef = useRef<HTMLDivElement>(null);

  const generateDateStrip = () => {
    const days = ["S", "M", "T", "W", "Th", "F", "S"];
    const today = new Date();

    // Start from 6 days before today and end with today
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push({
        day: days[date.getDay()],
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

  // Sort and filter intake forms
  const sortedIntakeForms = [...intakeForms].sort((a, b) => {
    if (sortBy === "name") {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortBy === "date") {
      const dateA = a.timestamp?.toDate?.()
        ? a.timestamp.toDate().getTime()
        : 0;
      const dateB = b.timestamp?.toDate?.()
        ? b.timestamp.toDate().getTime()
        : 0;
      return dateB - dateA;
    } else if (sortBy === "active") {
      // Sort by active status (assuming there's an 'active' field)
      const activeA = (a as any)?.active ? 1 : 0;
      const activeB = (b as any)?.active ? 1 : 0;
      return activeB - activeA; // Active first
    } else if (sortBy === "age") {
      // Sort by age (assuming there's an 'age' field)
      const ageA = (a as any)?.age || 0;
      const ageB = (b as any)?.age || 0;
      return ageA - ageB; // Youngest first
    }
    return 0;
  });

  const visibleForms = sortedIntakeForms.filter((f) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      f.fullName.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)
    );
  });

  // Stats calculations
  const paidCount = intakeForms.filter((f: any) => f?.paid === true).length;
  const unpaidCount = Math.max(0, intakeForms.length - paidCount);

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0B1F35]">
      {/* Side Navigation - unchanged */}
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

      {/* Overlay - unchanged */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          showNav ? "opacity-50 z-20" : "opacity-0 -z-10"
        }`}
        onClick={() => setShowNav(false)}
      />

      {/* Header - made responsive */}
      <div className="bg-[#0B1F35] text-white px-4 md:px-6 pt-4 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Top row on mobile: hamburger + theme + greeting + avatar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="mr-3 lg:mr-4" onClick={() => setShowNav(true)}>
                <svg
                  className="h-6 w-6 lg:h-7 lg:w-7"
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

              {/* Theme Toggle Pill - responsive */}
              <div className="flex items-center bg-[#0F1D3C] border border-white/10 rounded-full px-1 lg:px-1.5 mr-3 lg:mx-6">
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-1 lg:p-1 rounded-full transition-colors ${
                    isDarkMode ? "bg-white text-gray-800" : "text-white/60"
                  }`}
                >
                  <svg
                    className="w-3 h-3 lg:w-4 lg:h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-1 lg:p-2 rounded-full transition-colors ${
                    !isDarkMode ? "bg-white text-gray-800" : "text-white/60"
                  }`}
                >
                  <svg
                    className="w-3 h-3 lg:w-4 lg:h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Greeting text - responsive */}
              <div className="mr-3 lg:mr-4 lg:ml-6">
                <p className="text-lg lg:text-xl font-semibold">Hi, Cymron</p>
                <p className="text-xs lg:text-sm opacity-80">
                  See their progress!
                </p>
              </div>
            </div>

            {/* Avatar - responsive */}
            <div className="h-12 w-12 lg:h-20 lg:w-20 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image
                src="/User.png"
                alt="Profile"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Date strip - responsive positioning */}
          <div className="flex justify-center lg:justify-start lg:mr-12">
            <div className="flex items-center bg-[#0F1D3C] px-2 lg:px-4 h-[55px] lg:h-[65px] rounded-lg">
              <div className="flex space-x-1 lg:space-x-2 items-center">
                {generateDateStrip().map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.fullDate)}
                    className={`flex flex-col items-center justify-center w-[28px] lg:w-[30px] h-[48px] lg:h-[58px] rounded-full ${
                      item.isSelected
                        ? "bg-[#616A77]/50"
                        : "bg-transparent border border-white/20"
                    }`}
                  >
                    <span className="text-[10px] lg:text-[12px] font-medium text-white/80">
                      {item.day}
                    </span>
                    <div
                      className={`flex items-center justify-center w-5 h-5 lg:w-6 lg:h-6 mt-1 lg:mt-3 ${
                        item.isSelected ? "bg-[#DD3333] rounded-full" : ""
                      }`}
                    >
                      <span
                        className={`text-xs lg:text-sm ${
                          item.isSelected ? "font-bold text-white" : ""
                        }`}
                      >
                        {item.date}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search box - responsive */}
          <div className="flex items-center w-full md:w-[280px] lg:w-[360px] bg-white/10 rounded-full px-3 py-2">
            <svg
              className="w-4 h-4 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Students..."
              className="bg-transparent outline-none placeholder-white/50 text-sm text-white ml-2 w-full"
            />
          </div>
        </div>

        {/* Stats cards - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-5 mt-6 lg:mt-8">
          <div className="bg-[#0F1D3C] border border-white/10 rounded-xl px-4 py-4 lg:py-5 flex items-center justify-between">
            <div className="text-[12px] lg:text-[14px] text-white/70">
              Total Students
            </div>
            <div className="text-xl lg:text-2xl font-semibold">
              {intakeForms.length}
            </div>
          </div>
          <div className="bg-[#0F1D3C] border border-white/10 rounded-xl px-4 py-4 lg:py-5 flex items-center justify-between">
            <div className="text-[12px] lg:text-[14px] text-white/70">
              Paid Students
            </div>
            <div className="text-xl lg:text-2xl font-semibold">{paidCount}</div>
          </div>
          <div className="bg-[#0F1D3C] border border-white/10 rounded-xl px-4 py-4 lg:py-5 flex items-center justify-between">
            <div className="text-[12px] lg:text-[14px] text-white/70">
              Unpaid Students
            </div>
            <div className="text-xl lg:text-2xl font-semibold">
              {unpaidCount}
            </div>
          </div>
        </div>
      </div>

      {/* Sort By dropdown - responsive positioning */}
      <div className="flex justify-end px-4 md:px-6 py-4 lg:py-8 relative">
        <button
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6h18M6 12h12M10 18h4"
            />
          </svg>
          Sort By
        </button>

        {showSortDropdown && (
          <div className="absolute top-full right-4 md:right-6 mt-2 bg-white rounded-lg shadow-xl py-2 w-40 border z-10">
            <button
              onClick={() => {
                setSortBy("name");
                setShowSortDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Alphabetically
            </button>
            <button
              onClick={() => {
                setSortBy("date");
                setShowSortDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Join Date
            </button>
            <button
              onClick={() => {
                setSortBy("active");
                setShowSortDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Active/Inactive
            </button>
            <button
              onClick={() => {
                setSortBy("age");
                setShowSortDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Age
            </button>
          </div>
        )}
      </div>

      {/* Student Cards - responsive grid */}
      <div className="px-4 md:px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4 md:gap-5">
          {visibleForms.map((form) => (
            <div
              key={form.email}
              className="bg-[#0f2036] border border-white/10 rounded-2xl px-4 py-4 lg:py-5 text-white hover:shadow-lg transition-shadow cursor-pointer flex items-center"
              onClick={() => router.push(`/${encodeURIComponent(form.email)}`)}
            >
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full mr-3 overflow-hidden flex-shrink-0 relative">
                <Image
                  src="/User.png"
                  alt="Profile"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] lg:text-[15px] font-semibold text-[#CFE0FF] truncate">
                  {form.fullName}
                </div>
                <div className="text-[11px] lg:text-[12px] text-white/60 truncate">
                  Submitted:{" "}
                  {form.timestamp?.toDate
                    ? formatDMY(form.timestamp.toDate())
                    : "No date"}
                </div>
              </div>
            </div>
          ))}
          {visibleForms.length === 0 && (
            <p className="text-gray-400 col-span-full text-center text-sm">
              No students found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
