import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function FormScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="mb-4 text-xl">Form Screen</Text>
      <Pressable onPress={() => navigation.goBack()} className="rounded-lg bg-gray-500 px-6 py-3">
        <Text className="font-bold text-black">Go Back</Text>
      </Pressable>
    </View>
  );
}
