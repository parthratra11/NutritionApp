"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || "";

const SlackPage = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const router = useRouter();

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

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/slack-messages");
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
      } else {
        console.error("Error fetching messages:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: JSON.stringify({ text: message }),
      });

      if (response.ok) {
        setMessages((prev) => [...prev, message]);
        setMessage("");
        fetchMessages();
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

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
                  Slack Channel
                </p>
                <p className="text-xs lg:text-sm opacity-80">
                  Team communication
                </p>
              </div>
            </div>

            {/* Avatar */}
            <div className="h-12 w-12 lg:h-20 lg:w-20 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image
                src="/cymron.png"
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
      <div className="max-w-4xl mx-auto p-4 md:p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Team Channel</h1>
          <button
            onClick={() => router.push("/slack/dms")}
            className="flex items-center px-4 py-2 bg-[#DD3333] text-white rounded-md hover:bg-[#CC2222] transition-colors"
          >
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Direct Messages
          </button>
        </div>

        {/* Message Input Area */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-[#0E1F34] border border-[#22364F] text-white rounded-lg focus:ring-2 focus:ring-[#DD3333] focus:border-[#DD3333] outline-none transition-all resize-none placeholder-gray-400"
              placeholder="Type your message here..."
              rows={4}
            ></textarea>
          </div>

          <div className="bg-[#1A2C43] px-4 py-3 flex justify-between items-center border-t border-[#22364F]">
            <div className="text-gray-400 text-sm">Press Enter to send</div>
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="px-6 py-2 bg-[#DD3333] text-white rounded-md hover:bg-[#CC2222] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-[#142437] border border-[#22364F] rounded-lg shadow-sm mt-6">
          <div className="p-4 border-b border-[#22364F] bg-[#1A2C43] rounded-t-lg">
            <h2 className="font-semibold text-white flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              Recent Messages
            </h2>
          </div>

          <div className="divide-y divide-[#22364F]">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <svg
                  className="h-12 w-12 mx-auto text-gray-500 mb-3"
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
                <p>No messages yet. Be the first to say something!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const time = msg.ts
                  ? new Date(parseFloat(msg.ts) * 1000).toLocaleString()
                  : "Unknown time";

                return (
                  <div key={index} className="p-4 hover:bg-[#1A2C43]/50">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-md bg-[#DD3333] text-white flex items-center justify-center mr-3 text-sm font-bold">
                        {msg.username
                          ? msg.username.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <p className="font-medium text-white mr-2">
                            {msg.username || "Unknown"}
                          </p>
                          <span className="text-xs text-gray-400">{time}</span>
                        </div>
                        <p className="text-gray-300 break-words">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlackPage;
