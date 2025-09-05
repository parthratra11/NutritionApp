"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface NavigationProps {
  title?: string;
  subtitle?: string;
  email: string;
}

export default function Navigation({
  title = "Workout",
  subtitle,
  email,
}: NavigationProps) {
  const [showNav, setShowNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Check screen size on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Current week days
  const days = ["S", "M", "T", "W", "Th", "F", "S"];
  const today = new Date();
  const currentDay = today.getDay();

  // Generate dates for the current week
  const weekDates = days.map((day, index) => {
    const date = new Date();
    date.setDate(today.getDate() - currentDay + index);
    return {
      day,
      date: date.getDate(),
      isToday: index === currentDay,
    };
  });

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

  // Sidebar menu items
  const menuItems = [
    { label: "Dashboard", path: "" },
    { label: "Workout", path: "/workout" },
    { label: "Nutrition", path: "/nutrition" },
    { label: "Progress", path: "/progress" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <div className="bg-[#0B1F35] text-white">
      {/* Main navigation bar - desktop version */}
      <div className="hidden md:flex items-center justify-between py-2 border-b border-gray-700/50">
        {/* Left: Hamburger menu and toggle */}
        <div className="flex items-center ml-4 w-2/5">
          <button
            onClick={() => setShowNav(!showNav)}
            className="p-2 hover:cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg
              className="w-10 h-10"
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

          <div className="ml-2 flex items-center">
            {/* Theme Toggle Pill */}
            <div className="flex items-center bg-[#0F1D3C] border border-white/10 rounded-full px-1 lg:px-1.5 mr-3 lg:mx-6">
              <button
                onClick={() => setIsDarkMode(true)}
                className={`p-1 lg:p-1 rounded-full transition-colors ${
                  isDarkMode ? "bg-white text-gray-800" : "text-white/60"
                }`}
                aria-label="Dark mode"
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
                aria-label="Light mode"
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
            {/* Page name */}
            <span className="ml-2 text-2xl font-medium truncate">
              {title.includes("'s") ? title.split("'s")[1].trim() : title}
            </span>
          </div>
        </div>

        {/* Date strip - centered */}
        <div className="flex justify-center w-1/5 mx-4">
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

        {/* Right: User profile with exact styling */}
        <div className="flex items-center space-x-2 my-2 bg-gray-700 p-1 pr-8 lg:pr-76 rounded-bl-full rounded-tl-full w-2/5 justify-end">
          <div className="h-14 w-14 lg:h-16 lg:w-16 rounded-full overflow-hidden relative flex-shrink-0">
            <Image
              src="/User.png"
              alt="Profile"
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 1024px) 56px, 64px"
              priority
            />
          </div>
          <span className="font-medium text-lg lg:text-xl ml-2 whitespace-nowrap">
            Aria Michele
          </span>
        </div>
      </div>

      {/* Mobile navigation - optimized for small screens */}
      <div className="md:hidden flex flex-col border-b border-gray-700/50">
        {/* Top row: menu, toggle, title */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center">
            <button
              onClick={() => setShowNav(!showNav)}
              className="p-1 mr-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center">
              {/* Theme Toggle - smaller for mobile */}
              <div className="flex items-center bg-[#0F1D3C] border border-white/10 rounded-full px-1 mr-2">
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-1 rounded-full transition-colors ${
                    isDarkMode ? "bg-white text-gray-800" : "text-white/60"
                  }`}
                  aria-label="Dark mode"
                >
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-1 rounded-full transition-colors ${
                    !isDarkMode ? "bg-white text-gray-800" : "text-white/60"
                  }`}
                  aria-label="Light mode"
                >
                  <svg
                    className="w-3 h-3"
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

              {/* Title */}
              <span className="text-xl font-medium">
                {title.includes("'s") ? title.split("'s")[1].trim() : title}
              </span>
            </div>
          </div>

          {/* Mobile profile */}
          <div className="flex items-center bg-gray-700 rounded-bl-full rounded-tl-full p-1 pl-3 pr-3">
            <div className="h-8 w-8 rounded-full overflow-hidden relative flex-shrink-0">
              <Image
                src="/User.png"
                alt="Profile"
                fill
                style={{ objectFit: "cover" }}
                sizes="32px"
                priority
              />
            </div>
            <span className="font-medium text-sm ml-2 whitespace-nowrap">
              Aria Michele
            </span>
          </div>
        </div>

        {/* Mobile date strip - full width */}
        <div className="w-full py-2 px-1">
          <div className="flex items-center bg-[#0F1D3C] px-1 h-[48px] rounded-lg justify-center">
            <div className="flex space-x-1 items-center">
              {generateDateStrip().map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(item.fullDate)}
                  className={`flex flex-col items-center justify-center w-[26px] h-[40px] rounded-full ${
                    item.isSelected
                      ? "bg-[#616A77]/50"
                      : "bg-transparent border border-white/20"
                  }`}
                >
                  <span className="text-[8px] font-medium text-white/80">
                    {item.day}
                  </span>
                  <div
                    className={`flex items-center justify-center w-4 h-4 mt-1 ${
                      item.isSelected ? "bg-[#DD3333] rounded-full" : ""
                    }`}
                  >
                    <span
                      className={`text-[10px] ${
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
      </div>

      {/* Side Navigation - same for both mobile and desktop */}
      {showNav && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setShowNav(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 bg-[#0a1c3f] z-30 shadow-lg p-5 overflow-y-auto">
            <button
              onClick={() => setShowNav(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mt-12">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    router.push(`/${email}${item.path}`);
                    setShowNav(false);
                  }}
                  className="block w-full text-left py-3 px-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg mb-1"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
