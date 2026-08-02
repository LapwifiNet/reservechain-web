import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { LocaleProvider } from "@/context/LocaleContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: "600" },
              contentStyle: { backgroundColor: colors.canvas },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="programs/[slug]"
              options={{ title: "Program" }}
            />
            <Stack.Screen
              name="passport/[slug]"
              options={{ title: "Passport" }}
            />
            <Stack.Screen
              name="waitlist"
              options={{ title: "Register interest" }}
            />
            <Stack.Screen
              name="investor/index"
              options={{ title: "Investor" }}
            />
          </Stack>
        </AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}
