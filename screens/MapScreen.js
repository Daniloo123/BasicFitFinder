import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const MapScreen = ({ route }) => {
    const { center } = route.params || {};
    const [fitnessCenters, setFitnessCenters] = useState([]);
    const [currentLat, setCurrentLat] = useState(null);
    const [currentLong, setCurrentLong] = useState(null);
    const [theme, setTheme] = useState('');
    const mapRef = useRef(null);

    useEffect(() => {
        // Haal de huidige locatie van de gebruiker op
        const getCurrentPosition = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Toestemming om locatie te benaderen is geweigerd');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setCurrentLat(location.coords.latitude);
            setCurrentLong(location.coords.longitude);
        };

        // Haal fitnesscentra op 
        const fetchFitnessCenters = async () => {
            try {
                const storedCenters = await AsyncStorage.getItem('basicFitLocations');
                if (storedCenters) {
                    setFitnessCenters(JSON.parse(storedCenters));
                } else {
                    const response = await fetch('https://stud.hosted.hr.nl/0955071/hotspot.json'); // Vervang met je eigen endpoint of gebruik een lokaal JSON-bestand
                    const centers = await response.json();
                    setFitnessCenters(centers.basicFitLocations);
                    await AsyncStorage.setItem('basicFitLocations', JSON.stringify(centers.basicFitLocations));
                }
            } catch (error) {
                console.error('Fout bij het ophalen van fitnesscentra:', error);
            }
        };

        // Haal het thema (licht of donker) op uit opslag
        const getTheme = async () => {
            try {
                const value = await AsyncStorage.getItem('theme');
                if (value !== null) {
                    setTheme(value);
                }
            } catch (e) {
                console.error('Fout bij het lezen van de thema waarde', e);
            }
        };

        getCurrentPosition();
        fetchFitnessCenters();
        getTheme();
    }, []);

    useEffect(() => {
        // kaart makne met locaties
        if (center) {
            mapRef.current.animateToRegion({
                latitude: center.latitude,
                longitude: center.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 1000);
        }
    }, [center]);

    return (
        <View style={[styles.container, { backgroundColor: theme === 'light' ? '#FFFFFF' : '#000000' }]}>
            <MapView
                ref={mapRef}
                showsUserLocation={true}
                style={styles.map}
                initialRegion={{
                    latitude: 51.92406928557815,
                    longitude: 4.492373052337382,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {fitnessCenters.map((centerItem) => (
                    <Marker
                        key={centerItem.id}
                        title={centerItem.name}
                        description={centerItem.address}
                        pinColor={center && centerItem.id === center.id ? 'blue' : 'red'} // Markeer geselecteerde locatie
                        coordinate={{
                            latitude: centerItem.latitude,
                            longitude: centerItem.longitude,
                        }}
                    >
                        {center && centerItem.id === center.id && (
                            <Callout>
                                <View>
                                    <Text>{center.name}</Text>
                                    <Text>{center.address}</Text>
                                </View>
                            </Callout>
                        )}
                    </Marker>
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // Zorg dat de container de volledige ruimte inneemt
    },
    map: {
        flex: 1, // Zorg dat de kaart de volledige ruimte inneemt
    },
});

export default MapScreen;
