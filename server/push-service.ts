import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { storage } from "./db-storage";

const expo = new Expo();

/**
 * Send a push notification to a user, if they have a valid token and
 * notifications enabled. Failures are logged but never thrown — push
 * delivery must never break the calling request (e.g. an order status
 * update) if it fails.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return;
    const token = (user as any).pushToken as string | null;
    const enabled = (user as any).notificationsEnabled;
    if (!token || enabled === false) return;

    if (!Expo.isExpoPushToken(token)) {
      console.warn(`Push token for user ${userId} is not a valid Expo push token, skipping`);
      return;
    }

    const message: ExpoPushMessage = {
      to: token,
      sound: "default",
      title,
      body,
      data: data ?? {},
    };

    const receipts = await expo.sendPushNotificationsAsync([message]);
    for (const receipt of receipts) {
      if (receipt.status === "error") {
        console.error("Push notification error:", receipt.message, receipt.details);
        // Token is no longer valid on the device — clear it so we stop trying.
        if (receipt.details?.error === "DeviceNotRegistered") {
          await storage.updateUser(userId, { pushToken: null } as any);
        }
      }
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}
