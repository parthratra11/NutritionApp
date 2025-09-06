"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface NavigationProps {
  title?: string;
  subtitle?: string;
  email: string;
  userName?: string; // Add userName prop
}

export default function Navigation({
  title = "Dashboard",
  subtitle,
  email,
  userName = "User", // Default fallback
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

  // Sidebar menu items updated to include User Dashboard
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
      label: "Overview",
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
            d="M4 13h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2zM4 22h6a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2zM14 13h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2zM14 22h6a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Steps",
      path: "/steps",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.5 9L18 4L13 3L12.5 5M13.5 15L14 17L19 18L20.5 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 9L5.5 4L9.5 3L10.5 6.5M10 15L9.5 17.5L5 19L3 15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 13L10 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 13L14 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Nutrition",
      path: "/nutrition",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 20H6C4.89543 20 4 19.1046 4 18V10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V18C20 19.1046 19.1046 20 18 20H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M8 8V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M9 14H15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 14L12 20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      label: "Weight",
      path: "/weight",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 5V19" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 12H18" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 9L17 15" stroke="currentColor" strokeWidth="1.5" />
          <path d="M17 9L7 15" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      label: "Sleep",
      path: "/sleep",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 4.5V6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M19.5 12H17.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 12H6.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6.3675 17.6325L7.7825 16.2175"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M16.2175 7.7825L17.6325 6.3675"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M6.3675 6.3675L7.7825 7.7825"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M16.2175 16.2175L17.6325 17.6325"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M12 19.5V17.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      label: "Mood",
      path: "/mood",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20.75 12C20.75 16.8325 16.8325 20.75 12 20.75C7.16751 20.75 3.25 16.8325 3.25 12C3.25 7.16751 7.16751 3.25 12 3.25C16.8325 3.25 20.75 7.16751 20.75 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9.5 15.5C9.5 15.5 10 17 12 17C14 17 14.5 15.5 14.5 15.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M9 10C9.27614 10 9.5 9.77614 9.5 9.5C9.5 9.22386 9.27614 9 9 9C8.72386 9 8.5 9.22386 8.5 9.5C8.5 9.77614 8.72386 10 9 10Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <path
            d="M15 10C15.2761 10 15.5 9.77614 15.5 9.5C15.5 9.22386 15.2761 9 15 9C14.7239 9 14.5 9.22386 14.5 9.5C14.5 9.77614 14.7239 10 15 10Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </svg>
      ),
    },
    {
      label: "Workout",
      path: "/workout",
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

        {/* Right: User profile with actual user name - fixed positioning to left */}
        <div className="flex items-center my-2 bg-gray-700 p-1 pr-8 lg:pr-16 rounded-bl-full rounded-tl-full w-2/5">
          <div className="flex items-center space-x-2">
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
            <span className="font-medium text-lg lg:text-xl whitespace-nowrap">
              {userName}
            </span>
          </div>
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

          {/* Mobile profile - fixed positioning */}
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
              {userName}
            </span>
          </div>
        </div>

        {/* Mobile date strip - full width */}
        <div className="w-full py-2 px-1">
          <div className="flex items-center  px-1 h-[48px] rounded-lg justify-center">
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

      {/* Side Navigation - styled exactly like the image but translucent with blur */}
      {showNav && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20"
            onClick={() => setShowNav(false)}
          />
          <div className="fixed top-0 left-0 h-full w-[240px] bg-[#0B1F35]/90 backdrop-blur-md border-r border-white/10 z-30 overflow-y-auto">
            <div className="flex justify-end p-6">
              <button
                onClick={() => setShowNav(false)}
                className="text-white/60 hover:text-white"
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
                        // Navigate to main dashboard if Dashboard is selected, otherwise to client-specific page
                        const path =
                          item.label === "Dashboard"
                            ? "/"
                            : `/${email}${item.path}`;
                        router.push(path);
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
        </>
      )}
    </div>
  );
}
