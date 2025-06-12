import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function ReportScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.title, isDarkMode && styles.textDark]}>Report Screen</Text>
      <Pressable
        style={[styles.button, isDarkMode && styles.buttonDark]}
        onPress={() => navigation.goBack()}>
        <Text style={[styles.buttonText, isDarkMode && styles.textDark]}>Go Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
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
});
