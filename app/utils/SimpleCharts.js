import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// A simple bar chart implementation that doesn't rely on SVG
const SimpleBarChart = ({ data, width = 300, height = 200 }) => {
  if (!data || !data.datasets || data.datasets.length === 0 || !data.labels) {
    return null;
  }

  const maxValue = Math.max(
    ...data.datasets.flatMap((dataset) =>
      dataset.data.filter((value) => value !== undefined && value !== null)
    )
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.chartArea}>
        {data.labels.map((label, index) => {
          const values = data.datasets.map((dataset) => dataset.data[index] || 0);
          const colors = data.datasets.map((dataset) =>
            typeof dataset.color === 'function' ? dataset.color(1) : dataset.color || '#000'
          );

          return (
            <View key={index} style={styles.barGroup}>
              {values.map((value, i) => (
                <View key={i} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(value / maxValue) * 100}%`,
                        backgroundColor: colors[i] || '#007AFF',
                      },
                    ]}
                  />
                </View>
              ))}
              <Text style={styles.label}>{label}</Text>
            </View>
          );
        })}
      </View>

      {data.legend && (
        <View style={styles.legend}>
          {data.datasets.map((dataset, i) => (
            <View key={i} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  {
                    backgroundColor:
                      typeof data.datasets[i].color === 'function'
                        ? data.datasets[i].color(1)
                        : data.datasets[i].color || '#007AFF',
                  },
                ]}
              />
              <Text style={styles.legendText}>{data.legend[i]}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    paddingBottom: 20,
  },
  barGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  label: {
    position: 'absolute',
    bottom: -18,
    fontSize: 10,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
});

export { SimpleBarChart };
