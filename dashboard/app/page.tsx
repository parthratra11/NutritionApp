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
  profile?: string; // Add profile field
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

  // Sidebar menu items updated to include Dashboard and Exercises
  const menuItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Slack Channel",
      path: "/slack",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Slack DMs",
      path: "/slack/dms",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Exercises",
      path: "/exercises",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20.0833 7.08331H17.4167V5.99998C17.4167 5.40831 16.9083 4.89998 16.3167 4.89998H7.68333C7.08333 4.89998 6.58333 5.40831 6.58333 5.99998V7.08331H3.91667C3.41667 7.08331 3 7.49998 3 7.99998V16C3 16.5 3.41667 16.9166 3.91667 16.9166H6.58333V18C6.58333 18.5916 7.09167 19.1 7.68333 19.1H16.3167C16.9083 19.1 17.4167 18.5916 17.4167 18V16.9166H20.0833C20.5833 16.9166 21 16.5 21 16V7.99998C21 7.49998 20.5833 7.08331 20.0833 7.08331ZM6.58333 14.75H5.16667V9.24998H6.58333V14.75ZM15.25 16.9166H8.75V7.08331H15.25V16.9166ZM18.8333 14.75H17.4167V9.24998H18.8333V14.75Z"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      label: "Logout",
      path: "/",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 16L21 12M21 12L17 8M21 12H9M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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

  // Stats calculations - consider all students as paid
  const paidCount = intakeForms.length; // All students are paid
  const unpaidCount = 0; // No unpaid students

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0B1F35]">
      {/* Side Navigation - updated to match Navigation.tsx */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          showNav ? "translate-x-0" : "-translate-x-full"
        } bg-[#0B1F35]/90 backdrop-blur-md border-r border-white/10 text-white w-[240px] z-30 overflow-y-auto transition-transform duration-300 ease-in-out`}
      >
        <div className="flex justify-end p-6">
          <button
            onClick={() => setShowNav(false)}
            className="text-white/60 hover:text-white hover:cursor-pointer"
            aria-label="Close menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <nav className="mt-8">
          <ul>
            {menuItems.map((item, i) => (
              <li key={i} className="border-b border-[#1e3252]/60">
                <button
                  onClick={() => {
                    router.push(item.path);
                    setShowNav(false);
                  }}
                  className="flex items-center w-full py-6 px-8 text-white/80 hover:text-white hover:bg-[#1e3252]/50 transition-colors"
                >
                  <div className="w-8 h-8 flex items-center justify-center mr-4 text-white/80">
                    {item.icon}
                  </div>
                  <span className="text-lg">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Overlay - enhanced to match Navigation.tsx */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          showNav ? "opacity-100 z-20" : "opacity-0 -z-10"
        }`}
        onClick={() => setShowNav(false)}
      />

      {/* Header - made responsive */}
      <div className="bg-[#0B1F35] text-white px-4 md:px-6 pt-4 pb-3 ">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-b-gray-500/50 pb-4">
          {/* Top row on mobile: hamburger + theme + greeting + avatar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="mr-3 lg:mr-4" onClick={() => setShowNav(true)}>
                <svg
                  className="h-6 w-6 lg:h-10 lg:w-10 hover:cursor-pointer"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
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
                {/* <p className="text-xs lg:text-sm opacity-80">
                  See their progress!
                </p> */}
              </div>
            </div>

            {/* Avatar - responsive */}
            <div className="h-12 w-12 lg:h-20 lg:w-20 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image
                src="/cymron.png"
                alt="Profile"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Date strip - responsive positioning */}
          <div className="flex justify-center lg:justify-start lg:mr-12">
            <div className="flex items-center px-2 lg:px-4 h-[55px] lg:h-[65px] rounded-lg">
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
          <div className="bg-gray-700/50 md:mx-6 border border-white/10 rounded-xl px-4 py-4 lg:py-5 flex items-center justify-between">
            <div className="text-[12px] lg:text-[14px] text-white/70">
              Total Students
            </div>
            <div className="text-xl lg:text-2xl font-semibold">
              {intakeForms.length}
            </div>
          </div>
          <div className="bg-gray-700/50 md:mx-6 border border-white/10 rounded-xl px-4 py-4 lg:py-5 flex items-center justify-between">
            <div className="text-[12px] lg:text-[14px] text-white/70">
              Paid Students
            </div>
            <div className="text-xl lg:text-2xl font-semibold">{paidCount}</div>
          </div>
          <div className="bg-gray-700/50 md:mx-6 border border-white/10 rounded-xl px-4 py-4 lg:py-5 flex items-center justify-between">
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
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white hover:cursor-pointer"
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
          <div className="absolute top-4/5 right-4 md:right-6 bg-white rounded-2xl shadow-xl py-2 w-40 border z-10">
            <button
              onClick={() => {
                setSortBy("name");
                setShowSortDropdown(false);
              }}
              className="block w-full text-center px-4 py-2 text-sm border-b border-b-gray-300 text-gray-700 hover:cursor-pointer"
            >
              Alphabetically
            </button>
            <button
              onClick={() => {
                setSortBy("date");
                setShowSortDropdown(false);
              }}
              className="block w-full text-center px-4 py-2 text-sm border-b border-b-gray-300 text-gray-700 hover:cursor-pointer"
            >
              Join Date
            </button>
            <button
              onClick={() => {
                setSortBy("active");
                setShowSortDropdown(false);
              }}
              className="block w-full text-center px-4 py-2 text-sm border-b border-b-gray-300 text-gray-700 hover:cursor-pointer"
            >
              Active/Inactive
            </button>
            <button
              onClick={() => {
                setSortBy("age");
                setShowSortDropdown(false);
              }}
              className="block w-full text-center px-4 py-2 text-sm text-gray-700 hover:cursor-pointer"
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
              className="bg-gray-700/50 border border-white/10 rounded-3xl px-4 py-4 lg:py-5 text-white hover:shadow-lg transition-shadow cursor-pointer flex items-center"
              onClick={() => router.push(`/${encodeURIComponent(form.email)}`)}
            >
              <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-full mr-3 overflow-hidden flex-shrink-0 relative">
                <Image
                  src={form.profile || "/User.png"}
                  alt="Profile"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[16px] lg:text-[18px] font-semibold text-[#CFE0FF] truncate">
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
