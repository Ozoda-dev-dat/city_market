import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import LazyImage from './LazyImage';

interface PaginatedListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  pageSize?: number;
  onEndReached?: () => void;
  onRefresh?: () => Promise<void>;
  loadingMore?: boolean;
  refreshing?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: any;
  estimatedItemSize?: number;
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
}

interface PaginatedData<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

function PaginatedList<T>({
  data,
  renderItem,
  keyExtractor,
  pageSize = 20,
  onEndReached,
  onRefresh,
  loadingMore = false,
  refreshing = false,
  header,
  footer,
  emptyComponent,
  showsVerticalScrollIndicator = true,
  contentContainerStyle,
  estimatedItemSize = 100,
  getItemLayout,
}: PaginatedListProps<T>) {
  const { isDarkMode } = useTheme();
  const [visibleData, setVisibleData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Update visible data when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      const newPage = Math.ceil(data.length / pageSize);
      setCurrentPage(newPage);
      setHasMore(data.length >= pageSize);
      setVisibleData(data);
    } else {
      setVisibleData([]);
      setCurrentPage(1);
      setHasMore(false);
    }
  }, [data, pageSize]);

  // Handle end reached
  const handleEndReached = useCallback(() => {
    if (!loading && !loadingMore && hasMore && onEndReached) {
      setLoading(true);
      onEndReached();
    }
  }, [loading, loadingMore, hasMore, onEndReached]);

  // Memoized render functions
  const memoizedRenderItem = useCallback(renderItem, [renderItem]);
  const memoizedKeyExtractor = useCallback(keyExtractor, [keyExtractor]);

  // Memoized empty component
  const memoizedEmptyComponent = useMemo(() => {
    if (emptyComponent) return emptyComponent;
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa' }]}>
        <Text style={[styles.emptyText, { color: isDarkMode ? '#fff' : '#666' }]}>
          No items available
        </Text>
      </View>
    );
  }, [emptyComponent, isDarkMode]);

  // Memoized footer
  const memoizedFooter = useMemo(() => {
    if (footer) return footer;
    
    if (loadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#666' }]}>
            Loading more...
          </Text>
        </View>
      );
    }
    
    if (!hasMore && visibleData.length > 0) {
      return (
        <View style={styles.endFooter}>
          <Text style={[styles.endText, { color: isDarkMode ? '#fff' : '#666' }]}>
            No more items
          </Text>
        </View>
      );
    }
    
    return null;
  }, [footer, loadingMore, hasMore, visibleData.length, isDarkMode]);

  // Memoized header
  const memoizedHeader = useMemo(() => header, [header]);

  return (
    <FlatList
      data={visibleData}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      ListHeaderComponent={memoizedHeader}
      ListFooterComponent={memoizedFooter}
      ListEmptyComponent={memoizedEmptyComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      getItemLayout={getItemLayout}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={21}
      removeClippedSubviews={true}
      scrollEventThrottle={16}
      decelerationRate="fast"
      style={styles.list}
    />
  );
}

// Hook for paginated data management
export function usePaginatedData<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  pageSize: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      setError(null);
      
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await fetchFunction(pageNum, pageSize);
      
      if (pageNum === 1 || isRefresh) {
        setData(result.data);
        setPage(2);
      } else {
        setData(prev => [...prev, ...result.data]);
        setPage(pageNum + 1);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchFunction, pageSize]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !error) {
      loadData(page, false);
    }
  }, [loadData, page, loadingMore, hasMore, error]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData(1, true);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, []);

  return {
    data,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadMore,
    refresh,
    reset,
  };
}

// Optimized product list component
export function OptimizedProductList({
  products,
  onProductPress,
  onEndReached,
  onRefresh,
  loadingMore,
  refreshing,
}: {
  products: any[];
  onProductPress: (product: any) => void;
  onEndReached?: () => void;
  onRefresh?: () => Promise<void>;
  loadingMore?: boolean;
  refreshing?: boolean;
}) {
  const { isDarkMode } = useTheme();

  const renderProduct = useCallback(({ item, index }: { item: any; index: number }) => {
    return (
      <Pressable
        key={item.id}
        style={[
          styles.productItem,
          { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }
        ]}
        onPress={() => onProductPress(item)}
      >
        <LazyImage
          source={{ uri: item.image }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text
            style={[
              styles.productName,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.productPrice,
              { color: '#007AFF' }
            ]}
          >
            ${item.price}
          </Text>
        </View>
      </Pressable>
    );
  }, [onProductPress, isDarkMode]);

  const keyExtractor = useCallback((item: any, index: number) => {
    return item.id || `product-${index}`;
  }, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 120,
    offset: 120 * index,
    index,
  }), []);

  return (
    <PaginatedList
      data={products}
      renderItem={renderProduct}
      keyExtractor={keyExtractor}
      pageSize={20}
      onEndReached={onEndReached}
      onRefresh={onRefresh}
      loadingMore={loadingMore}
      refreshing={refreshing}
      estimatedItemSize={120}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  endFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  endText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  productItem: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaginatedList;
