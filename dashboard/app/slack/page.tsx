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
  const router = useRouter();

  // Menu items for side navigation - similar to homepage
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
              <p className="font-bold text-lg">Slack Channel</p>
              <p className="text-xs opacity-80">Team communication</p>
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
      <div className="max-w-4xl mx-auto p-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Team Channel</h1>
          <button
            onClick={() => router.push("/slack/dms")}
            className="flex items-center px-4 py-2 bg-[#0a1c3f] text-white rounded-md hover:bg-[#0b2552] transition-colors"
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a1c3f] focus:border-[#0a1c3f] outline-none transition-all resize-none"
              placeholder="Type your message here..."
              rows={4}
            ></textarea>
          </div>

          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
            <div className="text-gray-400 text-sm">Press Enter to send</div>
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="px-6 py-2 bg-[#0a1c3f] text-white rounded-md hover:bg-[#0b2552] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h2 className="font-semibold text-gray-700 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-green-600"
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

          <div className="divide-y divide-gray-100">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg
                  className="h-12 w-12 mx-auto text-gray-400 mb-3"
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
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-md bg-[#0a1c3f] text-white flex items-center justify-center mr-3 text-sm font-bold">
                        {msg.username
                          ? msg.username.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <p className="font-medium text-gray-900 mr-2">
                            {msg.username || "Unknown"}
                          </p>
                          <span className="text-xs text-gray-500">{time}</span>
                        </div>
                        <p className="text-gray-800 break-words">{msg.text}</p>
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
