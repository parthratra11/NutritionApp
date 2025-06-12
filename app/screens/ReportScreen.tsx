import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LineChart } from 'react-native-chart-kit';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

export default function ReportScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;

      try {
        const userDocRef = doc(db, 'weeklyForms', user.email.toLowerCase());
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setWeeklyData(userDocSnap.data());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  const processDataForMetric = (metric) => {
    if (!weeklyData) return { labels: [], data: [], colors: [] };

    const labels = [];
    const data = [];
    const colors = [];

    Object.keys(weeklyData)
      .filter((key) => key.startsWith('week'))
      .sort((a, b) => a.localeCompare(b))
      .forEach((weekKey) => {
        const weekData = weeklyData[weekKey];
        Object.keys(weekData)
          .filter((day) =>
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(
              day
            )
          )
          .forEach((day) => {
            const dayData = weekData[day];
            if (dayData[metric]?.value) {
              labels.push(`${weekKey}-${day}`);
              data.push(dayData[metric].value);
              colors.push(dayData[metric].color || '#000000');
            }
          });
      });

    return { labels, data, colors };
  };

  const renderChart = (metric) => {
    const { labels, data, colors } = processDataForMetric(metric);
    if (data.length === 0) return null;

    const getColorForMetric = (opacity = 1) => {
      const baseColor =
        {
          'Sleep Quality': '#6366f1', // Indigo
          Mood: '#ec4899', // Pink
          'Hunger Level': '#14b8a6', // Teal
        }[metric] || '#8b5cf6'; // Default Purple

      return isDarkMode ? `rgba(${hexToRgb(baseColor)}, ${opacity})` : baseColor;
    };

    return (
      <View
        style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc' }]}>
        <Text style={[styles.chartTitle, isDarkMode && styles.textDark]}>
          {metric} ({data[data.length - 1]}/5)
        </Text>
        <LineChart
          data={{
            labels: labels.map((l) => l.split('-')[1].substring(0, 3)),
            datasets: [
              {
                data,
                color: getColorForMetric,
                strokeWidth: 3,
              },
            ],
          }}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: isDarkMode ? '#1f2937' : '#f8fafc',
            backgroundGradientTo: isDarkMode ? '#1f2937' : '#f8fafc',
            decimalPlaces: 0,
            color: getColorForMetric,
            labelColor: () => (isDarkMode ? '#9ca3af' : '#64748b'),
            style: {
              borderRadius: 16,
            },
            propsForBackgroundLines: {
              strokeDasharray: '', // Solid lines
              stroke: isDarkMode ? '#374151' : '#e2e8f0',
              strokeWidth: 1,
            },
            propsForDots: {
              r: '5',
              strokeWidth: '2',
              stroke: getColorForMetric(1),
            },
            yAxisInterval: 1,
            yAxisSuffix: '',
            yAxisMinValue: 0,
            yAxisMaxValue: 5,
          }}
          style={styles.chart}
          bezier
        />
        <Text style={[styles.chartSubtitle, isDarkMode && styles.textDark]}>
          Last updated: {new Date(weeklyData.timestamp).toLocaleDateString()}
        </Text>
      </View>
    );
  };
  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.title, isDarkMode && styles.textDark]}>Your Progress</Text>

      {renderChart('Sleep Quality')}
      {renderChart('Mood')}
      {renderChart('Hunger Level')}

      <Pressable
        style={[styles.button, isDarkMode && styles.buttonDark]}
        onPress={() => navigation.goBack()}>
        <Text style={[styles.buttonText, isDarkMode && styles.textDark]}>Go Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
  },
  chartSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 12,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    color: '#000000',
  },
  textDark: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDark: {
    backgroundColor: '#374151',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  chartContainer: {
    marginVertical: 16,
    padding: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000000',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
});
