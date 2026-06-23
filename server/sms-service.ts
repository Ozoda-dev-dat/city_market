const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL || "";
const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD || "";
const ESKIZ_BASE = "https://notify.eskiz.uz/api";

let _token: string | null = null;
let _tokenExpiry = 0;

async function getToken(): Promise<string | null> {
  if (_token && Date.now() < _tokenExpiry) return _token;
  if (!ESKIZ_EMAIL || !ESKIZ_PASSWORD) return null;
  try {
    const res = await fetch(`${ESKIZ_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ESKIZ_EMAIL, password: ESKIZ_PASSWORD }),
    });
    const data = await res.json() as any;
    _token = data?.data?.token || null;
    _tokenExpiry = Date.now() + 28 * 60 * 1000;
    return _token;
  } catch {
    return null;
  }
}

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const token = await getToken();
  if (!token) {
    console.warn("[SMS] Eskiz credentials not set — SMS not sent (dev mode)");
    return false;
  }
  try {
    const normalized = phone.replace(/^\+/, "");
    const res = await fetch(`${ESKIZ_BASE}/message/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mobile_phone: normalized,
        message,
        from: "4546",
        callback_url: "",
      }),
    });
    const data = await res.json() as any;
    return data?.status === "waiting" || data?.id != null;
  } catch (e) {
    console.error("[SMS] Send error:", e);
    return false;
  }
}

export function isSmsConfigured(): boolean {
  return !!(ESKIZ_EMAIL && ESKIZ_PASSWORD);
}
