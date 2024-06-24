import React, { useState, useEffect } from 'react';
import { View, Button, Text, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../App';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

const ListScreen = () => {
    const { theme } = useTheme();
    const [favorites, setFavorites] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            // Haal favoriete locaties op uit opslag
            const fetchFavorites = async () => {
                try {
                    const storedFavorites = await AsyncStorage.getItem('favoriteLocations');
                    if (storedFavorites) {
                        setFavorites(JSON.parse(storedFavorites));
                    }
                } catch (error) {
                    console.error('Error fetching favorite locations:', error);
                }
            };

            //  Haal de huidige locatie van de gebruiker op
            const getLocation = async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Locatietoegang geweigerd', 'Toegang tot locatie is nodig om routes weer te geven.');
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                setCurrentLocation(location);
            };

            fetchFavorites();
            getLocation();
        }, [])
    );

    // Navigeer naar de kaartweergave met het geselecteerde fitnesscentrum als centrum
    const navigateToMap = (center) => {
        navigation.navigate('Map', { center });
    };

    // Open Google Maps met de route van de huidige locatie naar het fitnesscentrum
    const getDirections = (destination) => {
        if (!currentLocation) {
            Alert.alert('Locatie niet beschikbaar', 'Huidige locatie is niet beschikbaar. Probeer opnieuw.');
            return;
        }

        const { latitude, longitude } = currentLocation.coords;
        const destinationAddress = `${destination.latitude},${destination.longitude}`;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destinationAddress}&travelmode=driving`;

        Linking.openURL(url);
    };

    return (
        <View style={[styles.container, theme === 'dark' ? styles.darkContainer : styles.lightContainer]}>
            <Text style={[styles.title, theme === 'dark' ? styles.darkText : styles.lightText]}>
                Favoriete Basic-Fit Locaties
            </Text>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.itemContainer, theme === 'dark' ? styles.darkItemContainer : styles.lightItemContainer]}>
                        <Text style={[styles.itemName, theme === 'dark' ? styles.darkText : styles.lightText]}>{item.name}</Text>
                        <Text style={[styles.itemAddress, theme === 'dark' ? styles.darkText : styles.lightText]}>{item.address}</Text>
                        <Button
                            title="Route"
                            onPress={() => getDirections(item)}
                        />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    lightContainer: {
        backgroundColor: '#fff',
    },
    darkContainer: {
        backgroundColor: '#000',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    itemContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 8,
    },
    lightItemContainer: {
        backgroundColor: '#f9f9f9',
    },
    darkItemContainer: {
        backgroundColor: '#333',
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemAddress: {
        fontSize: 16,
        marginBottom: 8,
    },
    lightText: {
        color: '#000',
    },
    darkText: {
        color: '#fff',
    },
});

export default ListScreen;
