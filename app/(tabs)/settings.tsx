import { StyleSheet, Text, View, Platform, Pressable, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import Colors from "@/constants/colors";
import { useI18n } from "@/core/i18n/i18n-context";
import { Locale } from "@/core/i18n/translations";

function SettingsRow({ icon, label, right, onPress }: { icon: string; label: string; right?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, { opacity: pressed && onPress ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsRowLeft}>
        <View style={styles.settingsIconWrap}>
          <Ionicons name={icon as any} size={20} color={Colors.primary} />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      {right || <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />}
    </Pressable>
  );
}

function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.languageSection}>
      <Pressable
        style={({ pressed }) => [styles.settingsRow, { opacity: pressed ? 0.7 : 1 }]}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.settingsRowLeft}>
          <View style={styles.settingsIconWrap}>
            <Ionicons name="language" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.settingsLabel}>{t.settings.language}</Text>
        </View>
        <View style={styles.languageRight}>
          <Text style={styles.languageCurrentText}>
            {locale === "uz" ? "UZ" : "RU"}
          </Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.languageOptions}>
          <LanguageOption
            label={t.settings.uzbek}
            flag="UZ"
            selected={locale === "uz"}
            onPress={() => { setLocale("uz"); setExpanded(false); }}
          />
          <LanguageOption
            label={t.settings.russian}
            flag="RU"
            selected={locale === "ru"}
            onPress={() => { setLocale("ru"); setExpanded(false); }}
          />
        </View>
      )}
    </View>
  );
}

function LanguageOption({ label, flag, selected, onPress }: { label: string; flag: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.langOption, selected && styles.langOptionSelected, { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.langOptionLeft}>
        <View style={[styles.flagBadge, selected && styles.flagBadgeSelected]}>
          <Text style={[styles.flagText, selected && styles.flagTextSelected]}>{flag}</Text>
        </View>
        <Text style={[styles.langOptionLabel, selected && styles.langOptionLabelSelected]}>{label}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [darkMode, setDarkMode] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrap, { paddingTop: topInset + 12 }]}>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionLabel}>{t.settings.language}</Text>
        <View style={styles.card}>
          <LanguageSelector />
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionLabel}>{t.settings.appearance}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="moon-outline"
            label={t.settings.darkMode}
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.surfaceLight, true: Colors.primary + "60" }}
                thumbColor={darkMode ? Colors.primary : Colors.textSecondary}
              />
            }
          />
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionLabel}>{t.settings.notifications}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            label={t.settings.pushNotifications}
            right={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: Colors.surfaceLight, true: Colors.primary + "60" }}
                thumbColor={pushEnabled ? Colors.primary : Colors.textSecondary}
              />
            }
          />
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionLabel}>{t.settings.about}</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="information-circle-outline"
            label={t.settings.version}
            right={<Text style={styles.versionText}>1.0.0</Text>}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  sectionWrap: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  versionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  languageSection: {},
  languageRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  languageCurrentText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  languageOptions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight + "40",
  },
  langOptionSelected: {
    backgroundColor: Colors.primary + "15",
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  langOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flagBadge: {
    width: 32,
    height: 24,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  flagBadgeSelected: {
    backgroundColor: Colors.primary + "30",
  },
  flagText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  flagTextSelected: {
    color: Colors.primary,
  },
  langOptionLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  langOptionLabelSelected: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
