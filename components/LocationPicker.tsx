import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/context/LocationContext";
import * as Location from "expo-location";

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationPicker({ visible, onClose }: LocationPickerProps) {
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const { updateUserLocation, getCurrentLocation, isLoading, permissionGranted, locationError, location } = useLocation();
  
  const [address, setAddress] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const fetchingRef = useRef(false);

  // Close the modal automatically once location is successfully obtained
  useEffect(() => {
    if (fetchingRef.current && !isLoading && location && !locationError) {
      fetchingRef.current = false;
      onClose();
    }
  }, [isLoading, location, locationError]);

  const handleGetCurrentLocation = async () => {
    fetchingRef.current = true;
    await getCurrentLocation();
  };

  const handleManualLocation = async () => {
    if (!address.trim()) {
      Alert.alert("Xatolik", "Iltimos, manzilingizni kiriting.");
      return;
    }

    try {
      // For demo purposes, use Tashkent coordinates
      const latitude = "41.2995";
      const longitude = "69.2401";
      
      await updateUserLocation(latitude, longitude, address);
      onClose();
    } catch (error) {
      Alert.alert("Xatolik", "Manzilni saqlashda xatolik yuz berdi.");
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Ruxsat talab qilinadi", "Ilovalarni joylash uchun GPS ruxsatini yoqing qiling.");
      }
    } catch (error) {
      console.error("Permission request error:", error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: 48 }]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Manzilni tanlang</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Ionicons name="location" size={24} color={Colors.primary} />
              <Text style={styles.optionTitle}>Joriy joylashuvchi orqali</Text>
            </View>
            <Text style={styles.optionDescription}>
              GPS orqali avtomatik ravishda manzilingizni aniqlaydi
            </Text>
            <Pressable
              style={[styles.optionBtn, isLoading && styles.disabledBtn]}
              onPress={handleGetCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.btnText}>Joylashmoqda...</Text>
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#fff" />
                  <Text style={styles.btnText}>Joriy joylashuvchi</Text>
                </>
              )}
            </Pressable>
            {locationError ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{locationError}</Text>
              </View>
            ) : !permissionGranted ? (
              <Pressable style={styles.permissionBtn} onPress={requestLocationPermission}>
                <Text style={styles.permissionBtnText}>GPS ruxsatini berish</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Ionicons name="create" size={24} color={Colors.primary} />
              <Text style={styles.optionTitle}>Qo&apos;lda kiritish</Text>
            </View>
            <Text style={styles.optionDescription}>
              Manzilingizni qo&apos;lda kiriting
            </Text>
            <Pressable
              style={styles.toggleBtn}
              onPress={() => setManualMode(!manualMode)}
            >
              <Text style={styles.toggleBtnText}>
                {manualMode ? "GPS orqali" : "Qo&apos;lda kiritish"}
              </Text>
            </Pressable>
            
            {manualMode && (
              <View style={styles.manualInputContainer}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Manzil (masalan, Toshkent, Chilonzor ko&apos;cha)"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
                <Pressable
                  style={[styles.optionBtn, !address.trim() && styles.disabledBtn]}
                  onPress={handleManualLocation}
                  disabled={!address.trim()}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.btnText}>Saqlash</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 18,
      color: Colors.text,
    },
    closeBtn: {
      padding: 4,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    optionCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    optionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    optionTitle: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 16,
      color: Colors.text,
    },
    optionDescription: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    optionBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    disabledBtn: {
      backgroundColor: Colors.textMuted,
    },
    btnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: "#fff",
    },
    permissionBtn: {
      marginTop: 12,
      backgroundColor: Colors.glass,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    permissionBtnText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.primary,
    },
    errorBox: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      backgroundColor: "#FEF2F2",
      borderRadius: 8,
      padding: 10,
    },
    errorText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: "#DC2626",
      flex: 1,
    },
    toggleBtn: {
      backgroundColor: Colors.glass,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    toggleBtnText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 12,
      color: Colors.primary,
    },
    manualInputContainer: {
      marginTop: 16,
    },
    addressInput: {
      backgroundColor: Colors.glass,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: "Poppins_400Regular",
      color: Colors.text,
      textAlignVertical: "top",
      minHeight: 80,
    },
  });
};
