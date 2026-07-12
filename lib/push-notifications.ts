import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

/**
 * Requests OS-level notification permission (if not already granted) and
 * returns an Expo push token for this device, or null if permission was
 * denied or a token could not be obtained (e.g. running in Expo Go without
 * a project id, or on web).
 */
export async function requestPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenResponse.data;
  } catch (error) {
    console.warn("Failed to obtain push token:", error);
    return null;
  }
}

/**
 * Checks current OS notification permission without prompting.
 */
export async function getNotificationPermissionStatus(): Promise<string> {
  if (Platform.OS === "web") return "web-unsupported";
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}
