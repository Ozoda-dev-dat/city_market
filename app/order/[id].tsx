import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Animated, Dimensions, Linking, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Order } from "@/shared/schema";

const { width } = Dimensions.get("window");

export default function EnhancedOrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders: adminOrders, isLoading: isLoadingOrders } = useApp();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const queryClient = useQueryClient();
  
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [progressValue] = useState(new Animated.Value(0));

  // Try admin orders first; fall back to customer orders for regular users
  const { data: myOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/my"],
    queryFn: () => apiRequest("GET", "/api/orders/my").then(res => res.json()),
    enabled: !adminOrders.find(o => o.id === id),
  });

  const order = adminOrders.find(o => o.id === id) ?? myOrders.find(o => o.id === id);

  useEffect(() => {
    // Animate progress on mount
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    
    // Animate progress bar
    const currentStep = getCurrentStep();
    Animated.timing(progressValue, {
      toValue: (currentStep / 4) * 100,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);
  
  const getCurrentStep = () => {
    if (!order) return 0;
    if (order.status === 'cancelled') return 0;
    if (order.status === 'pending') return 1;
    if (order.status === 'confirmed') return 1;
    if (order.status === 'preparing') return 2;
    if (order.status === 'ready') return 2;
    if (order.status === 'delivering') return 3;
    if (order.status === 'delivered') return 4;
    return 0;
  };

  if (!order && isLoadingOrders) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
        <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: Colors.textSecondary }}>Buyurtma topilmadi</Text>
        <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 }}>
          <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>Ortga qaytish</Text>
        </Pressable>
      </View>
    );
  }

  const steps = [
    { 
      key: "pending", 
      label: "Qabul qilindi", 
      icon: "checkmark-circle",
      description: "Buyurtmangiz qabul qilindi",
      time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : ''
    },
    { 
      key: "preparing", 
      label: "Tayyorlanmoqda", 
      icon: "bag-handle",
      description: "Buyurtma tayyorlanmoqda",
      time: order.status === 'preparing' || order.status === 'ready' || order.status === 'delivering' || order.status === 'delivered' ? '15:30' : ''
    },
    { 
      key: "delivering", 
      label: "Yo'lda", 
      icon: "bicycle",
      description: "Kuryer yo'lda",
      time: order.status === 'delivering' || order.status === 'delivered' ? '16:00' : ''
    },
    { 
      key: "delivered", 
      label: "Yetkazildi", 
      icon: "home",
      description: "Buyurtma muvaffaqiyatli yetkazildi",
      time: order.status === 'delivered' ? '16:30' : ''
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const isCancelled = order.status === "cancelled";
  const progress = currentStepIndex >= 0 ? (currentStepIndex + 1) / steps.length : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'confirmed': return Colors.warning;
      case 'preparing': return Colors.primary;
      case 'ready': return Colors.primary;
      case 'delivering': return Colors.primary;
      case 'delivered': return '#10B981';
      case 'cancelled': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Kutilmoqda';
      case 'confirmed': return 'Tasdiqlandi';
      case 'preparing': return 'Tayyorlanmoqda';
      case 'ready': return 'Tayyor';
      case 'delivering': return "Yo'lda";
      case 'delivered': return 'Yetkazildi';
      case 'cancelled': return 'Bekor qilingan';
      default: return status;
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✔️';
      case 'preparing': return '🛒';
      case 'ready': return '📦';
      case 'delivering': return '🚴';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Buyurtma holati</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Order Summary Card */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>Buyurtma #{order.id.slice(-6)}</Text>
              <Text style={styles.orderDate}>
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('uz-UZ') : ''}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{getStatusEmoji(order.status)} {getStatusLabel(order.status)}</Text>
            </View>
          </View>
          <View style={styles.orderTotal}>
            <Text style={styles.totalLabel}>Jami summa:</Text>
            <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {!isCancelled && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Buyurtma jarayoni</Text>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: getStatusColor(order.status),
                    width: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${progress * 100}%`]
                    })
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Status Timeline */}
        {isCancelled ? (
          <View style={styles.cancelledBox}>
            <Ionicons name="close-circle" size={64} color={Colors.error} />
            <Text style={styles.cancelledTitle}>Buyurtma bekor qilingan</Text>
            <Text style={styles.cancelledDescription}>
              Bu buyurtma bekor qilingan. Iltimos, qayta buyurtma berishingiz mumkin.
            </Text>
            <Pressable style={styles.reorderButton} onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.reorderButtonText}>Qayta buyurtma berish</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>Batafsil holat</Text>
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;
              
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[
                      styles.stepDot, 
                      isCompleted && styles.stepDotCompleted,
                      isCurrent && styles.stepDotCurrent,
                      isUpcoming && styles.stepDotUpcoming
                    ]}>
                      <Ionicons 
                        name={step.icon as any} 
                        size={isCurrent ? 20 : 16} 
                        color={isCompleted ? '#fff' : isCurrent ? Colors.primary : Colors.textMuted} 
                      />
                    </View>
                    {index < steps.length - 1 && (
                      <View style={[
                        styles.stepLine,
                        index < currentStepIndex && styles.stepLineCompleted
                      ]} />
                    )}
                  </View>
                  <View style={styles.stepRight}>
                    <View style={styles.stepContent}>
                      <Text style={[
                        styles.stepLabel,
                        isCompleted && styles.stepLabelCompleted,
                        isCurrent && styles.stepLabelCurrent,
                        isUpcoming && styles.stepLabelUpcoming
                      ]}>
                        {step.label}
                      </Text>
                      {step.time && (
                        <Text style={styles.stepTime}>{step.time}</Text>
                      )}
                    </View>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Hozirgi holat</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Delivery Details */}
        <View style={styles.deliveryCard}>
          <Text style={styles.cardTitle}>Yetkazib berish ma'lumotlari</Text>
          
          <View style={styles.deliverySection}>
            <View style={styles.deliveryRow}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryLabel}>Manzil</Text>
                <Text style={styles.deliveryText}>{order.address}</Text>
              </View>
            </View>
            
            <View style={styles.deliveryRow}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryLabel}>Qabul qiluvchi</Text>
                <Text style={styles.deliveryText}>{order.customerName}</Text>
                <Text style={styles.deliveryPhone}>{order.phoneNumber}</Text>
              </View>
            </View>
            
            {order.status === 'transit' && (
              <View style={styles.deliveryRow}>
                <Ionicons name="bicycle" size={20} color={Colors.primary} />
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryLabel}>Kuryer</Text>
                  <Text style={styles.deliveryText}>Yo'lda</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.cardTitle}>Buyurtma mahsulotlari</Text>
          {(order.items as any[])?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>{item.qty} x {formatPrice(item.price)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.price * item.qty)}</Text>
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.supportCard}>
          <Text style={styles.cardTitle}>Yordam kerakmi?</Text>
          <View style={styles.supportButtons}>
            <Pressable style={styles.supportButton}>
              <Ionicons name="call" size={20} color={Colors.primary} />
              <Text style={styles.supportButtonText}>Qo'ng'iroq qilish</Text>
            </Pressable>
            <Pressable style={styles.supportButton}>
              <Ionicons name="chatbubble" size={20} color={Colors.primary} />
              <Text style={styles.supportButtonText}>Chat</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    header: { 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: "space-between",
      padding: 16, 
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider
    },
    backButton: { padding: 8 },
    title: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text },
    refreshButton: { padding: 8 },
    
    // Order Summary
    orderSummaryCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    orderNumber: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text },
    orderDate: { fontFamily: 'Poppins_400Regular', color: Colors.textMuted, marginTop: 4 },
    statusBadge: {
      backgroundColor: Colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusText: { fontFamily: 'Poppins_600SemiBold', color: Colors.primary, fontSize: 12 },
    orderTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
    },
    totalLabel: { fontFamily: 'Poppins_500Medium', color: Colors.textMuted },
    totalAmount: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.primary },
    
    // Progress
    progressContainer: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    progressTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.text },
    progressPercent: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.primary },
    progressBar: {
      height: 8,
      backgroundColor: Colors.divider,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    
    // Timeline
    timelineContainer: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    timelineTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text, marginBottom: 20 },
    stepRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    stepLeft: { alignItems: 'center' },
    stepDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotCompleted: { backgroundColor: Colors.primary },
    stepDotCurrent: { 
      backgroundColor: Colors.primary + '20',
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    stepDotUpcoming: { backgroundColor: Colors.divider },
    stepLine: { width: 2, flex: 1, backgroundColor: Colors.divider },
    stepLineCompleted: { backgroundColor: Colors.primary },
    stepRight: { flex: 1, paddingTop: 4 },
    stepContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    stepLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: Colors.textMuted },
    stepLabelCompleted: { color: Colors.text },
    stepLabelCurrent: { color: Colors.primary },
    stepLabelUpcoming: { color: Colors.textMuted },
    stepTime: { fontFamily: 'Poppins_400Regular', color: Colors.textMuted, fontSize: 14 },
    stepDescription: { fontFamily: 'Poppins_400Regular', color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
    currentBadge: {
      backgroundColor: Colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    currentBadgeText: { 
      fontFamily: 'Poppins_600SemiBold', 
      color: Colors.primary, 
      fontSize: 12 
    },
    
    // Cancelled
    cancelledBox: { 
      alignItems: 'center', 
      padding: 40, 
      backgroundColor: Colors.card,
      borderRadius: 16,
      marginBottom: 20,
    },
    cancelledTitle: { 
      fontFamily: 'Poppins_700Bold', 
      color: Colors.error, 
      fontSize: 20,
      marginTop: 16,
      marginBottom: 8,
    },
    cancelledDescription: { 
      fontFamily: 'Poppins_400Regular', 
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    reorderButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    reorderButtonText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#fff',
    },
    
    // Cards
    deliveryCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    itemsCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    supportCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: Colors.text, marginBottom: 16 },
    
    // Delivery
    deliverySection: { gap: 16 },
    deliveryRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    deliveryInfo: { flex: 1 },
    deliveryLabel: { fontFamily: 'Poppins_600SemiBold', color: Colors.text, marginBottom: 4 },
    deliveryText: { fontFamily: 'Poppins_400Regular', color: Colors.textSecondary },
    deliveryPhone: { fontFamily: 'Poppins_400Regular', color: Colors.textMuted, fontSize: 14 },
    
    // Items
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    itemInfo: { flex: 1 },
    itemName: { fontFamily: 'Poppins_600SemiBold', color: Colors.text, fontSize: 16 },
    itemQuantity: { fontFamily: 'Poppins_400Regular', color: Colors.textMuted, marginTop: 2 },
    itemTotal: { fontFamily: 'Poppins_700Bold', color: Colors.primary, fontSize: 16 },
    
    // Support
    supportButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    supportButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: Colors.primary + '10',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.primary + '30',
    },
    supportButtonText: {
      fontFamily: 'Poppins_600SemiBold',
      color: Colors.primary,
    },
  });
};
