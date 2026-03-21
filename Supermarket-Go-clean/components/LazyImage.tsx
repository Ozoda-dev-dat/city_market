import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface LazyImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  blurRadius?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({
  source,
  style,
  placeholder = 'https://via.placeholder.com/300x200/e0e0e0/808080?text=Loading...',
  fallback = 'https://via.placeholder.com/300x200/ff0000/ffffff?text=Error',
  onLoad,
  onError,
  blurRadius = 0,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageSource, setImageSource] = useState(source);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (viewRef.current) {
      observer.observe(viewRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    setImageSource({ uri: fallback });
    onError?.();
  }, [onError, fallback]);

  const imageStyle = useMemo(() => [
    style,
    {
      backgroundColor: '#f0f0f0',
    },
  ], [style]);

  return (
    <View ref={viewRef} style={style}>
      {isVisible ? (
        <Image
          source={imageSource}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          blurRadius={blurRadius}
          progressiveRenderingEnabled={true}
          resizeMethod="auto"
        />
      ) : (
        <View style={[style, { backgroundColor: '#f0f0f0' }]} />
      )}
      {isLoading && isVisible && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Failed to load</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorText: {
    fontSize: 12,
    color: '#ff0000',
    textAlign: 'center',
  },
});

export default LazyImage;
