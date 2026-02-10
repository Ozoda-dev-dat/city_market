import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AddressState {
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  setAddress: (address: string, lat: number, lng: number) => void;
  clearAddress: () => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      addressText: null,
      lat: null,
      lng: null,
      setAddress: (address, lat, lng) => set({ addressText: address, lat, lng }),
      clearAddress: () => set({ addressText: null, lat: null, lng: null }),
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
