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

  const [dmUsers, setDmUsers] = useState<any[]>([]);
  const [selectedDm, setSelectedDm] = useState<any | null>(null);
  const [dmHistory, setDmHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDms, setLoadingDms] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Menu items for side navigation
  const menuItems = [
    {
      label: "Dashboard",
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
    {
      label: "Slack Channel",
      path: "/slack",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
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
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      ),
    },
  ];

  // Generate date strip similar to other pages
  const generateDateStrip = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const today = new Date();
    const currentDay = today.getDay();
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

      {/* Header Bar */}
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
              <p className="font-bold text-lg">Slack Direct Messages</p>
              <p className="text-xs opacity-80">
                {emailParam
                  ? `Chatting with ${emailParam}`
                  : "Private conversations"}
              </p>
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 mt-4">
        {/* Back to Channel Link */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/slack")}
            className="flex items-center text-[#0a1c3f] hover:text-[#0b2552] transition-colors"
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
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
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
              className="text-red-700 hover:text-red-800"
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
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex items-center">
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

        <div className="flex h-[calc(100vh-200px)] gap-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* DM List - Left Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700 flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-[#0a1c3f]"
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
              <div className="flex items-center justify-center h-32 text-gray-500">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-[#0a1c3f]"
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
                      className="h-10 w-10 mx-auto text-gray-400 mb-2"
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
                        className={`p-4 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-200 ${
                          selectedDm?.id === dm.id
                            ? "bg-[#0a1c3f] text-white hover:bg-[#0b2552]"
                            : "bg-white text-gray-800"
                        }`}
                        onClick={() => handleSelectDm(dm)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                              selectedDm?.id === dm.id
                                ? "bg-white text-[#0a1c3f]"
                                : "bg-[#0a1c3f] text-white"
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
                                  : "text-gray-900"
                              }`}
                            >
                              {dm.username || "Unknown User"}
                            </p>
                            <p
                              className={`text-sm truncate ${
                                selectedDm?.id === dm.id
                                  ? "text-gray-200"
                                  : "text-gray-500"
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
                <div className="p-4 border-b border-gray-200 flex items-center bg-gray-50">
                  <div className="h-10 w-10 rounded-full bg-[#0a1c3f] text-white flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="font-bold">
                      {selectedDm.username
                        ? selectedDm.username.charAt(0).toUpperCase()
                        : "U"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedDm.username || "User"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedDm.email || ""}
                    </p>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-[#0a1c3f]"
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
                    <div className="text-center p-8 text-gray-500">
                      <svg
                        className="h-16 w-16 mx-auto text-gray-300 mb-4"
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
                                  ? "bg-[#0a1c3f] text-white rounded-br-none"
                                  : "bg-gray-100 text-gray-800 rounded-bl-none"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span
                                  className={`font-semibold ${
                                    isYou ? "text-gray-200" : "text-gray-700"
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
                                  isYou ? "text-white" : "text-gray-800"
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
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#0a1c3f] focus:border-[#0a1c3f]"
                      placeholder="Type a message..."
                      disabled={loading}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-3 bg-[#0a1c3f] text-white rounded-r-lg hover:bg-[#0b2552] disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <svg
                    className="h-16 w-16 mx-auto text-gray-300 mb-4"
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
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Select a conversation
                  </p>
                  <p className="text-gray-500">
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

// Loading fallback component
const DMsLoading = () => (
  <div className="min-h-screen bg-white p-4">
    <div className="bg-[#0a1c3f] text-white p-4 mb-4 rounded-lg">
      <h1 className="text-xl font-bold">Direct Messages</h1>
      <p className="text-sm opacity-80">Loading...</p>
    </div>

    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 w-40 mb-4 rounded"></div>
      <div className="flex gap-8 h-96 rounded-lg bg-gray-100 border border-gray-200">
        <div className="w-1/3 bg-gray-200"></div>
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
