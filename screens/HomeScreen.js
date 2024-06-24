import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, Alert, Share, TextInput, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { useTheme } from '../App';

const HomeScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [fitnessCenters, setFitnessCenters] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editedCenter, setEditedCenter] = useState(null);
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');

    // Gegevens ophalen en lokaal opslaan
    useEffect(() => {
        const fetchFitnessCenters = async () => {
            try {
                const storedCenters = await AsyncStorage.getItem('basicFitLocations');
                if (storedCenters) {
                    setFitnessCenters(JSON.parse(storedCenters));
                } else {
                    const response = await fetch('https://stud.hosted.hr.nl/0955071/hotspot.json');
                    const centers = await response.json();
                    setFitnessCenters(centers.basicFitLocations);
                    await AsyncStorage.setItem('basicFitLocations', JSON.stringify(centers.basicFitLocations));
                }
            } catch (error) {
                console.error('Error fetching fitness centers:', error);
            }
        };
        // Favorieten ophalen uit opslag
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
        // Locatie ophalen  
        const getLocation = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Locatietoegang geweigerd', 'Toegang tot locatie is nodig om routes weer te geven.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setCurrentLocation(location);
        };

        fetchFitnessCenters();
        fetchFavorites();
        getLocation();
    }, []);

    // favorieten toggle
    const toggleFavorite = async (center) => {
        let newFavorites;
        if (favorites.some(fav => fav.id === center.id)) {
            newFavorites = favorites.filter(fav => fav.id !== center.id);
        } else {
            newFavorites = [...favorites, center];
        }
        setFavorites(newFavorites);
        await AsyncStorage.setItem('favoriteLocations', JSON.stringify(newFavorites));
    };

    // Controleer of een locatie favoriet is
    const isFavorite = (center) => {
        return favorites.some(fav => fav.id === center.id);
    };

    // Open de modal om een locatie te bewerken
    const openEditModal = (center) => {
        setEditedCenter(center);
        setEditName(center.name);
        setEditAddress(center.address);
        setEditModalVisible(true);
    };

    // Sla de bewerkte locatie op
    const saveEditedLocation = async () => {
        const updatedCenter = { ...editedCenter, name: editName, address: editAddress };
        const updatedFitnessCenters = fitnessCenters.map(center => {
            if (center.id === updatedCenter.id) {
                return updatedCenter;
            }
            return center;
        });
        setFitnessCenters(updatedFitnessCenters);
        await AsyncStorage.setItem('basicFitLocations', JSON.stringify(updatedFitnessCenters));

        // Werk favorieten bij als de bewerkte locatie een favoriet was
        const updatedFavorites = favorites.map(fav => {
            if (fav.id === updatedCenter.id) {
                return updatedCenter;
            }
            return fav;
        });
        setFavorites(updatedFavorites);
        await AsyncStorage.setItem('favoriteLocations', JSON.stringify(updatedFavorites));

        setEditModalVisible(false);
    };

    // Verwijder een locatie met authenticatie
    const deleteLocation = async (centerToDelete) => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Verifieer om te verwijderen',
            });

            if (auth.success) {
                const updatedFitnessCenters = fitnessCenters.filter(center => center.id !== centerToDelete.id);
                setFitnessCenters(updatedFitnessCenters);
                await AsyncStorage.setItem('basicFitLocations', JSON.stringify(updatedFitnessCenters));

                const updatedFavorites = favorites.filter(fav => fav.id !== centerToDelete.id);
                setFavorites(updatedFavorites);
                await AsyncStorage.setItem('favoriteLocations', JSON.stringify(updatedFavorites));
            } else {
                Alert.alert('Verificatie mislukt', 'Biometrische verificatie is niet gelukt.');
            }
        } else {
            Alert.alert('Geen biometrische beveiliging beschikbaar', 'Uw apparaat ondersteunt geen biometrische verificatie of er zijn geen biometrische gegevens geregistreerd.');
        }
    };

    // Navigeer naar de kaart met de geselecteerde locatie
    const navigateToMap = (center) => {
        navigation.navigate('Map', { center });
    };

    // Vraag routebeschrijving op naar de geselecteerde locatie
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

    // Deel de locatie via deelopties van het apparaat
    const shareLocation = async (center) => {
        try {
            const locationUrl = `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`;
            const result = await Share.share({
                message: `Bekijk deze Basic-Fit locatie: ${center.name}, Adres: ${center.address}. Je kunt het hier vinden: ${locationUrl}`,
            });

        } catch (error) {
            Alert.alert('Fout bij delen', error.message);
        }
    };

    // item in de lijst
    const renderItem = ({ item }) => (
        <View style={[styles.itemContainer, theme === 'dark' ? styles.darkItemContainer : styles.lightItemContainer]}>
            <Text style={[styles.itemName, theme === 'dark' ? styles.darkText : styles.lightText]}>{item.name}</Text>
            <Text style={[styles.itemAddress, theme === 'dark' ? styles.darkText : styles.lightText]}>{item.address}</Text>
            <View style={styles.buttonsContainer}>
                <Button
                    title="Ga naar"
                    onPress={() => navigateToMap(item)}
                />
                <Button
                    title="Route"
                    onPress={() => getDirections(item)}
                />
                <TouchableOpacity onPress={() => toggleFavorite(item)}>
                    <Text style={styles.favoriteButton}>
                        {isFavorite(item) ? '★' : '☆'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Text style={styles.editButton}>Bewerk</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteLocation(item)}>
                    <Text style={styles.deleteButton}>Verwijder</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => shareLocation(item)}>
                    <Text style={styles.shareButton}>Deel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, theme === 'dark' ? styles.darkContainer : styles.lightContainer]}>
            <Text style={[styles.title, theme === 'dark' ? styles.darkText : styles.lightText]}>
                Basic-Fit Locaties in Rotterdam
            </Text>
            <FlatList
                data={fitnessCenters}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
            />
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Bewerk Locatie</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Naam"
                            value={editName}
                            onChangeText={setEditName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Adres"
                            value={editAddress}
                            onChangeText={setEditAddress}
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Opslaan" onPress={saveEditedLocation} />
                            <Button title="Annuleren" onPress={() => setEditModalVisible(false)} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

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
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lightText: {
        color: '#000',
    },
    darkText: {
        color: '#fff',
    },
    favoriteButton: {
        fontSize: 16,
        color: 'orange',
    },
    editButton: {
        fontSize: 16,
        color: 'blue',
    },
    deleteButton: {
        fontSize: 16,
        color: 'red',
    },
    shareButton: {
        fontSize: 16,
        color: 'green',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
});

export default HomeScreen;
