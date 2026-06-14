import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillingCode } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import EditCodesScreen from './src/screens/EditCodesScreen';
import rawDefaultCodes from './assets/billing-codes.json';

const defaultCodes = rawDefaultCodes as BillingCode[];

const KEY_CODES = '@keats_codes';
const KEY_UNITS = '@keats_units';
const KEY_HOURS = '@keats_hours';

export default function App() {
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

  if (screen === 'editCodes') {
    return (
      <>
        <StatusBar style="dark" />
        <EditCodesScreen
          codes={codes}
          defaultCodes={defaultCodes}
          onSave={handleCodesChange}
          onClose={() => setScreen('home')}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <HomeScreen
        codes={codes}
        units={units}
        shiftHours={shiftHours}
        onUnitsChange={handleUnitsChange}
        onShiftHoursChange={handleShiftHoursChange}
        onEditCodes={() => setScreen('editCodes')}
      />
    </>
  );
}
