import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Pressable
        onPress={() => navigation.navigate('Profile')}
        className="rounded-lg bg-emerald-500 px-6 py-3 active:bg-emerald-600">
        <Text className="text-xl font-bold">Profile</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Form')}
        className="rounded-lg bg-emerald-500 px-6 py-3 active:bg-emerald-600">
        <Text className="text-xl font-bold">Form</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Login')}
        className="rounded-lg bg-emerald-500 px-6 py-3 active:bg-emerald-600">
        <Text className="text-xl font-bold">Login</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Workout')}
        className="rounded-lg bg-emerald-500 px-6 py-3 active:bg-emerald-600">
        <Text className="text-xl font-bold">Workout</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Payment')}
        className="rounded-lg bg-emerald-500 px-6 py-3 active:bg-emerald-600">
        <Text className="text-xl font-bold">Payment</Text>
      </Pressable>
    </View>
  );
}
