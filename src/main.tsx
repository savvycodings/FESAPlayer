import { useContext, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Shop, Settings, Search, Grade, Profile, Product, Category, SetProducts, ViewProfile, MyStore } from './screens'
import { Header } from './components'
import FeatherIcon from '@expo/vector-icons/Feather'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { ThemeContext } from './context'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Search Stack Navigator
function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SearchMain" component={Search} />
      <Stack.Screen name="Product" component={Product} />
      <Stack.Screen name="Category" component={Category} />
      <Stack.Screen name="SetProducts" component={SetProducts} />
      <Stack.Screen name="ViewProfile" component={ViewProfile} />
    </Stack.Navigator>
  )
}

// Shop Stack Navigator
function ShopStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ShopMain" component={Shop} />
      <Stack.Screen name="Product" component={Product} />
      <Stack.Screen name="SetProducts" component={SetProducts} />
      <Stack.Screen name="ViewProfile" component={ViewProfile} />
    </Stack.Navigator>
  )
}

// Profile Stack Navigator
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="Product" component={Product} />
      <Stack.Screen name="ViewProfile" component={ViewProfile} />
    </Stack.Navigator>
  )
}

// MyStore Stack Navigator
function MyStoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MyStoreMain" component={MyStore} />
      <Stack.Screen name="Product" component={Product} />
    </Stack.Navigator>
  )
}

function MainComponent() {
  const insets = useSafeAreaInsets()
  const { theme } = useContext(ThemeContext)
  const styles = getStyles({ theme, insets })
  
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.tabBarActiveTintColor,
          tabBarInactiveTintColor: theme.tabBarInactiveTintColor,
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: theme.backgroundColor,
          },
          tabBarLabelStyle: {
            textAlign: 'center',
          },
          tabBarIconStyle: {
            alignSelf: 'center',
          },
        }}
      >
        <Tab.Screen
          name="Shop"
          component={ShopStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="shopping-cart"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="search"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Grade"
          component={Grade}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="aperture"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="user"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="MyStore"
          component={MyStoreStack}
          options={{
            headerShown: false,
            tabBarLabel: 'My Store',
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="shopping-bag"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="sliders"
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

export function Main() {
  return (
    <SafeAreaProvider>
      <MainComponent />
    </SafeAreaProvider>
  )
}

const getStyles = ({ theme, insets } : { theme: any, insets: any}) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },
})
