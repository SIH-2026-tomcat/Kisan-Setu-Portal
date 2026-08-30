import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type LocationStatus = 'IDLE' | 'GETTING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE';

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  locationStatus: LocationStatus;
  locationMsg: string;
  handleGetLocation: () => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('IDLE');
  const [locationMsg, setLocationMsg] = useState<string>('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('UNAVAILABLE');
      setLocationMsg(t('location.locationUnavailable'));
      return;
    }

    setLocationStatus('GETTING');
    setLocationMsg(t('location.gettingLocation'));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus('GRANTED');
        setLocationMsg('');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('DENIED');
          setLocationMsg(t('location.locationDenied'));
        } else {
          setLocationStatus('UNAVAILABLE');
          setLocationMsg(t('location.locationUnavailable'));
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearLocation = () => {
    setUserLocation(null);
    setLocationStatus('IDLE');
    setLocationMsg('');
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationStatus,
        locationMsg,
        handleGetLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
