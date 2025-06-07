import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Pressable
        onPress={() => navigation.navigate('Profile')}
        className="rounded-lg bg-green-500 px-6 py-3">
        <Text className="font-bold text-white">Profile</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Form')}
        className="rounded-lg bg-green-500 px-6 py-3">
        <Text className="font-bold text-white">Form</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Login')}
        className="rounded-lg bg-green-500 px-6 py-3">
        <Text className="font-bold text-white">Login</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Workout')}
        className="rounded-lg bg-green-500 px-6 py-3">
        <Text className="font-bold text-white">Workout</Text>
      </Pressable>
    </View>
  );
}
