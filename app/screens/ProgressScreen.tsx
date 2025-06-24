import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

// Define the tabs we'll use
const TABS = {
  REPORT: 'Report',
  NUTRITION: 'Nutrition',
  WORKOUT: 'Workout',
};

// Tab navigation component
const TabBar = ({ activeTab, onChangeTab }) => {
  return (
    <View style={styles.tabBar}>
      {Object.values(TABS).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onChangeTab(tab)}>
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Main Progress Screen Component
const ProgressScreen = () => {
  const [activeTab, setActiveTab] = useState(TABS.REPORT);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const { currentUser } = useAuth();

  // Fetch all the required data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        // Fetch client info
        const clientDocRef = doc(db, 'intakeForms', currentUser.email);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          setClientInfo(clientDocSnap.data());
        }

        // Fetch report data
        const reportDocRef = doc(db, 'weeklyForms', currentUser.email);
        const reportDocSnap = await getDoc(reportDocRef);

        if (reportDocSnap.exists()) {
          const data = reportDocSnap.data();
          console.log('Report Data:', data); // Log to inspect structure
          // Remove firstEntryDate before setting the state
          const { firstEntryDate, ...weekData } = data;
          setReportData(weekData);
        }

        // Fetch nutrition data
        const nutritionDocRef = doc(db, 'nutrition', currentUser.email);
        const nutritionDocSnap = await getDoc(nutritionDocRef);

        if (nutritionDocSnap.exists()) {
          const data = nutritionDocSnap.data();
          console.log('Nutrition Data:', data); // Log to inspect structure
          setNutritionData(data);
        }

        // Fetch workout data
        const workoutDocRef = doc(db, 'Workout', currentUser.email);
        const workoutDocSnap = await getDoc(workoutDocRef);

        if (workoutDocSnap.exists()) {
          const data = workoutDocSnap.data();
          console.log('Workout Data:', data); // Log to inspect structure
          setWorkoutData(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Render the appropriate tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading your progress data...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case TABS.REPORT:
        return <ReportTab data={reportData} clientInfo={clientInfo} />;
      case TABS.NUTRITION:
        return <NutritionTab data={nutritionData} />;
      case TABS.WORKOUT:
        return <WorkoutTab data={workoutData} />;
      default:
        return <Text>Select a tab to view your progress</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>Track your fitness and nutrition journey</Text>
      </View>
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />
      <View style={styles.content}>{renderTabContent()}</View>
    </SafeAreaView>
  );
};

// Report Tab Component
const ReportTab = ({ data, clientInfo }) => {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [viewMode, setViewMode] = useState('weekly'); // weekly or overview

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const weeks = Object.keys(data);
      setSelectedWeek(weeks[weeks.length - 1]);
    }
  }, [data]);

  if (!data) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No progress data available</Text>
      </View>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
      return format(date, 'MMM d, yy');
    } catch (error) {
      return '';
    }
  };

  // Helper function to calculate weekly weight data
  const calculateWeightData = () => {
    if (!selectedWeek || !data[selectedWeek]) return [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days
      .filter((day) => data[selectedWeek][day] && data[selectedWeek][day].weight)
      .map((day) => ({
        day: day.substring(0, 3),
        weight: parseFloat(data[selectedWeek][day].weight),
      }));
  };

  // Helper function to calculate wellbeing data
  const calculateWellbeingData = () => {
    if (!selectedWeek || !data[selectedWeek]) return [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days
      .filter((day) => data[selectedWeek][day])
      .map((day) => ({
        day: day.substring(0, 3),
        sleep: data[selectedWeek][day]['Sleep Quality']?.value || 0,
        mood: data[selectedWeek][day].Mood?.value || 0,
        hunger: data[selectedWeek][day]['Hunger Level']?.value || 0,
      }));
  };

  // Helper function to calculate weekly averages
  const calculateAverages = () => {
    if (!data) return [];

    return Object.entries(data).map(([week, weekData]) => {
      // Calculate weight average
      const weights = Object.entries(weekData)
        .filter(([key, value]) => typeof value === 'object' && value !== null && 'weight' in value)
        .map(([_, day]) => parseFloat(day.weight));

      const avgWeight = weights.length
        ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
        : null;

      // Get waist and hip measurements
      const waist = weekData.waist;
      const hip = weekData.hip;
      const waistHipRatio = waist && hip ? (parseFloat(waist) / parseFloat(hip)).toFixed(2) : null;

      return {
        week,
        avgWeight,
        waist,
        hip,
        waistHipRatio,
      };
    });
  };

  const weightData = calculateWeightData();
  const wellbeingData = calculateWellbeingData();
  const progressData = calculateAverages();

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
  };

  return (
    <ScrollView style={styles.tabContent}>
      {/* Client Info Summary */}
      {clientInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{clientInfo.fullName}</Text>
          <View style={styles.clientDetails}>
            <View style={styles.clientDetail}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{clientInfo.age} years</Text>
            </View>
            <View style={styles.clientDetail}>
              <Text style={styles.detailLabel}>Starting Weight</Text>
              <Text style={styles.detailValue}>{clientInfo.startingWeight} kg</Text>
            </View>
            <View style={styles.clientDetail}>
              <Text style={styles.detailLabel}>Height</Text>
              <Text style={styles.detailValue}>{clientInfo.height} cm</Text>
            </View>
          </View>
        </View>
      )}

      {/* View Mode Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'weekly' && styles.activeViewToggleButton]}
          onPress={() => setViewMode('weekly')}>
          <Text style={styles.viewToggleText}>Weekly View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'overview' && styles.activeViewToggleButton,
          ]}
          onPress={() => setViewMode('overview')}>
          <Text style={styles.viewToggleText}>Overview</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'weekly' ? (
        <>
          {/* Week Selection */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekSelector}>
            {Object.keys(data).map((week) => (
              <TouchableOpacity
                key={week}
                style={[styles.weekButton, selectedWeek === week && styles.selectedWeekButton]}
                onPress={() => setSelectedWeek(week)}>
                <Text
                  style={[
                    styles.weekButtonText,
                    selectedWeek === week && styles.selectedWeekButtonText,
                  ]}>
                  {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Measurements Display */}
          {(data[selectedWeek]?.waist || data[selectedWeek]?.hip) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Measurements</Text>
              <View style={styles.measurementsRow}>
                {data[selectedWeek]?.waist && (
                  <View style={styles.measurement}>
                    <Text style={styles.measurementLabel}>Waist</Text>
                    <Text style={styles.measurementValue}>{data[selectedWeek].waist} cm</Text>
                  </View>
                )}
                {data[selectedWeek]?.hip && (
                  <View style={styles.measurement}>
                    <Text style={styles.measurementLabel}>Hip</Text>
                    <Text style={styles.measurementValue}>{data[selectedWeek].hip} cm</Text>
                  </View>
                )}
                {data[selectedWeek]?.waist && data[selectedWeek]?.hip && (
                  <View style={styles.measurement}>
                    <Text style={styles.measurementLabel}>W/H Ratio</Text>
                    <Text style={styles.measurementValue}>
                      {(
                        parseFloat(data[selectedWeek].waist) / parseFloat(data[selectedWeek].hip)
                      ).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Weight Chart */}
          {weightData.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Weight Progress</Text>
              <LineChart
                data={{
                  labels: weightData.map((item) => item.day),
                  datasets: [
                    {
                      data: weightData.map((item) => item.weight),
                      color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                    },
                  ],
                }}
                width={Dimensions.get('window').width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Wellbeing Chart */}
          {wellbeingData.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Wellbeing Metrics</Text>
              <LineChart
                data={{
                  labels: wellbeingData.map((item) => item.day),
                  datasets: [
                    {
                      data: wellbeingData.map((item) => item.sleep),
                      color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,
                    },
                    {
                      data: wellbeingData.map((item) => item.mood),
                      color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    },
                    {
                      data: wellbeingData.map((item) => item.hunger),
                      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                    },
                  ],
                  legend: ['Sleep', 'Mood', 'Hunger'],
                }}
                width={Dimensions.get('window').width - 32}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                bezier
                style={styles.chart}
                fromZero
                yAxisSuffix=""
              />
            </View>
          )}
        </>
      ) : (
        // Overview Mode
        <>
          {/* Weight Progress Overview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weight Progress Overview</Text>
            <LineChart
              data={{
                labels: progressData.map((item) => item.week.replace('Week ', '')),
                datasets: [
                  {
                    data: progressData
                      .map((item) => (item.avgWeight ? parseFloat(item.avgWeight) : null))
                      .filter((val) => val !== null),
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  },
                ],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Progress Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progress Summary</Text>
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Week</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Weight</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Waist</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Hip</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>W/H Ratio</Text>
                </View>
                {progressData.map((week, index) => (
                  <View
                    key={week.week}
                    style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.week}</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>
                      {week.avgWeight || '-'} kg
                    </Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.waist || '-'} cm</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.hip || '-'} cm</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>
                      {week.waistHipRatio || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
};

// Nutrition Tab Component
const NutritionTab = ({ data }) => {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');

  useEffect(() => {
    if (data) {
      const weeks = Object.keys(data).filter((key) => key !== 'firstEntryDate');
      setSelectedWeek(weeks[weeks.length - 1]);
    }
  }, [data]);

  if (!data) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No nutrition data available</Text>
      </View>
    );
  }

  // Helper function to group data by weeks
  const groupDataByWeeks = (nutritionData) => {
    if (!nutritionData) return {};

    const weeks = {};
    Object.entries(nutritionData).forEach(([key, value]) => {
      if (key === 'firstEntryDate') return;

      const weekData = {
        dates: [],
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        avgCalories: 0,
        dailyData: {},
      };

      Object.entries(value).forEach(([day, dayData]) => {
        if (dayData.date) {
          weekData.dates.push(dayData.date);
          weekData.avgProtein += dayData.totals['Protein (g)'];
          weekData.avgCarbs += dayData.totals['Carbohydrate (g)'];
          weekData.avgFat += dayData.totals['Fat (g)'];
          weekData.avgCalories += dayData.totals.Kcal;
          weekData.dailyData[dayData.date] = {
            dayType: dayData.dayType,
            meals: dayData.meals,
            totals: dayData.totals,
          };
        }
      });

      const daysCount = weekData.dates.length;
      if (daysCount > 0) {
        weekData.avgProtein = parseFloat((weekData.avgProtein / daysCount).toFixed(1));
        weekData.avgCarbs = parseFloat((weekData.avgCarbs / daysCount).toFixed(1));
        weekData.avgFat = parseFloat((weekData.avgFat / daysCount).toFixed(1));
        weekData.avgCalories = parseFloat((weekData.avgCalories / daysCount).toFixed(1));
      }

      weeks[key] = weekData;
    });

    return weeks;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
      return format(date, 'MMM d, yy');
    } catch (error) {
      return '';
    }
  };

  const weeklyData = groupDataByWeeks(data);

  if (!selectedWeek || !weeklyData[selectedWeek]) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.5,
    decimalPlaces: 0,
    strokeWidth: 2,
  };

  // Get daily data for macronutrients chart
  const dailyMacroData = weeklyData[selectedWeek].dates.map((date) => {
    const dayData = weeklyData[selectedWeek].dailyData[date];
    return {
      date: formatDate(date),
      protein: dayData.totals['Protein (g)'],
      carbs: dayData.totals['Carbohydrate (g)'],
      fat: dayData.totals['Fat (g)'],
    };
  });

  // Get daily data for calories chart
  const dailyCaloriesData = weeklyData[selectedWeek].dates.map((date) => {
    const dayData = weeklyData[selectedWeek].dailyData[date];
    return {
      date: formatDate(date),
      calories: dayData.totals.Kcal,
    };
  });

  // Get overview data
  const overviewData = Object.entries(weeklyData).map(([week, data]) => ({
    week,
    protein: data.avgProtein,
    carbs: data.avgCarbs,
    fat: data.avgFat,
    calories: data.avgCalories,
  }));

  return (
    <ScrollView style={styles.tabContent}>
      {/* View Mode Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'weekly' && styles.activeViewToggleButton]}
          onPress={() => setViewMode('weekly')}>
          <Text style={styles.viewToggleText}>Weekly View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'overview' && styles.activeViewToggleButton,
          ]}
          onPress={() => setViewMode('overview')}>
          <Text style={styles.viewToggleText}>Overview</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'weekly' ? (
        <>
          {/* Week Selection */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekSelector}>
            {Object.keys(weeklyData).map((week) => (
              <TouchableOpacity
                key={week}
                style={[styles.weekButton, selectedWeek === week && styles.selectedWeekButton]}
                onPress={() => setSelectedWeek(week)}>
                <Text
                  style={[
                    styles.weekButtonText,
                    selectedWeek === week && styles.selectedWeekButtonText,
                  ]}>
                  {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Weekly Summary Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Protein</Text>
                <Text style={styles.summaryValue}>{weeklyData[selectedWeek].avgProtein} g</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Carbs</Text>
                <Text style={styles.summaryValue}>{weeklyData[selectedWeek].avgCarbs} g</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Fat</Text>
                <Text style={styles.summaryValue}>{weeklyData[selectedWeek].avgFat} g</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Calories</Text>
                <Text style={styles.summaryValue}>{weeklyData[selectedWeek].avgCalories} kcal</Text>
              </View>
            </View>
          </View>

          {/* Macronutrients Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Macronutrients</Text>
            <ScrollView horizontal>
              <BarChart
                data={{
                  labels: dailyMacroData.map((item) => format(new Date(item.date), 'EEE')),
                  datasets: [
                    {
                      data: dailyMacroData.map((item) => item.protein),
                      color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`, // green
                    },
                    {
                      data: dailyMacroData.map((item) => item.carbs),
                      color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // amber
                    },
                    {
                      data: dailyMacroData.map((item) => item.fat),
                      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // red
                    },
                  ],
                  legend: ['Protein', 'Carbs', 'Fat'],
                }}
                width={Math.max(dailyMacroData.length * 60, Dimensions.get('window').width - 32)}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                verticalLabelRotation={0}
                segments={4}
                fromZero
              />
            </ScrollView>
          </View>

          {/* Calories Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Calories</Text>
            <ScrollView horizontal>
              <BarChart
                data={{
                  labels: dailyCaloriesData.map((item) => format(new Date(item.date), 'EEE')),
                  datasets: [
                    {
                      data: dailyCaloriesData.map((item) => item.calories),
                      color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // purple
                    },
                  ],
                }}
                width={Math.max(dailyCaloriesData.length * 60, Dimensions.get('window').width - 32)}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                verticalLabelRotation={0}
                segments={4}
                fromZero
              />
            </ScrollView>
          </View>
        </>
      ) : (
        // Overview Mode
        <>
          {/* Macronutrients Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Macronutrients Progress</Text>
            <LineChart
              data={{
                labels: overviewData.map((item) => item.week.replace('week', '')),
                datasets: [
                  {
                    data: overviewData.map((item) => item.protein),
                    color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`, // green
                    strokeWidth: 2,
                  },
                  {
                    data: overviewData.map((item) => item.carbs),
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // amber
                    strokeWidth: 2,
                  },
                  {
                    data: overviewData.map((item) => item.fat),
                    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // red
                    strokeWidth: 2,
                  },
                ],
                legend: ['Protein', 'Carbs', 'Fat'],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Calories Progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calories Progress</Text>
            <LineChart
              data={{
                labels: overviewData.map((item) => item.week.replace('week', '')),
                datasets: [
                  {
                    data: overviewData.map((item) => item.calories),
                    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // purple
                    strokeWidth: 2,
                  },
                ],
                legend: ['Calories'],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Nutrition Summary Table */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition Summary</Text>
            <ScrollView horizontal style={styles.tableContainer}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Week</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Protein</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Carbs</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Fat</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Calories</Text>
                </View>
                {overviewData.map((week, index) => (
                  <View
                    key={week.week}
                    style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.week}</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.protein} g</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.carbs} g</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.fat} g</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{week.calories} kcal</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
};

// Workout Tab Component
const WorkoutTab = ({ data }) => {
  const [selectedSession, setSelectedSession] = useState('all');
  const [viewMode, setViewMode] = useState('sessions');

  if (!data) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>No workout data available</Text>
      </View>
    );
  }

  const sessionTemplates = {
    A: [
      'Barbell Hip Thrust',
      'Cable Overhead Triceps Extension',
      'Heels Elevated Zercher Squat',
      'One-leg Leg Extension',
      'Scrape Rack L-Seated Shoulder Press',
      'Seated DB Lateral Raise',
    ],
    B: [
      'Face Pull (Half-kneeling)',
      'Leg Curl Seated Calf Raise',
      'One-leg Lying Leg Curl',
      'Snatch-grip Romanian Deadlift',
      'Wide Cable Shrug',
    ],
    C: [
      'Cable Fly (High-to-Low)',
      'Deficit Push-up',
      'Facing Cable Bicep Curl (Fwd Lean)',
      'Neutral Grip Chin-up',
      'One-Arm DB Row',
    ],
  };

  // Helper to get session type from exercise names
  const getSessionType = (exercises) => {
    const exerciseNames = exercises.map((e) => e.name.trim());

    for (const [session, templateExercises] of Object.entries(sessionTemplates)) {
      // Check if any exercises in this workout match the template
      if (
        exerciseNames.some((name) =>
          templateExercises.some((template) => name.toLowerCase() === template.toLowerCase())
        )
      ) {
        return session;
      }
    }
    return null;
  };

  // Helper to organize data by session
  const organizeBySession = () => {
    const sessions = {
      A: {},
      B: {},
      C: {},
    };

    // Initialize all exercises from templates
    Object.entries(sessionTemplates).forEach(([session, exercises]) => {
      exercises.forEach((exercise) => {
        sessions[session][exercise] = {};
      });
    });

    // Populate with actual data
    Object.entries(data).forEach(([weekKey, weekData]) => {
      if (weekKey === 'firstEntryDate') return;

      Object.entries(weekData).forEach(([day, dayData]) => {
        if (dayData.isRestDay || !dayData.exercises?.length) return;

        const sessionType = getSessionType(dayData.exercises);
        if (!sessionType) return;

        const date = format(new Date(dayData.timestamp), 'MMM d, yy');
        const duration =
          dayData.startTime && dayData.endTime
            ? `${format(new Date(dayData.startTime), 'h:mm a')} - ${format(new Date(dayData.endTime), 'h:mm a')}`
            : '';

        dayData.exercises.forEach((exercise) => {
          const matchingTemplateExercise = sessionTemplates[sessionType].find(
            (template) => template.toLowerCase() === exercise.name.toLowerCase().trim()
          );

          if (matchingTemplateExercise) {
            sessions[sessionType][matchingTemplateExercise][date] = {
              sets: exercise.sets,
              workoutNote: dayData.workoutNote || '',
              duration,
            };
          }
        });
      });
    });

    return sessions;
  };

  const sessionData = organizeBySession();

  return (
    <ScrollView style={styles.tabContent}>
      {/* Training Split Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workout Progress</Text>
        <Text style={styles.cardSubtitle}>Training Split: 3x Per Week</Text>
      </View>

      {/* Session Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionSelector}>
        <TouchableOpacity
          style={[styles.sessionButton, selectedSession === 'all' && styles.selectedSessionButton]}
          onPress={() => setSelectedSession('all')}>
          <Text
            style={[
              styles.sessionButtonText,
              selectedSession === 'all' && styles.selectedSessionButtonText,
            ]}>
            All Sessions
          </Text>
        </TouchableOpacity>
        {Object.keys(sessionData).map((session) => (
          <TouchableOpacity
            key={session}
            style={[
              styles.sessionButton,
              selectedSession === session && styles.selectedSessionButton,
            ]}
            onPress={() => setSelectedSession(session)}>
            <Text
              style={[
                styles.sessionButtonText,
                selectedSession === session && styles.selectedSessionButtonText,
              ]}>
              Session {session}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Session Content */}
      {(selectedSession === 'all' ? Object.keys(sessionData) : [selectedSession]).map((session) => (
        <View key={session} style={styles.sessionContainer}>
          <Text style={styles.sessionTitle}>Session {session}</Text>

          {Object.entries(sessionData[session]).map(([exercise, dates]) => {
            // Skip exercises with no data
            if (Object.keys(dates).length === 0) return null;

            return (
              <View key={exercise} style={styles.card}>
                <Text style={styles.exerciseTitle}>{exercise}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.entries(dates).map(([date, data]) => (
                    <View key={date} style={styles.exerciseData}>
                      <Text style={styles.dateText}>{date}</Text>
                      {data.sets.map((set, index) => (
                        <Text
                          key={set.id}
                          style={[styles.setData, set.completed && styles.completedSet]}>
                          {set.weight}kg × {set.reps}
                        </Text>
                      ))}
                      {data.duration && <Text style={styles.durationText}>{data.duration}</Text>}
                    </View>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyStateContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  clientDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  clientDetail: {
    minWidth: '33%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
    padding: 2,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  activeViewToggleButton: {
    backgroundColor: '#fff',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  weekSelector: {
    marginBottom: 16,
  },
  weekButton: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  selectedWeekButton: {
    backgroundColor: '#2563eb',
  },
  weekButtonText: {
    fontSize: 14,
    color: '#1e293b',
  },
  selectedWeekButtonText: {
    color: '#fff',
  },
  measurementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurement: {
    flex: 1,
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  tableContainer: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    fontWeight: '600',
    color: '#475569',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    padding: 8,
    color: '#1e293b',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    padding: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sessionSelector: {
    marginBottom: 16,
  },
  sessionButton: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  selectedSessionButton: {
    backgroundColor: '#2563eb',
  },
  sessionButtonText: {
    fontSize: 14,
    color: '#1e293b',
  },
  selectedSessionButtonText: {
    color: '#fff',
  },
  sessionContainer: {
    marginBottom: 24,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#1e293b',
  },
  exerciseData: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 100,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  setData: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 2,
  },
  completedSet: {
    color: '#16a34a',
  },
  durationText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});

export default ProgressScreen;
