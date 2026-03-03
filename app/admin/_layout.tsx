import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="products" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="add-courier" />
    </Stack>
  );
}
