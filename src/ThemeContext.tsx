import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  bg: string;
  cardBg: string;
  headerBg: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  blue: string;
  blueTint: string;
  blueLight: string;
  green: string;
  greenTint: string;
  red: string;
  redTint: string;
  orange: string;
  inputBg: string;
  controlBg: string;
  countBg: string;
  countText: string;
  countSubText: string;
  progressBg: string;
  modalBg: string;
  activeBorder: string;
}

export const lightTheme: Theme = {
  bg: '#F2F2F7',
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textTertiary: '#8E8E93',
  border: '#C6C6C8',
  blue: '#007AFF',
  blueTint: '#EEF4FF',
  blueLight: '#5A9FFF',
  green: '#34C759',
  greenTint: '#F0FBF0',
  red: '#FF3B30',
  redTint: '#FFF2F0',
  orange: '#FF9500',
  inputBg: '#F2F2F7',
  controlBg: '#F2F2F7',
  countBg: '#EEF4FF',
  countText: '#007AFF',
  countSubText: '#5A9FFF',
  progressBg: '#E5E5EA',
  modalBg: '#FFFFFF',
  activeBorder: '#007AFF',
};

export const darkTheme: Theme = {
  bg: '#000000',
  cardBg: '#1C1C1E',
  headerBg: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',
  border: '#38383A',
  blue: '#0A84FF',
  blueTint: 'rgba(10,132,255,0.15)',
  blueLight: '#5AC8FA',
  green: '#30D158',
  greenTint: 'rgba(48,209,88,0.12)',
  red: '#FF453A',
  redTint: 'rgba(255,69,58,0.12)',
  orange: '#FF9F0A',
  inputBg: '#2C2C2E',
  controlBg: '#2C2C2E',
  countBg: 'rgba(10,132,255,0.18)',
  countText: '#0A84FF',
  countSubText: '#5AC8FA',
  progressBg: '#3A3A3C',
  modalBg: '#2C2C2E',
  activeBorder: '#0A84FF',
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

const KEY_DARK = '@keats_dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY_DARK).then((val) => {
      if (val === 'true') setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(KEY_DARK, next.toString());
  };

  return (
    <ThemeContext.Provider
      value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
