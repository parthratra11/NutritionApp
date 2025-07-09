"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface NavigationProps {
  title: string;
  subtitle?: string;
  email: string;
}

export default function Navigation({
  title,
  subtitle,
  email,
}: NavigationProps) {
  const [showNav, setShowNav] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const menuItems = [
    {
      label: "Overview",
      path: "",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      label: "Form Response",
      path: "/details",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      ),
    },
    {
      label: "Steps",
      path: "/report",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      ),
    },
    {
      label: "Nutrition",
      path: "/nutrition",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      ),
    },
    {
      label: "Weight",
      path: "/report",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
        />
      ),
    },
    {
      label: "Sleep",
      path: "/report",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      ),
    },
    {
      label: "Mood",
      path: "/report",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      label: "Workout",
      path: "/workout",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5v-1.65M12 14.5a.5.5 0 01.5.5.5.5 0 01-.5.5.5.5 0 01-.5-.5.5.5 0 01.5-.5z"
        />
      ),
    },
    {
      label: "Edit Workout Template",
      path: "/workout/edit-template",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      ),
    },
    {
      label: "Reports",
      path: "/report",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
    },
    {
      label: "Data Upload",
      path: "/new-upload",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      ),
    },
  ];

  return (
    <>
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
                      router.push(`/${email}${item.path}`);
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

      {/* Header */}
      <div className="bg-[#0a1c3f] text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button className="mr-3" onClick={() => setShowNav(true)}>
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="mr-3">
              <p className="font-bold text-lg">{title}</p>
              {subtitle && <p className="text-xs opacity-80">{subtitle}</p>}
            </div>

            {/* Add Contact via Slack button and user profile next to each other */}
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 relative">
                <Image
                  src="/User.png"
                  alt="Profile"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <button
                onClick={() => {
                  // Fix: Check if email is already encoded, if so use it directly
                  // Otherwise encode it just once
                  const emailParam = email.includes("%40")
                    ? email
                    : encodeURIComponent(email);
                  router.push(`/slack/dms?email=${emailParam}`);
                }}
                className="flex items-center bg-[#4A154B] hover:bg-[#611f64] ml-3 px-3 py-1.5 rounded text-sm transition-colors"
              >
                <svg
                  className="h-4 w-4 mr-1.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm12-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM6 15h12a5 5 0 0 1 5 5v2h-2v-2a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v2H1v-2a5 5 0 0 1 5-5z" />
                </svg>
                Contact
              </button>
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
    </>
  );
}
