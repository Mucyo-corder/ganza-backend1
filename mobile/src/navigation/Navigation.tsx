import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet, Platform, Pressable} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import {useLocalization} from '../localization/LocalizationContext';
import DashboardScreen from '../screens/Home/DashboardScreen';
import ScanScreen from '../screens/Scan/ScanScreen';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import SalesScreen from '../screens/Sales/SalesScreen';
import CustomersScreen from '../screens/Customers/CustomersScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ScanResultScreen from '../screens/Scan/ScanResultScreen';
import SaleDetailScreen from '../screens/Sales/SaleDetailScreen';
import ItemDetailScreen from '../screens/Inventory/ItemDetailScreen';
import {COLORS} from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({label, focused, isScan}: {label: string; focused: boolean; isScan?: boolean}) {
  const icons: Record<string, string> = {
    Ahabanza: '🏠',
    Ububiko: '📦',
    'Scan Imbaho': '📷',
    Igurisha: '💰',
    More: '⋯',
    Home: '🏠',
    Inventory: '📦',
    Scan: '📷',
    Sales: '💰',
  };
  const icon = icons[label] || '•';
  if (isScan) {
    return (
      <View style={[styles.scanTab, focused && styles.scanTabActive]}>
        <Text style={styles.scanIcon}>{icon}</Text>
      </View>
    );
  }
  return <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>;
}

function HomeTabs() {
  const {t} = useLocalization();
  const isWeb = Platform.OS === 'web';

  // Web: sidebar navigation (spec 10)
  if (isWeb) {
    return (
      <View style={styles.webLayout}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarLogo}>GANZA</Text>
          <Text style={styles.sidebarSub}>Wood • Timber • Carpentry</Text>
          <SidebarItem label={t('home')} screen="Home" icon="🏠" />
          <SidebarItem label={t('inventory')} screen="Inventory" icon="📦" />
          <SidebarItem label={t('scan')} screen="Scan" icon="📷" highlight />
          <SidebarItem label={t('sales')} screen="Sales" icon="💰" />
          <SidebarItem label={t('customers')} screen="More" icon="👥" />
          <SidebarItem label={t('reports')} screen="Reports" icon="📊" />
          <View style={styles.sidebarFooter}>
            <Text style={styles.sidebarFooterText}>com.ganza.app • bare RN + Web</Text>
          </View>
        </View>
        <View style={styles.webContent}>
          <Tab.Navigator screenOptions={{headerShown: false, tabBarStyle: {display: 'none'}}}>
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Inventory" component={InventoryScreen} />
            <Tab.Screen name="Scan" component={ScanScreen} />
            <Tab.Screen name="Sales" component={SalesScreen} />
            <Tab.Screen name="More" component={CustomersScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
          </Tab.Navigator>
        </View>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '700', marginTop: 2},
        tabBarIcon: ({focused}) => {
          const isScan = route.name === 'Scan';
          const label = route.name === 'Scan' ? t('scan') : route.name === 'Home' ? t('home') : route.name === 'Inventory' ? t('inventory') : route.name === 'Sales' ? t('sales') : t('customers');
          return <TabIcon label={label} focused={focused} isScan={isScan} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{tabBarLabel: t('home')}} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{tabBarLabel: t('inventory')}} />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: t('scan'),
          tabBarLabelStyle: {fontSize: 11, fontWeight: '800', color: COLORS.gold},
        }}
      />
      <Tab.Screen name="Sales" component={SalesScreen} options={{tabBarLabel: t('sales')}} />
      <Tab.Screen name="More" component={CustomersScreen} options={{tabBarLabel: t('customers')}} />
    </Tab.Navigator>
  );
}

function SidebarItem({label, icon, highlight}: {label: string; screen: string; icon: string; highlight?: boolean}) {
  return (
    <View style={[styles.sidebarItem, highlight && styles.sidebarItemHighlight]}>
      <Text style={styles.sidebarIcon}>{icon}</Text>
      <Text style={[styles.sidebarLabel, highlight && styles.sidebarLabelHighlight]}>{label}</Text>
    </View>
  );
}

export const Navigation: React.FC = () => {
  const {user} = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={HomeTabs} />
            <Stack.Screen name="ScanResult" component={ScanResultScreen} />
            <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabIcon: {fontSize: 22, opacity: 0.85},
  tabIconActive: {opacity: 1},
  scanTab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
    borderWidth: 3,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  scanTabActive: {backgroundColor: COLORS.goldDark || '#B8860B'},
  scanIcon: {fontSize: 28},
  webLayout: {flex: 1, flexDirection: 'row', backgroundColor: COLORS.background},
  sidebar: {width: 260, backgroundColor: COLORS.surface, borderRightWidth: 1, borderRightColor: COLORS.border, padding: 16, paddingTop: 32},
  sidebarLogo: {fontSize: 28, fontWeight: '900', color: COLORS.gold, letterSpacing: 2},
  sidebarSub: {fontSize: 11, color: COLORS.textMuted, marginBottom: 24, letterSpacing: 1, textTransform: 'uppercase'},
  sidebarItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4},
  sidebarItemHighlight: {backgroundColor: COLORS.gold, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3},
  sidebarIcon: {fontSize: 18, marginRight: 12},
  sidebarLabel: {color: COLORS.text, fontSize: 14, fontWeight: '600'},
  sidebarLabelHighlight: {color: COLORS.background, fontWeight: '800'},
  sidebarFooter: {marginTop: 'auto', paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border},
  sidebarFooterText: {fontSize: 10, color: COLORS.textMuted},
  webContent: {flex: 1, backgroundColor: COLORS.background},
});
