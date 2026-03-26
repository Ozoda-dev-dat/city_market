import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A9B5C" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (user.role === "admin") {
    return <Redirect href="/admin" />;
  }

  if (user.role === "courier") {
    return <Redirect href="/courier" />;
  }

  return <Redirect href="/(tabs)" />;
}
