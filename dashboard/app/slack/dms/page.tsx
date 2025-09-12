"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

// Helper to fetch DM users (conversations.list with types=im)
async function fetchDMUsers(email?: string | null) {
  const url = email
    ? `/api/get-dms?email=${encodeURIComponent(email)}`
    : "/api/get-dms";

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to fetch DMs");
  }
  const data = await res.json();
  return {
    channels: data.channels || [],
    targetUser: data.targetUser || null,
  };
}

// Helper to fetch DM history for a channel
async function fetchDMHistory(channel: string, retry = 0): Promise<any[]> {
  const res = await fetch(
    `/api/get-history?channel=${encodeURIComponent(channel)}`
  );
  if (!res.ok) {
    const errorData = await res.json();
    // Handle Slack rate limit error with retry logic
    if (
      (errorData.error === "ratelimited" ||
        errorData.error === "rate_limited") &&
      retry < 2
    ) {
      // Wait 2 seconds before retrying (Slack recommends 1+ second)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchDMHistory(channel, retry + 1);
    }
    if (
      errorData.error === "ratelimited" ||
      errorData.error === "rate_limited"
    ) {
      throw new Error(
        "Slack API rate limit reached. Please wait a minute and try again."
      );
    }
    throw new Error(errorData.error || "Failed to fetch DM history");
  }
  const data = await res.json();
  return data.messages || []; // Extract messages array with fallback
}

// Helper to send a DM (calls secure backend API)
async function sendDM(channel: string, text: string) {
  const res = await fetch("/api/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, text }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Failed to send message");
  }
  return data;
}

// Component that uses useSearchParams - wrapped in Suspense
const DMsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email");
  const [showNav, setShowNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [dmUsers, setDmUsers] = useState<any[]>([]);
  const [selectedDm, setSelectedDm] = useState<any | null>(null);
  const [dmHistory, setDmHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDms, setLoadingDms] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Menu items for side navigation - updated to match main page
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

  // Generate date strip similar to main page
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
        isSelected: false,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    return dates;
  };

  const dateStrip = generateDateStrip();

  // Fetch DM users on mount
  useEffect(() => {
    setLoadingDms(true);
    setError(null);
    fetchDMUsers(emailParam)
      .then(({ channels, targetUser }) => {
        setDmUsers(channels);

        // If we have a specific user to select, do so
        if (targetUser) {
          setSelectedDm(targetUser);
        }
      })
      .catch((err) => {
        console.error("Error fetching DMs:", err);
        setError(err.message);
      })
      .finally(() => setLoadingDms(false));
  }, [emailParam]);

  // Fetch DM history when a DM is selected
  useEffect(() => {
    if (selectedDm?.id) {
      setLoadingHistory(true);
      setError(null);
      fetchDMHistory(selectedDm.id)
        .then((messages) => {
          setDmHistory(messages);
        })
        .catch((err) => {
          console.error("Error fetching DM history:", err);
          setError(err.message);
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [selectedDm]);

  const handleSelectDm = (dm: any) => {
    setSelectedDm(dm);
    setDmHistory([]); // Clear previous history
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDm?.id) return;
    setLoading(true);
    setError(null);
    try {
      await sendDM(selectedDm.id, newMessage);
      setNewMessage("");
      // Debounce refresh: wait 1 second before fetching history
      setTimeout(async () => {
        try {
          const messages = await fetchDMHistory(selectedDm.id);
          setDmHistory(messages);
        } catch (err: any) {
          setError(err.message);
        }
      }, 1000);
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message);
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1F35]">
      {/* Side Navigation - updated to match main page */}
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

      {/* Overlay - updated to match main page */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          showNav ? "opacity-100 z-20" : "opacity-0 -z-10"
        }`}
        onClick={() => setShowNav(false)}
      />

      {/* Header - updated to match main page */}
      <div className="bg-[#0B1F35] text-white px-4 md:px-6 pt-4 pb-3">
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
              {/* Greeting text */}
              <div className="mr-3 lg:mr-4 lg:ml-6">
                <p className="text-lg lg:text-xl font-semibold">
                  Slack Direct Messages
                </p>
                <p className="text-xs lg:text-sm opacity-80">
                  {emailParam
                    ? `Chatting with ${emailParam}`
                    : "Private conversations"}
                </p>
              </div>
            </div>

            {/* Avatar */}
            <div className="h-12 w-12 lg:h-20 lg:w-20 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image
                src="/User.png"
                alt="Profile"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Date strip */}
          <div className="flex justify-center lg:justify-start lg:mr-12">
            <div className="flex items-center px-2 lg:px-4 h-[55px] lg:h-[65px] rounded-lg">
              <div className="flex space-x-1 lg:space-x-2 items-center">
                {dateStrip.map((item, idx) => (
                  <button
                    key={idx}
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
                        item.isToday ? "bg-[#DD3333] rounded-full" : ""
                      }`}
                    >
                      <span
                        className={`text-xs lg:text-sm ${
                          item.isToday ? "font-bold text-white" : "text-white"
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
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 mt-4">
        {/* Back to Channel Link */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/slack")}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Channel
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 text-red-300 rounded flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100"
            >
              <svg
                className="h-5 w-5"
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
          </div>
        )}

        {/* Show message if email was provided but user not found */}
        {emailParam && !selectedDm && !loadingDms && (
          <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-600 text-yellow-300 rounded flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            No Slack user found with email: {emailParam}
          </div>
        )}

        <div className="flex h-[calc(100vh-200px)] gap-6 bg-[#142437] border border-[#22364F] rounded-lg shadow-sm overflow-hidden">
          {/* DM List - Left Sidebar */}
          <div className="w-1/3 border-r border-[#22364F] bg-[#1A2C43]">
            <div className="p-4 border-b border-[#22364F]">
              <h2 className="font-semibold text-white flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-[#DD3333]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Your Direct Messages
              </h2>
            </div>

            {loadingDms ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-[#DD3333]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading DMs...
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                {dmUsers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <svg
                      className="h-10 w-10 mx-auto text-gray-500 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p>No direct messages found</p>
                  </div>
                ) : (
                  <ul>
                    {dmUsers.map((dm) => (
                      <li
                        key={dm.id}
                        className={`p-4 hover:bg-[#22364F] cursor-pointer transition-colors border-b border-[#22364F] ${
                          selectedDm?.id === dm.id
                            ? "bg-[#DD3333] text-white hover:bg-[#CC2222]"
                            : "bg-[#142437] text-gray-300"
                        }`}
                        onClick={() => handleSelectDm(dm)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                              selectedDm?.id === dm.id
                                ? "bg-white text-[#DD3333]"
                                : "bg-[#DD3333] text-white"
                            }`}
                          >
                            <span className="font-bold">
                              {dm.username
                                ? dm.username.charAt(0).toUpperCase()
                                : "U"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`font-medium ${
                                selectedDm?.id === dm.id
                                  ? "text-white"
                                  : "text-white"
                              }`}
                            >
                              {dm.username || "Unknown User"}
                            </p>
                            <p
                              className={`text-sm truncate ${
                                selectedDm?.id === dm.id
                                  ? "text-gray-200"
                                  : "text-gray-400"
                              }`}
                            >
                              {dm.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* DM Content - Right Side */}
          <div className="flex-1 flex flex-col">
            {selectedDm ? (
              <>
                <div className="p-4 border-b border-[#22364F] flex items-center bg-[#1A2C43]">
                  <div className="h-10 w-10 rounded-full bg-[#DD3333] text-white flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="font-bold">
                      {selectedDm.username
                        ? selectedDm.username.charAt(0).toUpperCase()
                        : "U"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {selectedDm.username || "User"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {selectedDm.email || ""}
                    </p>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#142437]">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-[#DD3333]"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading messages...
                    </div>
                  ) : dmHistory.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">
                      <svg
                        className="h-16 w-16 mx-auto text-gray-500 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dmHistory.map((msg, i) => {
                        const isYou =
                          msg.username === "You" || msg.user === "You";
                        return (
                          <div
                            key={i}
                            className={`flex ${
                              isYou ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-3/4 rounded-lg p-3 ${
                                isYou
                                  ? "bg-[#DD3333] text-white rounded-br-none"
                                  : "bg-[#22364F] text-gray-300 rounded-bl-none"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span
                                  className={`font-semibold ${
                                    isYou ? "text-gray-200" : "text-gray-400"
                                  }`}
                                >
                                  {msg.username || (isYou ? "You" : "Unknown")}
                                </span>
                                {msg.ts && (
                                  <span
                                    className={`text-xs ml-2 ${
                                      isYou ? "text-gray-300" : "text-gray-500"
                                    }`}
                                  >
                                    {new Date(
                                      parseFloat(msg.ts) * 1000
                                    ).toLocaleString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                              <div
                                className={
                                  isYou ? "text-white" : "text-gray-300"
                                }
                              >
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-[#22364F] bg-[#1A2C43]">
                  <div className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 p-3 bg-[#0E1F34] border border-[#22364F] text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#DD3333] focus:border-[#DD3333] placeholder-gray-400"
                      placeholder="Type a message..."
                      disabled={loading}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-3 bg-[#DD3333] text-white rounded-r-lg hover:bg-[#CC2222] disabled:bg-gray-600 disabled:cursor-not-allowed"
                      disabled={loading || !newMessage.trim()}
                    >
                      {loading ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        "Send"
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#142437]">
                <div className="text-center p-8">
                  <svg
                    className="h-16 w-16 mx-auto text-gray-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-lg font-medium text-white mb-2">
                    Select a conversation
                  </p>
                  <p className="text-gray-400">
                    Choose someone from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading fallback component - updated to match dark theme
const DMsLoading = () => (
  <div className="min-h-screen bg-[#0B1F35] p-4">
    <div className="bg-[#142437] border border-[#22364F] text-white p-4 mb-4 rounded-lg">
      <h1 className="text-xl font-bold">Direct Messages</h1>
      <p className="text-sm opacity-80">Loading...</p>
    </div>

    <div className="animate-pulse">
      <div className="h-8 bg-[#22364F] w-40 mb-4 rounded"></div>
      <div className="flex gap-8 h-96 rounded-lg bg-[#142437] border border-[#22364F]">
        <div className="w-1/3 bg-[#1A2C43]"></div>
        <div className="flex-1"></div>
      </div>
    </div>
  </div>
);

// Main component that wraps DMsContent in Suspense
const DMsPage = () => {
  return (
    <Suspense fallback={<DMsLoading />}>
      <DMsContent />
    </Suspense>
  );
};

export default DMsPage;
