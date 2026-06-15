import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillingCode, TimeEntry } from './src/types';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import EditCodesScreen from './src/screens/EditCodesScreen';
import rawDefaultCodes from './assets/billing-codes.json';

const defaultCodes = rawDefaultCodes as BillingCode[];

const KEY_CODES = '@keats_codes';
const KEY_UNITS = '@keats_units';
const KEY_START_TIME = '@keats_start_time';
const KEY_END_TIME = '@keats_end_time';
const KEY_WEEKEND_STAT = '@keats_weekend_stat';

const DEFAULT_START: TimeEntry = { hour: 7, minute: 0 };
const DEFAULT_END: TimeEntry = { hour: 15, minute: 0 };

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
        <View style={{ position: 'absolute', left: -4, top: 140, width: 4, height: 36, backgroundColor: '#3a3a3a', borderRadius: 2 }} />
        <View style={{ position: 'absolute', left: -4, top: 190, width: 4, height: 64, backgroundColor: '#3a3a3a', borderRadius: 2 }} />
        <View style={{ position: 'absolute', left: -4, top: 268, width: 4, height: 64, backgroundColor: '#3a3a3a', borderRadius: 2 }} />
        <View style={{ position: 'absolute', right: -4, top: 200, width: 4, height: 80, backgroundColor: '#3a3a3a', borderRadius: 2 }} />

        <View
          style={{
            width: 390,
            height: 844,
            overflow: 'hidden',
            borderRadius: 50,
            backgroundColor: '#000',
          }}
        >
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
    </View>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const [screen, setScreen] = useState<'home' | 'editCodes'>('home');
  const [codes, setCodes] = useState<BillingCode[]>([]);
  const [units, setUnits] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<TimeEntry>(DEFAULT_START);
  const [endTime, setEndTime] = useState<TimeEntry>(DEFAULT_END);
  const [isWeekendStat, setIsWeekendStat] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, u, st, et, ws] = await Promise.all([
          AsyncStorage.getItem(KEY_CODES),
          AsyncStorage.getItem(KEY_UNITS),
          AsyncStorage.getItem(KEY_START_TIME),
          AsyncStorage.getItem(KEY_END_TIME),
          AsyncStorage.getItem(KEY_WEEKEND_STAT),
        ]);
        const stored = c ? (JSON.parse(c) as BillingCode[]) : null;
        const loadedCodes =
          stored && stored.every((bc) => 'payPerUnit' in bc) ? stored : defaultCodes;
        setCodes(loadedCodes);
        setUnits(u ? (JSON.parse(u) as Record<string, number>) : {});
        if (st) setStartTime(JSON.parse(st) as TimeEntry);
        if (et) setEndTime(JSON.parse(et) as TimeEntry);
        if (ws) setIsWeekendStat(ws === 'true');
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

  const handleStartTimeChange = async (t: TimeEntry) => {
    setStartTime(t);
    await AsyncStorage.setItem(KEY_START_TIME, JSON.stringify(t));
  };

  const handleEndTimeChange = async (t: TimeEntry) => {
    setEndTime(t);
    await AsyncStorage.setItem(KEY_END_TIME, JSON.stringify(t));
  };

  const handleWeekendStatChange = async (v: boolean) => {
    setIsWeekendStat(v);
    await AsyncStorage.setItem(KEY_WEEKEND_STAT, v.toString());
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
        startTime={startTime}
        endTime={endTime}
        isWeekendStat={isWeekendStat}
        onUnitsChange={handleUnitsChange}
        onStartTimeChange={handleStartTimeChange}
        onEndTimeChange={handleEndTimeChange}
        onWeekendStatChange={handleWeekendStatChange}
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
