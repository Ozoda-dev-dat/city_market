import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Animated,
  Dimensions,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";

const { width } = Dimensions.get('window');

export default function UserOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const { orders } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return order.status !== 'delivered' && order.status !== 'cancelled';
    if (activeTab === 'completed') return order.status === 'delivered';
    return true;
  }).filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      (order.items && (order.items as any[]).some((item: any) => item.name.toLowerCase().includes(query))) ||
      (order.address && order.address.toLowerCase().includes(query))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'confirmed': return Colors.warning;
      case 'preparing': return Colors.info;
      case 'ready': return Colors.primary;
      case 'delivering': return Colors.primary;
      case 'delivered': return '#10B981';
      case 'cancelled': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-outline';
      case 'preparing': return 'restaurant-outline';
      case 'ready': return 'cube-outline';
      case 'delivering': return 'bicycle-outline';
      case 'delivered': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status: string) => {
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

  const OrderCard = ({ order }: { order: any }) => (
    <Animated.View style={styles.orderCard}>
      <Pressable 
        style={styles.orderCardInner}
        onPress={() => router.push(`/order/${order.id}`)}
      >
        {/* Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: getStatusColor(order.status) + '15' }]}>
          <View style={styles.statusLeft}>
            <Text style={styles.orderNumber}>#{order.id.slice(-6)}</Text>
            <Text style={styles.orderDate}>
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('uz-UZ') : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Ionicons name={getStatusIcon(order.status)} size={12} color="#fff" />
            <Text style={styles.statusText}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>
        
        {/* Order Content */}
        <View style={styles.orderContent}>
          <View style={styles.orderItems}>
            <View style={styles.itemsHeader}>
              <Ionicons name="basket" size={16} color={Colors.primary} />
              <Text style={styles.itemsCount}>{order.items?.length || 0} mahsulot</Text>
            </View>
            <Text style={styles.itemsPreview}>
              {order.items?.slice(0, 2).map((item: any) => item.name).join(', ')}
              {order.items?.length > 2 && ' va boshqalar...'}
            </Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
            <Text style={styles.totalLabel}>Jami</Text>
          </View>
        </View>
        
        {/* Order Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryIcon}>
              <Ionicons name="location" size={12} color={Colors.primary} />
            </View>
            <Text style={styles.deliveryText} numberOfLines={1}>{order.address}</Text>
          </View>
          <View style={styles.actionButton}>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Mening buyurtmalarim</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buyurtmalarni qidirish..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: 'Barchasi', count: orders.length },
          { key: 'active', label: 'Faol', count: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length },
          { key: 'completed', label: 'Tugatilgan', count: orders.filter(o => o.status === 'delivered').length },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            <Text style={[
              styles.tabCount,
              activeTab === tab.key && styles.tabCountActive,
            ]}>
              {tab.count}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Buyurtmalar yo'q</Text>
            <Text style={styles.emptyDescription}>
              {activeTab === 'all' 
                ? "Hozircha sizda buyurtmalar yo'q. Katalogdan mahsulotlarni tanlang va buyurtma bering."
                : activeTab === 'active'
                ? "Hozircha faol buyurtmalar yo'q."
                : "Hozircha tugatilgan buyurtmalar yo'q."
              }
            </Text>
            {activeTab === 'all' && (
              <Pressable 
                style={styles.shopButton}
                onPress={() => router.push('/(tabs)/catalog')}
              >
                <Text style={styles.shopButtonText}>Xarid qilish</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}
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
      padding: 16,
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    backButton: { padding: 8 },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: Colors.text,
      marginLeft: 8,
    },
    
    // Tabs
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.card,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: Colors.primary,
    },
    tabText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 14,
      color: Colors.textMuted,
    },
    tabTextActive: {
      color: Colors.primary,
    },
    tabCount: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
      color: Colors.textMuted,
      backgroundColor: Colors.divider,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    tabCountActive: {
      backgroundColor: Colors.primary + '20',
      color: Colors.primary,
    },
    
    // Orders List
    ordersList: {
      gap: 16,
    },
    orderCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 16,
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
      marginBottom: 12,
    },
    orderNumber: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 16,
      color: Colors.text,
    },
    orderDate: {
      fontFamily: 'Poppins_400Regular',
      color: Colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 11,
    },
    orderContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    orderItems: {
      flex: 1,
    },
    itemsCount: {
      fontFamily: 'Poppins_600SemiBold',
      color: Colors.text,
      fontSize: 14,
    },
    itemsPreview: {
      fontFamily: 'Poppins_400Regular',
      color: Colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    orderTotal: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 18,
      color: Colors.primary,
    },
    orderFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deliveryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    deliveryText: {
      fontFamily: 'Poppins_400Regular',
      color: Colors.textMuted,
      fontSize: 12,
      flex: 1,
    },
    
    // Enhanced Design Elements
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: Colors.card,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: Colors.text,
    },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    statusLeft: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    orderCardInner: {
      flex: 1,
    },
    itemsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    priceSection: {
      alignItems: 'flex-end',
    },
    totalLabel: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      color: Colors.textMuted,
      marginTop: 2,
    },
    deliveryIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: Colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Empty State
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 20,
      color: Colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDescription: {
      fontFamily: 'Poppins_400Regular',
      color: Colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
      marginBottom: 24,
      lineHeight: 20,
    },
    shopButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    shopButtonText: {
      fontFamily: 'Poppins_600SemiBold',
      color: '#fff',
    },
  });
};
