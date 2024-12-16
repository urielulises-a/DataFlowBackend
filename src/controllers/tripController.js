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
        res.status(201).json({message : "Viaje confirmado con éxito"});
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
    const { origin, destination } = req.body; // Recibimos las coordenadas desde el frontend

    const routes = routeService.getRoutes(); // Obtener todas las rutas disponibles
    const trips = tripService.getTrips(); // Obtener todos los viajes

    const filteredTrips = trips.filter(trip => {
        // Verificar si el estado del viaje es "waiting"
        if (trip.status !== "waiting") return false;

        // Obtener la ruta asociada al viaje
        const route = routes.find(r => r.id === trip.routeId);
        if (!route) return false; // Si no hay ruta asociada, ignorar este viaje

        // Verificar si el viaje fue creado hace menos de 15 minutos
        const scheduleISO = route.schedule; // Asumimos que schedule es un string en formato ISO 8601
        const departureTime = new Date(scheduleISO); // Convertir a objeto Date
        const currentTime = new Date(); // Hora actual
        const timeDifference = departureTime - currentTime; // Diferencia en milisegundos

        // Si el tiempo restante es menor a 15 minutos (900000 milisegundos)
        if (timeDifference > 0 && timeDifference <= 15 * 60 * 1000) {
            // Calculamos la distancia entre el origen y el destino
            const originDistance = calculateDistance(
                origin.lat, origin.lng,
                route.origin.lat, route.origin.lng
            );
            const destinationDistance = calculateDistance(
                destination.lat, destination.lng,
                route.destination.lat, route.destination.lng
            );

            // Verificamos si la distancia de origen y destino está dentro de 1 km
            const isOriginClose = originDistance <= 1;
            const isDestinationClose = destinationDistance <= 1;

            return isOriginClose && isDestinationClose;
        }

        return false; // Si no cumple con el tiempo restante, lo filtramos
    });

    // Obtener los detalles del conductor para los viajes filtrados
    const tripDetails = await Promise.all(
        filteredTrips.map(async trip => {
            const driver = userService.getUserById(trip.driverId); // Buscamos el conductor por su ID
            const route = routes.find(r => r.id === trip.routeId); // Ruta asociada al viaje

            // Verificar si el conductor tiene un coche registrado
            let carDetails = null;
            if (driver && driver.car) {
                carDetails = {
                    plate: driver.car.plate || "No disponible",
                    model: driver.car.model || "No disponible",
                    color: driver.car.color || "No disponible",
                };
            }

            return {
                tripId: trip.id,                     // ID del viaje
                driverName: driver ? driver.name : "Desconocido", // Nombre del conductor
                phoneNumber: driver ? driver.phoneNumber : "Desconocido", // Número telefónico del conductor
                carDetails: carDetails,              // Datos del coche sin desencriptar
                route: {
                    origin: route.origin,
                    destination: route.destination,
                },
                schedule: route.schedule,            // Horario del viaje
                fare: trip.fare,                     // Tarifa del viaje
            };
        })
    );

    res.status(200).json(tripDetails);
});


router.post("/addUserInTrip", (req, res) => {

    const { tripId, userId } = req.body;

    if (!tripId || !userId) {
        return res.status(400).json({ error: "Faltan parámetros necesarios (tripId, userId)." });
    }

    const trips = tripService.getTrips(); // Obtener todos los viajes
    const tripIndex = trips.findIndex(trip => trip.id === tripId); // Encontrar el índice del viaje

    if (tripIndex === -1) {
        return res.status(404).json({ error: "Viaje no encontrado." });
    }

    const trip = trips[tripIndex];

    // Verificar si el pasajero ya está incluido
    if (trip.passengerIds.includes(userId)) {
        return res.status(400).json({ error: "El usuario ya está registrado en este viaje." });
    }

    // Verificar si el número máximo de pasajeros ya se alcanzó
    if (trip.passengerIds.length >= trip.passengerCount) {
        return res.status(400).json({ error: "El viaje ya está lleno." });
    }

    // Añadir el ID del usuario al array de pasajeros
    trip.passengerIds.push(userId);

    // Guardar los cambios en el archivo JSON
    const updatedTrips = [...trips];
    updatedTrips[tripIndex] = trip;
    tripService.saveTrips(updatedTrips);

    res.status(200).json({ message: "Usuario añadido al viaje exitosamente." });
});

// Método DELETE: cancelar la asistencia de un usuario en un viaje
router.delete("/cancelAssistant", (req, res) => {
    const { tripId, userId } = req.body;

    // Validar que se proporcionen tripId y userId
    if (!tripId || !userId) {
        return res.status(400).json({ message: "Se requieren tripId y userId." });
    }

    // Leer los datos del archivo
    let trips = readTripsFile();

    // Buscar el viaje correspondiente
    const tripIndex = trips.findIndex(trip => trip.id === tripId);

    if (tripIndex === -1) {
        return res.status(404).json({ message: "Viaje no encontrado." });
    }

    // Eliminar el userId del array passengersIds
    const passengerIndex = trips[tripIndex].passengersIds.indexOf(userId);

    if (passengerIndex === -1) {
        return res.status(404).json({ message: "Usuario no encontrado en la lista de pasajeros." });
    }

    trips[tripIndex].passengersIds.splice(passengerIndex, 1);

    // Escribir los cambios en el archivo
    writeTripsFile(trips);

    res.status(200).json({ message: "Usuario eliminado de la lista de pasajeros.", tripId, userId });
});

// Cancelar un viaje
router.put("/cancelTrip", (req, res) => {
    const { tripId } = req.body;

    if (!tripId) {
        return res.status(400).json({ error: "El parámetro tripId es necesario." });
    }

    const trips = tripService.getTrips();
    const tripIndex = trips.findIndex(trip => trip.id === tripId);

    if (tripIndex === -1) {
        return res.status(404).json({ error: "Viaje no encontrado." });
    }

    trips[tripIndex].status = "canceled";
    tripService.saveTrips(trips);

    res.status(200).json({ message: "Viaje cancelado exitosamente." });
});

// Consultar el estado de un viaje
router.get("/checkTripStatus", (req, res) => {
    const { tripId } = req.query;

    if (!tripId) {
        return res.status(400).json({ error: "El parámetro tripId es necesario." });
    }

    const trips = tripService.getTrips();
    const trip = trips.find(trip => trip.id === tripId);

    if (!trip) {
        return res.status(404).json({ error: "Viaje no encontrado." });
    }

    res.status(200).json({ status: trip.status });
});


module.exports = router;
