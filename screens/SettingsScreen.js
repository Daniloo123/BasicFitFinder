import React, { useEffect, useState } from 'react';
import { SafeAreaView, Switch, Text, StyleSheet } from 'react-native';
import { useTheme } from '../App'; // Importeer useTheme

export default function SettingsScreen() {
    const { theme, setTheme } = useTheme(); // Haal het huidige thema en de setter op uit de context
    const [isEnabled, setIsEnabled] = useState(theme === 'dark');

    useEffect(() => {
        setIsEnabled(theme === 'dark');
    }, [theme]);

    const toggleSwitch = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={theme === 'dark' ? styles.darkText : styles.lightText}>Dark Mode</Text>
            <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isEnabled}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lightText: {
        color: '#000',
    },
    darkText: {
        color: '#fff',
    },
});
