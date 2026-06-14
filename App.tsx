import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillingCode } from './src/types';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import EditCodesScreen from './src/screens/EditCodesScreen';
import rawDefaultCodes from './assets/billing-codes.json';

const defaultCodes = rawDefaultCodes as BillingCode[];

const KEY_CODES = '@keats_codes';
const KEY_UNITS = '@keats_units';
const KEY_HOURS = '@keats_hours';

function WebPhoneFrame({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0d1117',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer phone shell */}
      <View
        style={{
          width: 406,
          height: 860,
          borderRadius: 58,
          backgroundColor: isDark ? '#1a1a1a' : '#2a2a2a',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 30 },
          shadowOpacity: 0.8,
          shadowRadius: 60,
          elevation: 20,
        }}
      >
        {/* Side buttons (decorative) */}
        <View style={{
          position: 'absolute',
          left: -4,
          top: 140,
          width: 4,
          height: 36,
          backgroundColor: '#3a3a3a',
          borderRadius: 2,
        }} />
        <View style={{
          position: 'absolute',
          left: -4,
          top: 190,
          width: 4,
          height: 64,
          backgroundColor: '#3a3a3a',
          borderRadius: 2,
        }} />
        <View style={{
          position: 'absolute',
          left: -4,
          top: 268,
          width: 4,
          height: 64,
          backgroundColor: '#3a3a3a',
          borderRadius: 2,
        }} />
        <View style={{
          position: 'absolute',
          right: -4,
          top: 200,
          width: 4,
          height: 80,
          backgroundColor: '#3a3a3a',
          borderRadius: 2,
        }} />

        {/* Screen area */}
        <View
          style={{
            width: 390,
            height: 844,
            overflow: 'hidden',
            borderRadius: 50,
            backgroundColor: '#000',
          }}
        >
          {/* Dynamic Island */}
          <View
            style={{
              position: 'absolute',
              top: 13,
              alignSelf: 'center',
              width: 126,
              height: 37,
              backgroundColor: '#000',
              borderRadius: 20,
              zIndex: 100,
            }}
          />
          {children}
        </View>
      </View>
      <View style={{ marginTop: 16, opacity: 0.4 }}>
      </View>
    </View>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const [screen, setScreen] = useState<'home' | 'editCodes'>('home');
  const [codes, setCodes] = useState<BillingCode[]>([]);
  const [units, setUnits] = useState<Record<string, number>>({});
  const [shiftHours, setShiftHours] = useState(8);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, u, h] = await Promise.all([
          AsyncStorage.getItem(KEY_CODES),
          AsyncStorage.getItem(KEY_UNITS),
          AsyncStorage.getItem(KEY_HOURS),
        ]);
        setCodes(c ? (JSON.parse(c) as BillingCode[]) : defaultCodes);
        setUnits(u ? (JSON.parse(u) as Record<string, number>) : {});
        setShiftHours(h ? parseFloat(h) : 8);
      } catch {
        setCodes(defaultCodes);
      }
      setReady(true);
    })();
  }, []);

  const handleUnitsChange = async (newUnits: Record<string, number>) => {
    setUnits(newUnits);
    await AsyncStorage.setItem(KEY_UNITS, JSON.stringify(newUnits));
  };

  const handleShiftHoursChange = async (hours: number) => {
    setShiftHours(hours);
    await AsyncStorage.setItem(KEY_HOURS, hours.toString());
  };

  const handleCodesChange = async (newCodes: BillingCode[]) => {
    setCodes(newCodes);
    await AsyncStorage.setItem(KEY_CODES, JSON.stringify(newCodes));
  };

  if (!ready) return null;

  const screenContent =
    screen === 'editCodes' ? (
      <EditCodesScreen
        codes={codes}
        defaultCodes={defaultCodes}
        onSave={handleCodesChange}
        onClose={() => setScreen('home')}
      />
    ) : (
      <HomeScreen
        codes={codes}
        units={units}
        shiftHours={shiftHours}
        onUnitsChange={handleUnitsChange}
        onShiftHoursChange={handleShiftHoursChange}
        onEditCodes={() => setScreen('editCodes')}
      />
    );

  if (Platform.OS === 'web') {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <WebPhoneFrame>{screenContent}</WebPhoneFrame>
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {screenContent}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
