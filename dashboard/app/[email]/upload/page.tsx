"use client";

import { useRef, useState } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { useParams } from "next/navigation";

export default function UploadPage() {
  const params = useParams();
  const decodedEmail = decodeURIComponent(params.email as string);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Helper to determine if a new week should start
  const shouldStartNewWeek = (currentWeekData: any, currentDay: string) => {
    if (currentDay === "Monday") return true;
    return currentWeekData && currentWeekData["Sunday"];
  };

  // Helper to get color tag for a value
  const getTag = (value: number | null) => {
    if (value === null) return null;
    if (value <= 2) return "red";
    if (value === 3) return "amber";
    if (value >= 4) return "green";
    return null;
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStatus("No file selected.");
      return;
    }

    setIsUploading(true);
    setStatus("Processing JSON...");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          if (!jsonData || Object.keys(jsonData).length === 0) {
            setStatus("JSON is empty or invalid.");
            setIsUploading(false);
            return;
          }

          const userDocRef = doc(db, "weeklyForms", decodedEmail.toLowerCase());
          const userDocSnap = await getDoc(userDocRef);
          let data = userDocSnap.exists() ? userDocSnap.data() : {};
          let existingWeekKeys = userDocSnap.exists()
            ? Object.keys(data).filter((k) => k.startsWith("week"))
            : [];
          let maxWeekNum =
            existingWeekKeys.length > 0
              ? Math.max(
                  ...existingWeekKeys.map((k) =>
                    parseInt(k.replace("week", ""))
                  )
                )
              : 0;

          // Set firstEntryDate if not already set
          if (!data.firstEntryDate && jsonData.firstEntryDate) {
            data.firstEntryDate = jsonData.firstEntryDate;
          }

          // Process each week in the JSON
          for (const weekKey of Object.keys(jsonData).filter((k) =>
            k.startsWith("week")
          )) {
            const weekData = jsonData[weekKey];
            let targetWeekNum = parseInt(weekKey.replace("week", ""));
            let targetWeekKey = `week${targetWeekNum}`;

            // Check if we should start a new week based on existing Firestore data
            if (
              existingWeekKeys.length > 0 &&
              shouldStartNewWeek(data[`week${maxWeekNum}`], "Monday")
            ) {
              targetWeekNum = maxWeekNum + 1;
              targetWeekKey = `week${targetWeekNum}`;
            }

            // Prepare week data
            const updateWeek: any = {};
            let hasWaistHip = false;

            // Check if waist and hip are already set for the target week
            if (
              data[targetWeekKey] &&
              data[targetWeekKey].waist &&
              data[targetWeekKey].hip
            ) {
              hasWaistHip = true;
            }

            // Add waist and hip only if not already set
            if (!hasWaistHip && weekData.waist && weekData.hip) {
              updateWeek.waist = weekData.waist;
              updateWeek.hip = weekData.hip;
            }

            // Process each day in the week
            for (const day of dayNames) {
              if (weekData[day]) {
                const dayData = weekData[day];

                // Skip if the day already exists in Firestore
                if (data[targetWeekKey] && data[targetWeekKey][day]) {
                  setStatus(
                    `Skipped ${day} in ${weekKey}: Already exists in Firestore.`
                  );
                  continue;
                }

                updateWeek[day] = {
                  weight: dayData.weight,
                  email: decodedEmail,
                  timestamp: dayData.timestamp,
                  "Sleep Quality": {
                    value: dayData["Sleep Quality"]?.value || null,
                    color: getTag(dayData["Sleep Quality"]?.value),
                  },
                  Mood: {
                    value: dayData.Mood?.value || null,
                    color: getTag(dayData.Mood?.value),
                  },
                  "Hunger Level": {
                    value: dayData["Hunger Level"]?.value || null,
                    color: getTag(dayData["Hunger Level"]?.value),
                  },
                };
              }
            }

            // Update Firestore with the new week data
            if (Object.keys(updateWeek).length > 0) {
              data[targetWeekKey] = { ...data[targetWeekKey], ...updateWeek };
            }
          }

          // Save to Firestore
          await setDoc(userDocRef, data, { merge: true });
          setStatus(
            `Success! Processed ${
              Object.keys(jsonData).filter((k) => k.startsWith("week")).length
            } weeks for ${decodedEmail}.`
          );
        } catch (err) {
          setStatus(
            `Error processing JSON: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setStatus("Error reading file.");
        setIsUploading(false);
      };
      reader.readAsText(file);
    } catch (err) {
      setStatus(
        `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Body Composition JSON</h1>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        className="hidden"
        onChange={handleJsonUpload}
        disabled={isUploading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`w-full py-2 rounded ${
          isUploading
            ? "bg-gray-400"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isUploading ? "Uploading..." : "Upload JSON"}
      </button>
      {status && (
        <p
          className={`mt-4 p-2 rounded ${
            status.includes("Success") ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}
