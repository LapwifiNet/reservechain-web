import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Cross-platform token storage.
 *
 * Native builds (iOS/Android) use expo-secure-store — encrypted at rest,
 * the correct home for an investor token. On web, SecureStore has no
 * implementation and would reject every call, so we fall back to
 * localStorage. The web fallback exists so the app is testable in a browser
 * (and Expo Go web); it is deliberately scoped to the investor session
 * token only, never to keys or secrets.
 */
const WEB_PREFIX = "rc.web.";

function isWeb(): boolean {
  return Platform.OS === "web";
}

export async function getToken(key: string): Promise<string | null> {
  if (isWeb()) {
    try {
      return globalThis.localStorage?.getItem(WEB_PREFIX + key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setToken(key: string, value: string): Promise<void> {
  if (isWeb()) {
    try {
      globalThis.localStorage?.setItem(WEB_PREFIX + key, value);
    } catch {
      /* storage unavailable — session simply won't persist */
    }
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

export async function deleteToken(key: string): Promise<void> {
  if (isWeb()) {
    try {
      globalThis.localStorage?.removeItem(WEB_PREFIX + key);
    } catch {
      /* ignore */
    }
    return;
  }
  return SecureStore.deleteItemAsync(key);
}
