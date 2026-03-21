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
}

const LocationContext = createContext<LocationContextValue | null>(null);

const LOCATION_STORAGE_KEY = "@freshmart_location";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationContextValue['location']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

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

  const getCurrentLocation = async () => {
    setIsLoading(true);
    
    try {
      const hasPermission = await checkPermissions();
      setPermissionGranted(hasPermission);

      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      
      // Reverse geocoding would require a service, for now we'll use coordinates
      const locationData = {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
      };

      await saveLocation(locationData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
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
        let apiUrl = process.env.EXPO_PUBLIC_API_URL;
        if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
          apiUrl = "https://katabatic-unwarrantedly-renay.ngrok-free.dev";
        } else if (!apiUrl) {
          apiUrl = "http://192.168.0.153:5001";
        }
        
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
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within LocationProvider");
  return context;
}
