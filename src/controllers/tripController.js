const express = require("express");
const router = express.Router();
const tripService = require("../services/tripService");

// Obtener todos los viajes
router.get("/", (req, res) => {
    const trips = tripService.getTrips();
    res.json(trips);
});

// Agregar un nuevo viaje
router.post("/", (req, res) => {
    const tripData = req.body;
    const result = tripService.addTrip(tripData);

    if (result) {
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

router.post("/find", async (req, res) => {
    const { origin, destination, maxFare } = req.body;  // Recibimos las coordenadas desde el frontend

    const trips = tripService.getTrips();
    const filteredTrips = trips.filter(trip => {
        // Calculamos la distancia entre el origen y el destino
        const originDistance = calculateDistance(
            origin.lat, origin.lng,
            trip.originLat, trip.originLng  // Las coordenadas del viaje en la base de datos
        );
        
        const destinationDistance = calculateDistance(
            destination.lat, destination.lng,
            trip.destinationLat, trip.destinationLng  // Las coordenadas del viaje en la base de datos
        );

        // Verificamos si la distancia de origen y destino está dentro de 1 km
        const isOriginClose = originDistance <= 1;
        const isDestinationClose = destinationDistance <= 1;

        return isOriginClose && isDestinationClose && trip.fare <= maxFare;
    });

    res.json(filteredTrips);
});


module.exports = router;
