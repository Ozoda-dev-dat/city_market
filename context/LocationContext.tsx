import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { User } from "@/shared/schema";

interface LocationContextValue {
  location: {
    latitude: string;
    longitude: string;
    address: string;
  } | null;
  updateUserLocation: (latitude: string, longitude: string, address: string) => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  isLoading: boolean;
  permissionGranted: boolean;
  locationError: string | null;
}

const LocationContext = createContext<LocationContextValue | null>(null);

const LOCATION_STORAGE_KEY = "@freshmart_location";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationContextValue['location']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        setLocation(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load location:", e);
    }
  };

  const saveLocation = async (locationData: LocationContextValue['location']) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
      await AsyncStorage.setItem('@user_location', JSON.stringify(locationData)); // Also save with cart key
      setLocation(locationData);
    } catch (e) {
      console.error("Failed to save location:", e);
    }
  };

  const checkPermissions = async (): Promise<boolean> => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  const buildAddress = async (latitude: number, longitude: number): Promise<string> => {
    let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const parts: string[] = [];
        if (place.street) parts.push(place.street);
        if (place.district) parts.push(place.district);
        if (place.city) parts.push(place.city);
        if (parts.length > 0) {
          address = parts.join(", ");
        } else if (place.region) {
          address = place.region;
        }
      }
    } catch (_) {}
    return address;
  };

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setLocationError(null);

    try {
      const hasPermission = await checkPermissions();
      setPermissionGranted(hasPermission);

      if (!hasPermission) {
        setLocationError("Joylashuvga ruxsat berilmagan. Sozlamalardan ruxsat bering.");
        setIsLoading(false);
        return;
      }

      let coords: { latitude: number; longitude: number } | null = null;

      try {
        // Try accurate current position first (may fail on simulator or indoors)
        const result = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = result.coords;
      } catch (_) {
        // Fallback: use last known position if GPS fix failed
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last) coords = last.coords;
        } catch (__) {}
      }

      if (!coords) {
        setLocationError("Joylashuv aniqlanmadi. GPS ishlayotganini tekshiring yoki manzilni qo'lda kiriting.");
        setIsLoading(false);
        return;
      }

      const { latitude, longitude } = coords;
      const address = await buildAddress(latitude, longitude);

      await saveLocation({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address,
      });
    } catch (error) {
      console.warn("Location error (non-critical):", error);
      setLocationError("Joylashuv aniqlanmadi. Manzilni qo'lda kiriting.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserLocation = async (latitude: string, longitude: string, address: string) => {
    try {
      const authData = await AsyncStorage.getItem('@freshmart_auth');
      if (!authData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(authData);
      const userId = user.id;
      
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 20000); // Increased to 20 seconds
      
      try {
        const { getApiUrl } = await import('@/lib/query-client');
        const apiUrl = getApiUrl();
        
        const response = await fetch(`${apiUrl}/api/user/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, latitude, longitude, address }),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to update location');
        }

        const updatedUser = await response.json();
        
        const locationData = {
          latitude,
          longitude,
          address,
        };

        await saveLocation(locationData);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error("Error updating user location:", error);
      throw error;
    }
  };

  const value: LocationContextValue = {
    location,
    updateUserLocation,
    getCurrentLocation,
    isLoading,
    permissionGranted,
    locationError,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within LocationProvider");
  return context;
}
