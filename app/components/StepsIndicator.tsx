import React from 'react';
import { View } from 'react-native';

export default function StepsIndicator({
  count = 5,
  value = 0,
  minimumValue = 0,
  maximumValue = 1,
  minimumTrackTintColor = '#3f3f3f',
  maximumTrackTintColor = '#b3b3b3',
  stepColors = [], // Add support for custom colors per step
}) {
  // Calculate how many steps should be filled
  const range = maximumValue - minimumValue;
  const stepWidth = range / (count - 1);
  const filledSteps = Math.round((value - minimumValue) / stepWidth);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
      }}>
      {Array.from({ length: count }).map((_, index) => {
        // Determine the color for this specific step
        let stepColor;

        if (stepColors && stepColors[index]) {
          // Use custom color if provided for this step
          stepColor = stepColors[index];
        } else {
          // Fall back to default filled/unfilled colors
          stepColor = index < filledSteps ? minimumTrackTintColor : maximumTrackTintColor;
        }

        return (
          <View
            key={index}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: stepColor,
            }}
          />
        );
      })}
    </View>
  );
}
