import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { t } from "@/i18n";
import { useLocale } from "@/context/LocaleContext";

/**
 * SC-MOB-HOME — the tab shell the spec calls for (Home / Registry / Passport
 * / Documents / Profile). Detail screens (program, passport, waitlist,
 * investor) stay on the root stack and push over the tabs.
 *
 * Labels come from i18n so the tab bar follows the active locale; the layout
 * re-renders on language change via useLocale().
 */
export default function TabsLayout() {
  useLocale();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.copper,
        tabBarInactiveTintColor: colors.text2,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="registry"
        options={{
          title: t("nav.registry"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: t("nav.passport"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="id-card-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: t("nav.documents"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
