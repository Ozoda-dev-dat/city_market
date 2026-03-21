import { Stack } from "expo-router";
import Colors from "@/constants/colors";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

export default function CourierLayout() {
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="order/[id]" />
    </Stack>
  );
}
