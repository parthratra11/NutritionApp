"use client";

import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

interface IntakeForm {
  fullName: string;
  email: string;
  age: string;
  weight: string;
  height: string;
  goals: string;
  profile?: string; // Add profile field
  timestamp: {
    toDate: () => Date;
  };
}

export default function ClientOverview() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userName, setUserName] = useState<string>("Aria Michele");
  const [showNav, setShowNav] = useState(false);

  // Side menu items
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
  const dateStrip = generateDateStrip();

  // Add this function to format today's date
  const formatTodaysDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString("default", { month: "short" });

    // Add suffix to day number (1st, 2nd, 3rd, etc.)
    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
        ? "rd"
        : "th";

    return `${day}${suffix} ${month}`;
  };

  useEffect(() => {
    const fetchClientData = async () => {
      if (!params?.email) return;

      try {
        const decodedEmail = decodeURIComponent(params.email as string);
        const clientDocRef = doc(db, "intakeForms", decodedEmail);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          const clientData = clientDocSnap.data() as IntakeForm;
          setClient(clientData);
          setUserName(clientData.fullName || "Aria Michele");
        } else {
          setError("Client not found");
        }
      } catch (err) {
        setError("Failed to fetch client data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [params?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07172C] text-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07172C] text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-2 relative">
        {/* Left Panel Area - full width minus right panel */}
        <div className="flex items-center w-full pr-[510px]">
          {/* Left side - hamburger and theme toggle */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowNav(!showNav)}
              className="text-white p-2 hover:cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Theme Toggle Pill */}
            <div className="flex items-center bg-[#0F1D3C] border border-white/10 rounded-full px-1 lg:px-1.5">
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
          </div>
        </div>

        {/* Date strip - absolutely positioned at the right edge of left panel */}
        <div className="absolute right-[510px] top-1/2 transform -translate-y-1/2">
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

        {/* Right Panel Space */}
        <div className="w-[500px]">
          {/* This space is intentionally left empty to maintain layout */}
        </div>
      </div>

      {/* Main Content with Right Panel */}
      <div className="px-6 pb-3 pr-[510px]">
        {/* Cards Grid */}
        <div className="grid grid-cols-12 gap-3 h-[calc(100vh-70px)] overflow-hidden">
          {/* Sleep Card */}
          <div
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-2.5 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/sleep`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              Sleep
              <svg
                className="w-3 h-3 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="absolute top-2.5 right-2.5 text-[10px] text-gray-400">
              {formatTodaysDate()}
            </div>

            <div className="flex justify-between mt-1.5 w-full h-full items-center">
              {/* Sleep Hours - Left Side */}
              <div>
                <div className="flex items-end">
                  <span className="text-3xl leading-none font-semibold">6</span>
                  <span className="text-xs mb-1 ml-1">hr</span>
                  <span className="text-3xl leading-none font-semibold ml-1">
                    42
                  </span>
                  <span className="text-xs mb-1 ml-1">min</span>
                </div>
                <div className="text-[9px] text-gray-400 mt-1">Sleep Hours</div>
              </div>

              {/* Sleep Quality - Right Side */}
              <div className="text-right">
                <div className="text-xl font-semibold">Restful</div>
                <div className="text-[9px] text-gray-400">Sleep Quality</div>
              </div>
            </div>
          </div>

          {/* Weight Card */}
          <div
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-2.5 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/weight`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2"
                />
              </svg>
              Weight
              <svg
                className="w-3 h-3 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="absolute top-2.5 right-2.5 text-[10px] text-gray-400">
              {formatTodaysDate()}
            </div>

            <div className="mt-2 flex w-full h-full items-center">
              <span className="text-3xl leading-none font-semibold">74.2</span>
              <span className="text-xs mb-1 ml-1">Kg</span>
            </div>
          </div>

          {/* Nutrition Card */}
          <div
            className="col-span-12 bg-[#FFFFFF1A]  backdrop-blur-xl rounded-xl p-4 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/nutrition`)}
          >
            <div className="flex items-center gap-2 font-semibold text-base">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 10h16M4 14h8M12 18h8"
                />
              </svg>
              Nutrition
              <svg
                className="w-4 h-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="absolute top-4 right-4 text-sm text-gray-400">
              {formatTodaysDate()}
            </div>

            <div className="grid grid-cols-4 gap-4 mt-2 w-full h-full items-center">
              {/* Protein */}
              <div>
                <div className="text-4xl font-semibold mb-1">
                  150.0
                  <span className="text-base ml-1 font-normal text-gray-400">
                    g
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1">165.0g</div>
                <div className="h-1 w-3/4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: "91%" }}
                  ></div>
                </div>
                <div className="flex justify-between w-3/4 text-xs mt-1">
                  <span>Protein</span>
                  <span className="text-gray-400">91%</span>
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="text-4xl font-semibold mb-1">
                  80.0
                  <span className="text-base ml-1 font-normal text-gray-400">
                    g
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1">73.0g</div>
                <div className="h-1 w-3/4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: "110%" }}
                  ></div>
                </div>
                <div className="flex justify-between w-3/4 text-xs mt-1">
                  <span>Fat</span>
                  <span className="text-gray-400">110%</span>
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="text-4xl font-semibold mb-1">
                  195.0
                  <span className="text-base ml-1 font-normal text-gray-400">
                    g
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1">220.0g</div>
                <div className="h-1 w-3/4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: "89%" }}
                  ></div>
                </div>
                <div className="flex justify-between w-3/4 text-xs mt-1">
                  <span>Carbs</span>
                  <span className="text-gray-400">89%</span>
                </div>
              </div>

              {/* Calories */}
              <div>
                <div className="text-4xl font-semibold mb-1">
                  2,150
                  <span className="text-base ml-1 font-normal text-gray-400">
                    Kcal
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1">&nbsp;</div>
                <div className="h-1 w-3/4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: "98%" }}
                  ></div>
                </div>
                <div className="flex justify-between w-3/4 text-xs mt-1">
                  <span>Calories</span>
                  <span className="text-gray-400">98%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Steps Card */}
          <div
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/steps`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              Steps
              <svg
                className="w-3 h-3 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="absolute top-3 right-3 text-[10px] text-gray-400">
              {formatTodaysDate()}
            </div>

            <div className="mt-2 flex w-full h-full items-center">
              <div className="text-3xl font-semibold">5,000</div>
              <div className="text-[10px] text-gray-400 mt-1">10,000 Steps</div>
            </div>
          </div>

          {/* Moods Card */}
          <div
            className="col-span-6 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/mood`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Moods
              <svg
                className="w-3 h-3 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="absolute top-3 right-3 text-[10px] text-gray-400">
              {formatTodaysDate()}
            </div>

            <div className="mt-2 flex w-full h-full items-center">
              <div className="w-12 h-12 rounded-lg bg-[#BFD8E9] flex items-center justify-center mr-4">
                <svg
                  className="w-8 h-8 text-[#07172C]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-8a3 3 0 11-6 0h6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xl font-semibold">Calm</div>
                <div className="text-[10px] text-gray-400">16:28pm</div>
              </div>
            </div>
          </div>

          {/* Exercises Card */}
          <div
            className="col-span-12 bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 relative cursor-pointer shadow-[-2px_6px_22.6px_-3px_#00000040]"
            onClick={() => router.push(`/${params.email}/workout`)}
          >
            <div className="flex items-center gap-1 font-semibold text-sm mb-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
              Exercises
              <svg
                className="w-3 h-3 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <ul className="text-xs space-y-1 pt-2">
              <li>Barbell Hip Thrust</li>
              <li>Heels Elevated Zercher Squat</li>
              <li>Scrape Rack L-Seated Shoulder Press</li>
              <li>Seated DB Lateral Raise</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="fixed top-0 right-0 h-full w-[500px] bg-[#FFFFFF1A] border-l border-[#1F3247] pt-4 px-5 overflow-y-auto shadow-[-2px_6px_22.6px_-3px_#00000040]">
        {/* User Profile - Top of Panel */}
        <div className="mb-5">
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl px-4 py-3.5 shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="flex items-center gap-3">
              <img
                src={client?.profile || "/User.png"}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#0E1F34]"
              />
              <div className="flex flex-col">
                <div className="flex items-center text-lg font-semibold">
                  {userName}
                  <svg
                    className="w-4 h-4 ml-1 rotate-270"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex items-center text-xs text-gray-300 mt-1">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  New Delhi, India
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-5">
          <div className="text-sm font-medium mb-2">Payment Status</div>
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-4 shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="flex items-center justify-between">
              <span className="text-green-500 font-semibold text-xl">Paid</span>
              <div className="text-right">
                <div className="text-xs text-gray-400">Expires on</div>
                <div className="text-sm text-white font-medium">
                  31st Nov 2025
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anthropometric Data */}
        <div className="mb-2 mt-12">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Anthropometric Data
          </div>

          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-4 flex justify-between shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl font-semibold">
                57<span className="text-[10px] ml-0.5 font-normal">kg</span>
              </div>
              <div className="text-xs text-gray-400">Weight</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl font-semibold">
                167
                <span className="text-[10px] ml-0.5 font-normal text-gray-400">
                  cm
                </span>
              </div>
              <div className="text-xs text-gray-400">Height</div>
            </div>
            <div className="flex flex-col items-center flex-1">
              <div className="text-2xl font-semibold">29</div>
              <div className="text-xs text-gray-400">Age</div>
            </div>
          </div>
        </div>

        {/* Body Metrics */}
        {/* <div className="text-xs text-gray-400 mb-2">20 July</div> */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 py-8 flex flex-col items-center shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="text-xl font-semibold">
              23<span className="text-[10px] ml-0.5 font-normal">%</span>
            </div>
            <div className="text-xs text-gray-400">
              Body Fat ({formatTodaysDate()})
            </div>
          </div>
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 py-8 flex flex-col items-center shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="text-xl font-semibold">
              96.5<span className="text-[10px] ml-0.5 font-normal">cm</span>
            </div>
            <div className="text-xs text-gray-400 text-center">
              Hip Circumference
            </div>
          </div>
          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-3 py-8 flex flex-col items-center shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <div className="text-xl font-semibold">
              71<span className="text-[10px] ml-0.5 font-normal">cm</span>
            </div>
            <div className="text-xs text-gray-400 text-center">
              Waist Circumference
            </div>
          </div>
        </div>

        {/* Goals */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-2 mt-12">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Goals
          </div>

          <div className="bg-[#FFFFFF1A] backdrop-blur-xl rounded-xl p-4 shadow-[-2px_6px_22.6px_-3px_#00000040]">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>I want to lose body fat and tone up.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>I want to improve my stamina and endurance.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>I want to create a consistent workout routine.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Side Navigation - styled exactly like Navigation component */}
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
                            : `/${params.email}${item.path}`;
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
