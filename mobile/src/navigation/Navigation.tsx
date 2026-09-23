import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet, Platform, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../hooks/useAuth';
import {useLocalization} from '../localization/LocalizationContext';
import {COLORS} from '../constants/theme';
import DashboardScreen from '../screens/Home/DashboardScreen';
import ScanScreen from '../screens/Scan/ScanScreen';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import SalesScreen from '../screens/Sales/SalesScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ScanResultScreen from '../screens/Scan/ScanResultScreen';
import SaleDetailScreen from '../screens/Sales/SaleDetailScreen';
import ItemDetailScreen from '../screens/Inventory/ItemDetailScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GANZA_ICON = (() => {
  try {
    return require('../../assets/android-icon-foreground.png');
  } catch {
    return require('../../assets/icon.png');
  }
})();

function TabIcon({icon, label, focused, isScan}: {icon: string; label: string; focused: boolean; isScan?: boolean}) {
  if (isScan) {
    return (
      <View style={styles.scanWrap}>
        <LinearGradient
          colors={focused ? (['#60A5FA', '#2563EB'] as unknown as string[]) : (['#3B82F6', '#1E40AF'] as unknown as string[])}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.scanTab, focused && styles.scanTabActive]}
        >
          <Text style={styles.scanIcon}>{icon}</Text>
        </LinearGradient>
        <Text style={[styles.scanLabel, focused && styles.scanLabelActive]}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
        <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

function HomeTabs() {
  const {t} = useLocalization();
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    // Web: simple sidebar — ONLY wood-stock management, no agent
    return (
      <View style={styles.webLayout}>
        <LinearGradient colors={['#050A1B', '#0A1930', '#0D2447'] as unknown as string[]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarLogoWrap}>
              <LinearGradient colors={['#EAF2FD', '#A9BFD3', '#7BA0C2'] as unknown as string[]} style={styles.sidebarLogoRim}>
                <View style={styles.sidebarLogoInner}>
                  <Image source={GANZA_ICON} style={styles.sidebarLogoImg} resizeMode="contain" />
                </View>
              </LinearGradient>
              <View style={styles.sidebarWordmark}>
                <Text style={styles.sidebarLogoText}>GANZA</Text>
                <Text style={styles.sidebarSub}>Wood inventory</Text>
              </View>
            </View>
          </View>

          <SidebarItem label={t('home')} icon="◈" active />
          <SidebarItem label="Fata Ifoto" icon="⬢" />
          <SidebarItem label={t('inventory')} icon="⬡" />
          <SidebarItem label={t('sales')} icon="◆" />
          <SidebarItem label={t('reports')} icon="▭" />
          <SidebarItem label={t('settingsScreen')} icon="⚙︎" />

          <View style={styles.sidebarFooter}>
            <Text style={styles.sidebarFooterText}>com.ganza.app • Calm • Premium</Text>
          </View>
        </LinearGradient>
        <View style={styles.webContent}>
          <Tab.Navigator screenOptions={{headerShown: false, tabBarStyle: {display: 'none'}}}>
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Scan" component={ScanScreen} />
            <Tab.Screen name="Inventory" component={InventoryScreen} />
            <Tab.Screen name="Sales" component={SalesScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </View>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#5E728C',
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(8,16,38,0.92)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)'}]} />
            <View style={styles.tabBarHighlight} />
          </View>
        ),
        tabBarIcon: ({focused}) => {
          const name = route.name;
          if (name === 'Home') return <TabIcon icon="◈" label={t('home')} focused={focused} />;
          if (name === 'Scan') return <TabIcon icon="⬢" label="Fata" focused={focused} isScan />;
          if (name === 'Inventory') return <TabIcon icon="⬡" label="Ububiko" focused={focused} />;
          if (name === 'Sales') return <TabIcon icon="◆" label="Gurisha" focused={focused} />;
          if (name === 'Reports') return <TabIcon icon="▭" label="Raporo" focused={focused} />;
          if (name === 'Settings') return <TabIcon icon="⚙︎" label="Igena" focused={focused} />;
          return <TabIcon icon="•" label={name} focused={focused} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{tabBarLabel: 'Scan'}} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function SidebarItem({label, icon, active}: {label: string; icon: string; active?: boolean}) {
  return (
    <View style={[styles.sidebarItem, active && styles.sidebarItemActive]}>
      {active && <View style={styles.sidebarActiveBar} />}
      <View style={styles.sidebarIconBox}>
        <Text style={styles.sidebarIcon}>{icon}</Text>
      </View>
      <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>{label}</Text>
      {active && <View style={styles.sidebarActiveDot} />}
    </View>
  );
}

export const Navigation: React.FC = () => {
  const {user} = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: COLORS.background}, animation: 'slide_from_right'}}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={HomeTabs} />
            <Stack.Screen name="ScanResult" component={ScanResultScreen as unknown as React.ComponentType<any>} />
            <Stack.Screen name="SaleDetail" component={SaleDetailScreen as unknown as React.ComponentType<any>} />
            <Stack.Screen name="ItemDetail" component={ItemDetailScreen as unknown as React.ComponentType<any>} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            {/* Keep stack shortcuts for direct nav */}
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="Sales" component={SalesScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 8,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabBarHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(176,208,255,0.08)',
  },
  tabItem: {alignItems: 'center', justifyContent: 'center', minWidth: 56, paddingTop: 4},
  tabIconWrap: {width: 36, height: 28, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  tabIconWrapActive: {backgroundColor: 'rgba(96,165,250,0.10)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.14)'},
  tabIcon: {fontSize: 16, color: '#5E728C', opacity: 0.85},
  tabIconActive: {color: '#93C5FD', opacity: 1},
  tabLabel: {fontSize: 9, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: '#5E728C', marginTop: 3},
  tabLabelActive: {color: '#93C5FD'},
  activeDot: {width: 4, height: 4, borderRadius: 2, backgroundColor: '#60A5FA', marginTop: 3},
  scanWrap: {alignItems: 'center', justifyContent: 'center', top: -6},
  scanTab: {width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', shadowColor: '#3B82F6', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10, overflow: 'hidden'},
  scanTabActive: {shadowOpacity: 0.45, shadowRadius: 20},
  scanIcon: {fontSize: 20, color: '#fff', fontWeight: '700'},
  scanLabel: {fontSize: 9, fontWeight: '800', color: '#5E728C', marginTop: 4, letterSpacing: 0.6, textTransform: 'uppercase'},
  scanLabelActive: {color: '#93C5FD'},
  webLayout: {flex: 1, flexDirection: 'row', backgroundColor: COLORS.background},
  sidebar: {width: 280, padding: 16, paddingTop: 24, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)'},
  sidebarHeader: {marginBottom: 20, borderRadius: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'},
  sidebarLogoWrap: {flexDirection: 'row', alignItems: 'center'},
  sidebarLogoRim: {width: 46, height: 46, borderRadius: 14, padding: 1},
  sidebarLogoInner: {flex: 1, borderRadius: 13, backgroundColor: '#0A1930', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'},
  sidebarLogoImg: {width: 34, height: 34},
  sidebarWordmark: {marginLeft: 12},
  sidebarLogoText: {fontSize: 20, fontWeight: '900', letterSpacing: 2.2, color: '#F1F6FF'},
  sidebarSub: {fontSize: 10, color: '#8FA2BB', letterSpacing: 0.6, marginTop: 1},
  sidebarItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 14, marginBottom: 4, borderWidth: 1, borderColor: 'transparent'},
  sidebarItemActive: {backgroundColor: 'rgba(96,165,250,0.10)', borderColor: 'rgba(96,165,250,0.14)'},
  sidebarActiveBar: {position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, backgroundColor: '#60A5FA'},
  sidebarActiveDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA', marginLeft: 'auto'},
  sidebarIconBox: {width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12},
  sidebarIcon: {fontSize: 13, color: '#CBD8E6', fontWeight: '700'},
  sidebarLabel: {color: '#8FA2BB', fontSize: 13, fontWeight: '600'},
  sidebarLabelActive: {color: '#EAF2FD', fontWeight: '700'},
  sidebarFooter: {marginTop: 'auto', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)'},
  sidebarFooterText: {fontSize: 10, color: '#5E728C', letterSpacing: 0.4},
  webContent: {flex: 1, backgroundColor: COLORS.background},
});
