"use client";

import { useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useParams } from "next/navigation";
import Papa from "papaparse";

// Helper: parse date with year inference (like Python)
function parseDate(dateStr: string, prevDate: Date | null): Date | null {
  try {
    let clean = dateStr;
    if (clean.includes(", ")) clean = clean.split(", ")[1].trim();
    const [dayStr, monthStr] = clean.split(" ");
    const day = parseInt(dayStr, 10);
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = monthMap[monthStr];
    let year = 2024;
    let parsed = new Date(year, month, day);
    if (prevDate) {
      if (parsed < new Date(prevDate.getTime() - 180 * 86400000))
        parsed.setFullYear(year + 1);
      else if (parsed > new Date(prevDate.getTime() + 180 * 86400000))
        parsed.setFullYear(year - 1);
    } else if (parsed > new Date()) {
      parsed.setFullYear(year + 1);
    }
    return parsed;
  } catch {
    return null;
  }
}

// Helper: create daily entry
function createDailyEntry(date: Date, weight: string, email: string) {
  return {
    weight:
      weight && !isNaN(parseFloat(weight))
        ? parseFloat(weight).toFixed(1)
        : null,
    email,
    timestamp: date
      ? date.toISOString().split("T")[0] + "T00:00:00.000Z"
      : null,
    "Sleep Quality": { value: null, color: null },
    Mood: { value: null, color: null },
    "Hunger Level": { value: null, color: null },
  };
}

export default function UploadPage() {
  const params = useParams();
  const decodedEmail = decodeURIComponent(params.email as string);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<any>(null);

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Helper: check if a week has any meaningful data (moved here after dayNames is defined)
  function hasValidData(weekData: { [key: string]: any }): boolean {
    // Check if waist or hip measurements exist
    if (weekData.waist !== null || weekData.hip !== null) return true;

    // Check if any day has a weight value
    for (const dayKey of Object.keys(weekData)) {
      if (dayNames.includes(dayKey) && weekData[dayKey]?.weight) {
        return true;
      }
    }
    return false;
  }

  const coreColumns = [
    "Week",
    "Date",
    "Comment",
    "Macro Day",
    "Weight",
    "Average",
    "Change (%)",
    "Waist",
    "Hip",
    "Sum",
    "Compliance",
    "Hunger",
    "Meal Timing",
    "Cardio",
    "Mins/Distance",
    "Steps",
    "Mood",
    "Stress",
    "Energy",
    "Duration",
    "Sleep Quality",
    "Sleep Timing",
  ];

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStatus("No file selected.");
      return;
    }
    setIsUploading(true);
    setStatus("Processing CSV...");

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const data = result.data as string[][];
          if (data.length < 4) {
            setStatus("CSV file is too short.");
            setIsUploading(false);
            return;
          }

          // Dynamically assign column names
          const headerRow = data[3].map((col) => col.trim().replace("\n", " "));
          const numColumns = headerRow.length;
          let columns: string[] = [];
          if (numColumns > coreColumns.length) {
            columns = [
              ...coreColumns,
              ...Array(numColumns - coreColumns.length)
                .fill("")
                .map((_, i) => `Unnamed_${i}`),
            ];
          } else {
            columns = coreColumns.slice(0, numColumns);
          }

          // Build array of objects for each row, skipping first 4 rows (instructions + header)
          const rows = data.slice(4).map((row) => {
            const obj: { [key: string]: string } = {};
            columns.forEach((col, idx) => {
              obj[col] = row[idx] || "";
            });
            return obj;
          });

          // Forward fill 'Week' column
          let lastWeek = "";
          rows.forEach((row) => {
            if (row["Week"] && row["Week"].trim() !== "")
              lastWeek = row["Week"].trim();
            else row["Week"] = lastWeek;
          });

          // Filter rows with valid 'Week' and 'Date'
          const filteredRows = rows.filter((row) => row["Week"] && row["Date"]);

          // Build JSON structure
          const jsonData: { [key: string]: any } = { firstEntryDate: null };
          let prevDate: Date | null = null;
          let currentWeek: string | null = null;
          let weekData: { [key: string]: any } = {};
          let weekCount = 0;

          // Store all weeks temporarily to filter later
          const allWeeks: {
            weekNum: number;
            key: string;
            data: any;
            hasValidData: boolean;
          }[] = [];

          // Ensure weekNum is always a stringified number (not float, not padded)
          const getWeekKey = (weekNum: string) => {
            // Remove any decimals or leading zeros
            const num = parseInt(weekNum, 10);
            return `week${num}`;
          };

          for (const row of filteredRows) {
            const weekNum = row["Week"];
            const dateStr = row["Date"];
            if (!weekNum || !dateStr) continue;

            const date = parseDate(dateStr, prevDate);
            if (!date || isNaN(date.getTime())) continue;
            prevDate = date;

            const dayName = dayNames[date.getDay()];

            // Start new week if needed
            if (currentWeek !== weekNum) {
              if (currentWeek !== null && Object.keys(weekData).length > 0) {
                const weekKey = getWeekKey(currentWeek);
                const weekNumber = parseInt(currentWeek, 10);
                allWeeks.push({
                  weekNum: weekNumber,
                  key: weekKey,
                  data: { ...weekData },
                  hasValidData: hasValidData(weekData),
                });
              }
              currentWeek = weekNum;
              weekData = {
                waist:
                  row["Waist"] && !isNaN(parseFloat(row["Waist"]))
                    ? parseFloat(row["Waist"]).toFixed(1)
                    : null,
                hip:
                  row["Hip"] && !isNaN(parseFloat(row["Hip"]))
                    ? parseFloat(row["Hip"]).toFixed(1)
                    : null,
              };
            }

            // Add daily entry if weight exists
            if (row["Weight"] && !isNaN(parseFloat(row["Weight"]))) {
              weekData[dayName] = createDailyEntry(
                date,
                row["Weight"],
                decodedEmail
              );
            }

            // Set firstEntryDate
            if (
              !jsonData.firstEntryDate ||
              (date &&
                new Date(jsonData.firstEntryDate) &&
                date < new Date(jsonData.firstEntryDate))
            ) {
              jsonData.firstEntryDate = date.toISOString().split("T")[0];
            }
          }

          // Add the last week to our collection
          if (currentWeek !== null && Object.keys(weekData).length > 0) {
            const weekKey = getWeekKey(currentWeek);
            const weekNumber = parseInt(currentWeek, 10);
            allWeeks.push({
              weekNum: weekNumber,
              key: weekKey,
              data: { ...weekData },
              hasValidData: hasValidData(weekData),
            });
          }

          // Sort weeks by week number
          allWeeks.sort((a, b) => a.weekNum - b.weekNum);

          // Find the last week with valid data
          let lastValidWeekIndex = -1;
          for (let i = allWeeks.length - 1; i >= 0; i--) {
            if (allWeeks[i].hasValidData) {
              lastValidWeekIndex = i;
              break;
            }
          }

          // Add only weeks up to the last valid week
          if (lastValidWeekIndex >= 0) {
            for (let i = 0; i <= lastValidWeekIndex; i++) {
              if (allWeeks[i].hasValidData) {
                jsonData[allWeeks[i].key] = allWeeks[i].data;
                weekCount++;
              }
            }
          }

          setJsonPreview(jsonData); // Show JSON preview

          // Upload all weeks at once (no batching)
          const userDocRef = doc(db, "weeklyForms", decodedEmail.toLowerCase());
          const userDocSnap = await getDoc(userDocRef);
          let firestoreData = userDocSnap.exists() ? userDocSnap.data() : {};

          firestoreData = {
            ...firestoreData,
            ...jsonData,
          };

          await setDoc(userDocRef, firestoreData, { merge: true });

          setStatus(
            `Success! Uploaded all ${
              Object.keys(jsonData).filter((k) => k.startsWith("week")).length
            } weeks for ${decodedEmail}.`
          );
        } catch (err) {
          setStatus(
            `Error: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setStatus(`Parse error: ${error.message}`);
        setIsUploading(false);
      },
    });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Body Composition CSV</h1>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleCsvUpload}
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
        {isUploading ? "Uploading..." : "Upload CSV"}
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
      {jsonPreview && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Extracted JSON Preview:</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-96">
            {JSON.stringify(jsonPreview, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
