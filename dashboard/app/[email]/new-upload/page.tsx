"use client";

import { useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useParams } from "next/navigation";
import Papa from "papaparse";
import Navigation from "@/components/shared/Navigation";

// Replace the getDayNameForDate function with this UTC-safe version:
function getDayNameForDate(date: Date): string {
  // Force UTC to avoid timezone issues
  const utcDay = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).getUTCDay();

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  console.log(
    `Original date: ${date.toISOString()}, UTC day index: ${utcDay}, Day name: ${
      dayNames[utcDay]
    }`
  );
  return dayNames[utcDay];
}

// Modify the parseDate function to avoid timezone issues
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

    // Create a UTC date to avoid timezone issues
    let parsed = new Date(Date.UTC(year, month, day, 0, 0, 0));

    // Year inference logic
    if (prevDate) {
      if (parsed < new Date(prevDate.getTime() - 180 * 86400000))
        parsed = new Date(Date.UTC(year + 1, month, day, 0, 0, 0));
      else if (parsed > new Date(prevDate.getTime() + 180 * 86400000))
        parsed = new Date(Date.UTC(year - 1, month, day, 0, 0, 0));
    } else if (parsed > new Date()) {
      parsed = new Date(Date.UTC(year - 1, month, day, 0, 0, 0));
    }

    return parsed;
  } catch {
    return null;
  }
}

// Update the createDailyEntry function to use UTC dates
function createDailyEntry(date: Date, weight: string, email: string) {
  // Create a UTC timestamp without time component
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

  const timestamp = utcDate.toISOString().split("T")[0] + "T00:00:00.000Z";
  console.log(
    `Creating entry for date: ${date.toISOString()}, using timestamp: ${timestamp}`
  );

  return {
    weight:
      weight && !isNaN(parseFloat(weight))
        ? parseFloat(weight).toFixed(1)
        : null,
    email,
    timestamp,
    "Sleep Quality": { value: null, color: null },
    Mood: { value: null, color: null },
    "Hunger Level": { value: null, color: null },
  };
}

export default function UploadPage() {
  const params = useParams();
  const email = params.email as string;
  const decodedEmail = decodeURIComponent(email);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<any>(null);
  const [selectedDataType, setSelectedDataType] = useState<string>("bodyComp");
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Changed this array to match the ordering used in WeeklyForm.tsx
  // Note: WeeklyForm.tsx uses ['Sunday', 'Monday', ...] but the app logic expects Monday as first
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
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

  const dataTypes = [
    {
      id: "bodyComp",
      name: "Body Composition",
      collection: "weeklyForms",
      enabled: true,
    },
    {
      id: "intakeForm",
      name: "Intake Form",
      collection: "intakeForms",
      enabled: false,
    },
    {
      id: "workout",
      name: "Workout Data",
      collection: "Workout",
      enabled: false,
    },
    {
      id: "nutrition",
      name: "Nutrition Plan",
      collection: "Nutrition",
      enabled: false,
    },
  ];

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setStatus("No file selected.");
      return;
    }
    setIsUploading(true);
    setStatus("Processing CSV...");
    setShowPreview(false);

    // Show an error for unsupported data types
    const selectedType = dataTypes.find((type) => type.id === selectedDataType);
    if (!selectedType?.enabled) {
      setTimeout(() => {
        setStatus(
          `Upload for ${
            selectedType?.name || selectedDataType
          } is not yet supported.`
        );
        setIsUploading(false);
      }, 1500);
      return;
    }

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

            // Debug the original date string and parsed date
            console.log(`Original date string: "${dateStr}"`);
            console.log(`Parsed date: ${date.toISOString()}`);

            // Get the correct day name based on the date
            const dayName = getDayNameForDate(date);

            // Additional log to show the date calculation
            const testDate = new Date(date);
            console.log(
              `Date: ${testDate.toDateString()}, getDay(): ${testDate.getDay()}, dayName: ${dayName}`
            );

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
              // Create a simple verification process to show the day alignment
              const verificationDate = new Date(date.getTime());
              const verificationDay = getDayNameForDate(verificationDate);

              console.log(
                `
      =================================
      CSV DATE: ${dateStr}
      PARSED DATE: ${date.toISOString()}
      DAY OF WEEK: ${verificationDay}
      ADDING TO: ${dayName}
      =================================
    `
              );

              weekData[dayName] = createDailyEntry(
                date,
                row["Weight"],
                decodedEmail
              );
            }

            // Set firstEntryDate with time set to midnight
            if (
              !jsonData.firstEntryDate ||
              (date &&
                new Date(jsonData.firstEntryDate) &&
                date < new Date(jsonData.firstEntryDate))
            ) {
              const midnight = new Date(date);
              midnight.setHours(0, 0, 0, 0);
              jsonData.firstEntryDate = midnight.toISOString().split("T")[0];
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
          setShowPreview(true);

          // Upload all weeks at once (no batching)
          const userDocRef = doc(
            db,
            selectedType.collection,
            decodedEmail.toLowerCase()
          );
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
    <div className="min-h-screen bg-gray-50">
      <Navigation
        title="Data Upload"
        subtitle="Import client data from CSV"
        email={email}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Select Data Type
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {dataTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedDataType(type.id)}
                className={`px-4 py-4 rounded-lg border transition-all flex flex-col items-center justify-center h-24
                  ${
                    selectedDataType === type.id
                      ? "bg-[#0a1c3f] text-white border-[#0a1c3f] shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }
                  ${!type.enabled && "opacity-60 cursor-not-allowed"}
                `}
              >
                <div className="text-lg font-medium">{type.name}</div>
                {!type.enabled && (
                  <div className="text-xs mt-1 italic">Coming soon</div>
                )}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-700">
              Upload{" "}
              {dataTypes.find((t) => t.id === selectedDataType)?.name || "Data"}
            </h3>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-full">
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
                  className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2
                    ${
                      isUploading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-[#0a1c3f] text-white hover:bg-[#0b2552]"
                    }
                  `}
                >
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span>Select CSV File to Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {status && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  status.includes("Success")
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {status.includes("Success") ? (
                      <svg
                        className="h-5 w-5 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-500"
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
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{status}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {jsonPreview && showPreview && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">Data Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Hide Preview
                </button>
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto max-h-96 border border-gray-100">
                {JSON.stringify(jsonPreview, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
