"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  console.log("Calling sendDM with channel:", channel, "Message:", text);
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
  const emailParam = searchParams.get("email");

  const [dmUsers, setDmUsers] = useState<any[]>([]);
  const [selectedDm, setSelectedDm] = useState<any | null>(null);
  const [dmHistory, setDmHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDms, setLoadingDms] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch DM users on mount
  useEffect(() => {
    setLoadingDms(true);
    setError(null);
    fetchDMUsers(emailParam)
      .then(({ channels, targetUser }) => {
        console.log("Fetched DM channels:", channels);
        setDmUsers(channels);

        // If we have a specific user to select, do so
        if (targetUser) {
          console.log("Auto-selecting user by email:", targetUser);
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
          console.log("Fetched DM history:", messages);
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
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {emailParam ? `Chat with ${emailParam}` : "Direct Messages"}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-900 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Show message if email was provided but user not found */}
      {emailParam && !selectedDm && !loadingDms && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          No Slack user found with email: {emailParam}
        </div>
      )}

      <div className="flex gap-8 h-96">
        {/* DM List */}
        <div className="w-1/3 border-r pr-4">
          <h2 className="font-semibold mb-2">Your DMs</h2>
          {loadingDms ? (
            <p className="text-gray-500">Loading DMs...</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {dmUsers.length === 0 ? (
                <li className="text-gray-500">No DMs found</li>
              ) : (
                dmUsers.map((dm) => (
                  <li
                    key={dm.id}
                    className={`p-3 rounded cursor-pointer border ${
                      selectedDm?.id === dm.id
                        ? "bg-blue-100 border-blue-300"
                        : "hover:bg-gray-100 border-gray-200"
                    }`}
                    onClick={() => handleSelectDm(dm)}
                  >
                    <div className="font-medium">
                      {dm.username || "Unknown User"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Email: {dm.email}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* DM Content */}
        <div className="flex-1 flex flex-col">
          {selectedDm ? (
            <>
              <h3 className="font-semibold mb-3 pb-2 border-b">
                Chat with {selectedDm.username || "User"}
              </h3>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto border rounded p-3 mb-4 bg-gray-50 min-h-0">
                {loadingHistory ? (
                  <p className="text-gray-500">Loading messages...</p>
                ) : dmHistory.length === 0 ? (
                  <p className="text-gray-500">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  dmHistory.map((msg, i) => (
                    <div
                      key={i}
                      className="mb-3 p-2 bg-white rounded shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-blue-600">
                          {msg.username || "Unknown"}
                        </span>
                        {msg.ts && (
                          <span className="text-xs text-gray-400">
                            {new Date(
                              parseFloat(msg.ts) * 1000
                            ).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-800">{msg.text}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading || !newMessage.trim()}
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Select a DM to start chatting</p>
                <p className="text-sm">
                  Choose a conversation from the list on the left
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading fallback component
const DMsLoading = () => (
  <div className="p-4 max-w-6xl mx-auto">
    <h1 className="text-2xl font-bold mb-4">Direct Messages</h1>
    <div className="flex gap-8 h-96">
      <div className="w-1/3 border-r pr-4">
        <h2 className="font-semibold mb-2">Your DMs</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Loading DMs...</p>
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
