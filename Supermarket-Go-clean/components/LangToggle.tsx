import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/lib/I18nProvider";

export default function LangToggle() {
  const { lang, setLang } = useTranslation();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  
  return (
    <View style={styles.container}>
      <Pressable onPress={() => setLang("uz")}> 
        <Text style={[styles.label, lang === "uz" && styles.active]}>UZ</Text> 
      </Pressable>
      <Pressable onPress={() => setLang("ru")}> 
        <Text style={[styles.label, lang === "ru" && styles.active]}>RU</Text> 
      </Pressable>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flexDirection: "row", gap: 8 },
    label: { color: Colors.textSecondary, fontSize: 12, opacity: 0.6 },
    active: { opacity: 1, fontWeight: "bold" },
  });
};