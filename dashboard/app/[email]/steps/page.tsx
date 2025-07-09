"use client";

import { useState, useEffect } from "react";
import { use } from "react";
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

// Dummy data generators for each view
const generateWeeklyData = () =>
  Array(7)
    .fill(null)
    .map((_, i) => ({
      label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
      steps: 7000 + Math.floor(Math.random() * 5000),
    }));

const generateMonthlyData = () =>
  Array(4)
    .fill(null)
    .map((_, i) => ({
      label: `W${i + 1}`,
      steps: 8000 + Math.floor(Math.random() * 4000),
    }));

const generate6MData = () =>
  Array(6)
    .fill(null)
    .map((_, i) => ({
      label: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][i],
      steps: 8500 + Math.floor(Math.random() * 3500),
    }));

const generateYearlyData = () =>
  Array(12)
    .fill(null)
    .map((_, i) => ({
      label: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][i],
      steps: 9000 + Math.floor(Math.random() * 3000),
    }));

export default function StepsPage({ params }) {
  const unwrappedParams = use(params);
  const email = unwrappedParams.email;

  const [activeTab, setActiveTab] = useState("D"); // D, W, M, 6M, Y
  const [activeView, setActiveView] = useState("graph"); // graph, tabular
  const [stepData, setStepData] = useState(emptyStepData);
  const [extendedData, setExtendedData] = useState(emptyExtendedData);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  // State for each view's data
  const [weeklyData, setWeeklyData] = useState(generateWeeklyData());
  const [monthlyData, setMonthlyData] = useState(generateMonthlyData());
  const [sixMData, setSixMData] = useState(generate6MData());
  const [yearlyData, setYearlyData] = useState(generateYearlyData());

  useEffect(() => {
    const generatedStepData = [
      { date: "22.07.2025", day: "S", steps: generateRandomSteps() },
      { date: "23.07.2025", day: "M", steps: generateRandomSteps() },
      { date: "24.07.2025", day: "T", steps: generateRandomSteps() },
      { date: "25.07.2025", day: "W", steps: generateRandomSteps() },
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

    setStepData(generatedStepData);
    setExtendedData(generatedExtendedData);
    setSelectedDate(generatedStepData[generatedStepData.length - 1].date);
    setIsLoading(false);
  }, []);

  // Helper to get current graph data and axis labels
  const getGraphData = () => {
    switch (activeTab) {
      case "W":
        return weeklyData;
      case "M":
        return monthlyData;
      case "6M":
        return sixMData;
      case "Y":
        return yearlyData;
      default:
        // "D" - daily
        return stepData.map((item) => ({
          label: item.day,
          steps: item.steps,
          date: item.date,
        }));
    }
  };

  // Helper to get current tabular data
  const getTabularData = () => {
    switch (activeTab) {
      case "W":
        return weeklyData.map((item) => ({
          label: item.label,
          value: item.steps,
        }));
      case "M":
        return monthlyData.map((item) => ({
          label: item.label,
          value: item.steps,
        }));
      case "6M":
        return sixMData.map((item) => ({
          label: item.label,
          value: item.steps,
        }));
      case "Y":
        return yearlyData.map((item) => ({
          label: item.label,
          value: item.steps,
        }));
      default:
        // "D" - daily
        return stepData.map((item) => ({
          label: item.date,
          value: item.steps,
          isSelected: item.date === selectedDate,
        }));
    }
  };

  const tabularData = getTabularData();

  const graphData = getGraphData();
  const graphMax = Math.max(...graphData.map((item) => item.steps), 1);
  const graphMin = Math.min(...graphData.map((item) => item.steps));
  const graphBase = Math.floor(graphMin / 1000) * 1000;
  const graphRange = graphMax - graphBase;
  const generateGraphYAxis = () => {
    if (graphRange === 0) {
      return [graphBase + 1000, graphBase];
    }
    const step = Math.ceil(graphRange / 4 / 500) * 500 || 500;
    const values = [];
    for (let i = 0; i <= 4; i++) {
      values.push(graphBase + i * step);
    }
    return values.reverse();
  };

  const handleBarClick = (date) => {
    setSelectedDate(date);
  };

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
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Step Count</h2>
              <div className="flex">
                <div className="flex flex-col justify-between pr-4 text-right text-gray-400 text-xs h-64">
                  {generateGraphYAxis().map((value) => (
                    <div key={value}>{value.toLocaleString()}</div>
                  ))}
                </div>
                <div className="flex-grow">
                  <div
                    className="flex items-end justify-between h-64 border-b border-gray-300 relative"
                    style={{ gap: "0.25rem" }}
                  >
                    {graphData.map((item, index) => {
                      const isSelected =
                        activeTab === "D" ? item.date === selectedDate : false;
                      const heightPercentage =
                        graphRange > 0
                          ? ((item.steps - graphBase) / graphRange) * 100
                          : 50;
                      return (
                        <div
                          key={index}
                          className={`w-24 ${
                            isSelected ? "bg-[#DD3333]" : "bg-gray-400"
                          } rounded-t-md transition-all cursor-pointer hover:opacity-80 ${
                            isSelected
                              ? "border-t-2 border-x-2 border-[#DD3333]"
                              : ""
                          }`}
                          style={{
                            height: `${Math.max(heightPercentage, 5)}%`,
                            minHeight: "10px",
                          }}
                          onClick={
                            activeTab === "D"
                              ? () => handleBarClick(item.date)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    {graphData.map((item, index) => (
                      <div key={index} className="text-center w-6">
                        <div>{item.label}</div>
                        <div>{item.steps.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                {tabularData.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2 px-3 ${
                      item.isSelected
                        ? "bg-red-50 border border-red-200"
                        : "bg-white"
                    } rounded-lg`}
                  >
                    <span className="text-sm">{item.label}</span>
                    <span className="text-sm font-medium">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
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

            <div className="overflow-x-auto">
              <div className="overflow-hidden rounded-xl min-w-[20rem]">
                <div className="flex justify-between bg-[#E0E0E0] px-4 py-3 rounded-t-xl font-bold text-sm">
                  <div>
                    {activeTab === "D"
                      ? "Date"
                      : activeTab === "W"
                      ? "Day"
                      : activeTab === "M"
                      ? "Week"
                      : activeTab === "6M" || activeTab === "Y"
                      ? "Month"
                      : "Label"}
                  </div>
                  <div>Steps</div>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                  {tabularData.map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between px-4 py-3 text-sm ${
                        item.isSelected
                          ? "bg-red-50"
                          : index % 2 === 0
                          ? "bg-[#F5F5F5]"
                          : "bg-white"
                      }`}
                    >
                      <div>{item.label}</div>
                      <div>{item.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
