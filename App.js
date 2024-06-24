import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import SettingsScreen from './screens/SettingsScreen';
import ListScreen from './screens/ListScreen';

const Tab = createBottomTabNavigator();
const ThemeContext = createContext();

export default function App() {
    const [theme, setTheme] = useState('light'); // Default thema instelling

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
                <Tab.Navigator>
                    <Tab.Screen name="Home" component={HomeScreen} />
                    <Tab.Screen name="Favorites" component={ListScreen} />
                    <Tab.Screen name="Map" component={MapScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
