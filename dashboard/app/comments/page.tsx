"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
} from "@firebase/firestore";

interface Comment {
  id: string;
  userEmail: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  sender: "client" | "cymron";
  urgent: boolean;
  userName?: string;
}

const CommentsContent = () => {
  const router = useRouter();
  const [showNav, setShowNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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
      label: "Comments",
      path: "/comments",
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

  const generateDateStrip = () => {
    const days = ["S", "M", "T", "W", "Th", "F", "S"];
    const today = new Date();

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

  useEffect(() => {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();

          // Fetch user name from intakeForms
          let userName = "Unknown User";
          try {
            const intakeRef = collection(db, "intakeForms");
            const intakeQuery = query(
              intakeRef,
              where("email", "==", data.userEmail)
            );
            const intakeSnapshot = await getDocs(intakeQuery);

            if (!intakeSnapshot.empty) {
              userName = intakeSnapshot.docs[0].data().fullName;
            }
          } catch (error) {
            console.error("Error fetching user name:", error);
          }

          return {
            id: docSnapshot.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            userName,
          } as Comment;
        })
      );

      setComments(commentsData);

      // Count unread messages
      const unread = commentsData.filter(
        (c) => !c.isRead && c.sender === "client"
      ).length;
      setUnreadCount(unread);

      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const userCommentsFiltered = comments.filter(
        (c) => c.userEmail === selectedUser
      );
      setUserComments(userCommentsFiltered);

      // Mark user's messages as read
      userCommentsFiltered.forEach(async (comment) => {
        if (!comment.isRead && comment.sender === "client") {
          try {
            await updateDoc(doc(db, "comments", comment.id), { isRead: true });
          } catch (error) {
            console.error("Error marking comment as read:", error);
          }
        }
      });
    }
  }, [selectedUser, comments]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "comments"), {
        userEmail: selectedUser,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        isRead: true,
        sender: "cymron",
        urgent: false,
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group comments by user
  const groupedComments = comments.reduce((acc, comment) => {
    if (!acc[comment.userEmail]) {
      acc[comment.userEmail] = {
        userEmail: comment.userEmail,
        userName: comment.userName || "Unknown User",
        lastMessage: comment.message,
        lastTimestamp: comment.timestamp,
        unreadCount: 0,
        hasUrgent: false,
      };
    }

    if (!comment.isRead && comment.sender === "client") {
      acc[comment.userEmail].unreadCount++;
    }

    if (comment.urgent && comment.sender === "client") {
      acc[comment.userEmail].hasUrgent = true;
    }

    if (comment.timestamp > acc[comment.userEmail].lastTimestamp) {
      acc[comment.userEmail].lastMessage = comment.message;
      acc[comment.userEmail].lastTimestamp = comment.timestamp;
    }

    return acc;
  }, {} as Record<string, any>);

  const usersList = Object.values(groupedComments).sort(
    (a: any, b: any) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime()
  );

  return (
    <div className="min-h-screen bg-[#0B1F35]">
      {/* Side Navigation */}
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

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          showNav ? "opacity-100 z-20" : "opacity-0 -z-10"
        }`}
        onClick={() => setShowNav(false)}
      />

      {/* Header */}
      <div className="bg-[#0B1F35] text-white px-4 md:px-6 pt-4 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-b-gray-500/50 pb-4">
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

              <div className="mr-3 lg:mr-4 lg:ml-6">
                <p className="text-lg lg:text-xl font-semibold">
                  Urgent Comments
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-[#DD3333] text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </p>
                <p className="text-xs lg:text-sm opacity-80">
                  Respond to client messages
                </p>
              </div>
            </div>

            <div className="h-12 w-12 lg:h-20 lg:w-20 rounded-full overflow-hidden flex-shrink-0 relative">
              <Image
                src="/cymron.png"
                alt="Profile"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

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
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-4">
          <button
            onClick={() => router.push("/")}
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
            Back to Dashboard
          </button>
        </div>

        <div className="flex h-[calc(100vh-200px)] gap-6 bg-[#142437] border border-[#22364F] rounded-lg shadow-sm overflow-hidden">
          {/* Users List - Left Sidebar */}
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
                Client Messages
              </h2>
            </div>

            {loadingComments ? (
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
                Loading comments...
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                {usersList.length === 0 ? (
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
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <ul>
                    {usersList.map((user: any) => (
                      <li
                        key={user.userEmail}
                        className={`p-4 hover:bg-[#22364F] cursor-pointer transition-colors border-b border-[#22364F] ${
                          selectedUser === user.userEmail
                            ? "bg-[#DD3333] text-white hover:bg-[#CC2222]"
                            : "bg-[#142437] text-gray-300"
                        }`}
                        onClick={() => setSelectedUser(user.userEmail)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                              selectedUser === user.userEmail
                                ? "bg-white text-[#DD3333]"
                                : user.hasUrgent
                                ? "bg-[#DD3333] text-white"
                                : "bg-[#4CAF50] text-white"
                            }`}
                          >
                            <span className="font-bold">
                              {user.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className={`font-medium truncate ${
                                  selectedUser === user.userEmail
                                    ? "text-white"
                                    : "text-white"
                                }`}
                              >
                                {user.userName}
                              </p>
                              {user.unreadCount > 0 && (
                                <span className="bg-[#DD3333] text-white text-xs px-2 py-1 rounded-full ml-2">
                                  {user.unreadCount}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm truncate ${
                                selectedUser === user.userEmail
                                  ? "text-gray-200"
                                  : "text-gray-400"
                              }`}
                            >
                              {user.lastMessage}
                            </p>
                            <p
                              className={`text-xs ${
                                selectedUser === user.userEmail
                                  ? "text-gray-300"
                                  : "text-gray-500"
                              }`}
                            >
                              {user.lastTimestamp.toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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

          {/* Chat Content - Right Side */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-[#22364F] flex items-center bg-[#1A2C43]">
                  <div className="h-10 w-10 rounded-full bg-[#DD3333] text-white flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="font-bold">
                      {usersList
                        .find((u: any) => u.userEmail === selectedUser)
                        ?.userName?.charAt(0)
                        .toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {usersList.find((u: any) => u.userEmail === selectedUser)
                        ?.userName || "User"}
                    </h3>
                    <p className="text-xs text-gray-400">{selectedUser}</p>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#142437]">
                  {userComments.length === 0 ? (
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
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userComments.map((comment) => {
                        const isClient = comment.sender === "client";
                        return (
                          <div
                            key={comment.id}
                            className={`flex ${
                              isClient ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-3/4 rounded-lg p-3 ${
                                isClient
                                  ? comment.urgent
                                    ? "bg-[#DD3333] text-white rounded-bl-none"
                                    : "bg-[#22364F] text-gray-300 rounded-bl-none"
                                  : "bg-[#4CAF50] text-white rounded-br-none"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span
                                  className={`font-semibold ${
                                    isClient ? "text-gray-200" : "text-gray-200"
                                  }`}
                                >
                                  {isClient
                                    ? comment.userName || "Client"
                                    : "Cymron"}
                                  {comment.urgent && isClient && (
                                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
                                      URGENT
                                    </span>
                                  )}
                                </span>
                                {comment.timestamp && (
                                  <span
                                    className={`text-xs ml-2 ${
                                      isClient
                                        ? "text-gray-300"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {comment.timestamp.toLocaleString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>
                              <div
                                className={
                                  isClient ? "text-white" : "text-white"
                                }
                              >
                                {comment.message}
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
                      className="flex-1 p-3 bg-[#0E1F34] border border-[#22364F] text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] placeholder-gray-400"
                      placeholder="Type your response..."
                      disabled={loading}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-3 bg-[#4CAF50] text-white rounded-r-lg hover:bg-[#45A049] disabled:bg-gray-600 disabled:cursor-not-allowed"
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
                    Choose a client from the list to view their messages
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

const CommentsLoading = () => (
  <div className="min-h-screen bg-[#0B1F35] p-4">
    <div className="bg-[#142437] border border-[#22364F] text-white p-4 mb-4 rounded-lg">
      <h1 className="text-xl font-bold">Comments Management</h1>
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

const CommentsPage = () => {
  return (
    <Suspense fallback={<CommentsLoading />}>
      <CommentsContent />
    </Suspense>
  );
};

export default CommentsPage;
