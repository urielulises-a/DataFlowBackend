const express = require("express");
const router = express.Router();
const tripService = require("../services/tripService");
const userService = require("../services/userService"); // Importamos el servicio de usuarios
const routeService = require('../services/routeService');

// Obtener todos los viajes
router.get("/", (req, res) => {
    const trips = tripService.getTrips();
    res.json(trips);
});


// Agregar un nuevo viaje
router.post("/addTrip", (req, res) => {
    const tripData = req.body;

    // Agregar la ruta primero y obtener su ID
    const routeId = routeService.addRoute({
        origin: tripData.origin,
        destination: tripData.destination,
        schedule: tripData.schedule
    });

    if (!routeId) {
        return res.status(400).send("No se pudo registrar la ruta.");
    }

    // Asociar la ruta al viaje
    const newTripData = {
        driverId: tripData.driverId,
        routeId: routeId,
        passengerCount: tripData.passengerCount,
        fare: tripData.fare
    };

    // Registrar el viaje
    const resultTrip = tripService.addTrip(newTripData);

    if (resultTrip) {
        res.status(201).send("Viaje confirmado con éxito");
    } else {
        res.status(400).send("El viaje ya existe");
    }
});


// Actualizar el estado de un viaje
router.put("/:id", (req, res) => {
    const tripId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const result = tripService.updateTripStatus(tripId, status);
    if (result) {
        res.status(200).send("Estado del viaje actualizado");
    } else {
        res.status(404).send("Viaje no encontrado");
    }
});

// Función para calcular la distancia utilizando la fórmula de Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distancia en kilómetros
    return distance;
}

// Función para convertir grados a radianes
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Buscar viajes cercanos
router.post("/find", async (req, res) => {
    const { origin, destination, maxFare } = req.body;  // Recibimos las coordenadas desde el frontend

    const trips = tripService.getTrips();  // Obtener todos los viajes
    const filteredTrips = trips.filter(trip => {
        // Calculamos la distancia entre el origen y el destino
        const originDistance = calculateDistance(
            origin.lat, origin.lng,
            trip.originLat, trip.originLng  // Coordenadas del viaje en la base de datos
        );
        
        const destinationDistance = calculateDistance(
            destination.lat, destination.lng,
            trip.destinationLat, trip.destinationLng  // Coordenadas del viaje en la base de datos
        );

        // Verificamos si la distancia de origen y destino está dentro de 1 km
        const isOriginClose = originDistance <= 1;
        const isDestinationClose = destinationDistance <= 1;

        return isOriginClose && isDestinationClose && trip.fare <= maxFare;
    });

    // Obtener los detalles del conductor para los viajes filtrados
    const tripDetails = filteredTrips.map(trip => {
        const driver = userService.getUserById(trip.driverId); // Buscamos el conductor por su ID
        return {
            driverName: driver.name,  // Nombre del conductor
            route: {
                origin: {
                    lat: trip.originLat,
                    lng: trip.originLng
                },
                destination: {
                    lat: trip.destinationLat,
                    lng: trip.destinationLng
                }
            },
            fare: trip.fare  // Tarifa por pasajero
        };
    });

    res.json(tripDetails);
});

module.exports = router;
