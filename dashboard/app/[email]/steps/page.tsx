"use client";

import { useState, useEffect } from "react";
import { use } from "react"; // Add React.use import
import Navigation from "@/components/shared/Navigation";

// Generate random step data in a realistic range
const generateRandomSteps = () => {
  return 6000 + Math.floor(Math.random() * 6000); // Between 6000-12000 steps
};

// Create empty data structures for initial render
const emptyStepData = [
  { date: "22.07.2025", day: "S", steps: 0 },
  { date: "23.07.2025", day: "M", steps: 0 },
  { date: "24.07.2025", day: "T", steps: 0 },
  { date: "25.07.2025", day: "W", steps: 0 },
  { date: "26.07.2025", day: "T", steps: 0 },
  { date: "27.07.2025", day: "F", steps: 0 },
  { date: "28.07.2025", day: "S", steps: 0 },
];

// Create empty extended data
const emptyExtendedData = [
  ...Array(15)
    .fill(null)
    .map((_, i) => ({
      date: `${(7 + i).toString().padStart(2, "0")}.07.2025`,
      steps: 0,
    })),
  ...emptyStepData,
];

export default function StepsPage({ params }: { params: { email: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const email = unwrappedParams.email;

  const [activeTab, setActiveTab] = useState("D"); // D, W, M, 6M, Y
  const [activeView, setActiveView] = useState("graph"); // graph, tabular
  const [stepData, setStepData] = useState(emptyStepData);
  const [extendedData, setExtendedData] = useState(emptyExtendedData);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(""); // Add state for selected date

  // Generate data on client-side only after component mount
  useEffect(() => {
    // Generate the random data
    const generatedStepData = [
      { date: "22.07.2025", day: "S", steps: generateRandomSteps() },
      { date: "23.07.2025", day: "M", steps: generateRandomSteps() },
      { date: "24.07.2025", day: "T", steps: generateRandomSteps() },
      { date: "24.07.2025", day: "W", steps: generateRandomSteps() },
      { date: "26.07.2025", day: "T", steps: generateRandomSteps() },
      { date: "27.07.2025", day: "F", steps: generateRandomSteps() },
      { date: "28.07.2025", day: "S", steps: generateRandomSteps() },
    ];

    const generatedExtendedData = [
      ...Array(15)
        .fill(null)
        .map((_, i) => ({
          date: `${(7 + i).toString().padStart(2, "0")}.07.2025`,
          steps: generateRandomSteps(),
        })),
      ...generatedStepData,
    ];

    // Update state with generated data
    setStepData(generatedStepData);
    setExtendedData(generatedExtendedData);
    // Set the most recent date as the selected date
    setSelectedDate(generatedStepData[generatedStepData.length - 1].date);
    setIsLoading(false);
  }, []);

  // Find the maximum step count to normalize graph height
  const maxSteps = Math.max(...stepData.map((item) => item.steps), 1); // Ensure non-zero max
  // Find the minimum step count for y-axis
  const minSteps = Math.min(...stepData.map((item) => item.steps));
  // Round down to nearest 1000 for clean y-axis
  const baseValue = Math.floor(minSteps / 1000) * 1000;

  // Generate y-axis values
  const generateYAxisValues = () => {
    const range = maxSteps - baseValue;
    const step = Math.ceil(range / 4 / 500) * 500; // Round to nearest 500
    const values = [];
    for (let i = 0; i <= 4; i++) {
      values.push(baseValue + i * step);
    }
    return values.reverse(); // Display from high to low
  };

  // Handle bar click to select a date
  const handleBarClick = (date: string) => {
    setSelectedDate(date);
  };

  // If loading, show a simple loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation
          title="Steps"
          subtitle="Track your daily movement"
          email={email}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading step data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        title="Steps"
        subtitle="Track your daily movement"
        email={email}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Selected Date Display */}
        {/* <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {selectedDate ? `Steps for ${selectedDate}` : "Daily Steps"}
          </h1>
        </div> */}

        {/* Tab Controls and View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["D", "W", "M", "6M", "Y"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#DD3333] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView("graph")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "graph"
                  ? "bg-[#DD3333] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Graph
            </button>
            <button
              onClick={() => setActiveView("tabular")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "tabular"
                  ? "bg-[#DD3333] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tabular
            </button>
          </div>
        </div>

        {activeView === "graph" ? (
          // Graph View
          <div className="space-y-6">
            {/* Graph Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Step Count</h2>

              {/* Y-Axis and Graph Container */}
              <div className="flex">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between pr-4 text-right text-gray-400 text-xs h-64">
                  {generateYAxisValues().map((value) => (
                    <div key={value}>{value.toLocaleString()}</div>
                  ))}
                </div>

                {/* Graph Bars */}
                <div className="flex-grow">
                  <div className="flex justify-between items-end h-64 border-b border-gray-300">
                    {stepData.map((item, index) => {
                      const isLastBar = index === stepData.length - 1;
                      const isSelected = item.date === selectedDate;
                      // Calculate height percentage based on the range from baseValue to maxSteps
                      const range = maxSteps - baseValue;
                      const heightPercentage =
                        ((item.steps - baseValue) / range) * 100;

                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center flex-1 cursor-pointer"
                          onClick={() => handleBarClick(item.date)}
                        >
                          <div
                            className={`w-8 mx-auto ${
                              isSelected ? "bg-[#DD3333]" : "bg-gray-300"
                            } rounded-t-md transition-all ${
                              isSelected
                                ? "border-t-2 border-x-2 border-[#DD3333]"
                                : ""
                            }`}
                            style={{ height: `${heightPercentage}%` }}
                          ></div>
                          <div className="mt-2 font-bold text-xs text-center">
                            {item.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step count labels below bars */}
              <div className="flex justify-between mt-4 px-10 text-xs text-gray-500">
                {stepData.map((item, index) => (
                  <div key={index} className="text-center">
                    {item.steps.toLocaleString()}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Tabular Card */}
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-base">Tabular</h3>
                <button
                  onClick={() => setActiveView("tabular")}
                  className="text-blue-500 text-sm"
                >
                  More
                </button>
              </div>

              <div className="space-y-2">
                {stepData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2 px-3 ${
                      item.date === selectedDate
                        ? "bg-red-50 border border-red-200"
                        : "bg-white"
                    } rounded-lg cursor-pointer`}
                    onClick={() => handleBarClick(item.date)}
                  >
                    <span className="text-sm">{item.date}</span>
                    <span className="text-sm font-medium">
                      {item.steps.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Tabular View
          <div className="bg-[#F5F5F5] rounded-xl p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl">Steps Data</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl">
              {/* Table Header */}
              <div className="flex justify-between bg-[#E0E0E0] px-4 py-3 rounded-t-xl font-bold text-sm">
                <div>Date</div>
                <div>Steps</div>
              </div>

              {/* Table Body */}
              <div className="max-h-[500px] overflow-y-auto">
                {extendedData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between px-4 py-3 text-sm ${
                      item.date === selectedDate
                        ? "bg-red-50"
                        : index % 2 === 0
                        ? "bg-[#F5F5F5]"
                        : "bg-white"
                    } cursor-pointer`}
                    onClick={() => handleBarClick(item.date)}
                  >
                    <div>{item.date}</div>
                    <div>{item.steps.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
