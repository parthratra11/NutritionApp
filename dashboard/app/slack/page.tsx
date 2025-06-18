"use client";
import React, { useState, useEffect } from "react";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || "";

const SlackPage = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Slack Messages</h1>

      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Type your message here..."
          rows={4}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Recent Messages:</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages sent yet</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="p-2 border rounded-md bg-gray-50">
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SlackPage;
