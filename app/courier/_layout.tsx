import { Stack, Redirect } from "expo-router";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export default function CourierLayout() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const Colors = getColors(isDarkMode);

  if (!user) return <Redirect href="/auth" />;
  if (user.role !== "courier") return <Redirect href="/" />;

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
