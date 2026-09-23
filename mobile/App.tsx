import React from 'react';
import {StatusBar} from 'react-native';
import {Navigation} from './src/navigation/Navigation';
import {LocalizationProvider} from './src/localization/LocalizationContext';
import {AuthProvider} from './src/hooks/useAuth';
import {COLORS} from './src/constants/theme';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <AuthProvider>
        <LocalizationProvider>
          <Navigation />
        </LocalizationProvider>
      </AuthProvider>
    </>
  );
}
