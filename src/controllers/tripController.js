const express = require("express");
const bcrypt = require("bcrypt");
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

        // Extraer la hora y minuto de "HH:mm AM/PM"
        const [time, period] = route.schedule.split(" ");
        let [hour, minute] = time.split(":").map(Number);
        if (period === "PM" && hour < 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0; // Ajustar medianoche

        // Crear un objeto de fecha combinando la fecha actual con la hora del schedule
        const currentDate = new Date(); // Fecha y hora actual
        const scheduleDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute);

        // Verificar si el viaje fue creado hace menos de 15 minutos
        const minutesElapsed = (currentDate - scheduleDate) / (1000 * 60); // Diferencia en minutos
        if (minutesElapsed > 15) return false;

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
    });

    // Obtener los detalles del conductor para los viajes filtrados
    const tripDetails = await Promise.all(
        filteredTrips.map(async trip => {
            const driver = userService.getUserById(trip.driverId); // Buscamos el conductor por su ID
            const route = routes.find(r => r.id === trip.routeId); // Ruta asociada al viaje

            // Verificar si el conductor tiene un coche registrado
            let carDetails = null;
            if (driver && driver.car) {
                try {
                    // Desencriptar los datos del coche utilizando la función decryptCarData
                    const plate = decryptCarData(driver.car.plate);
                    const model = decryptCarData(driver.car.model);
                    const color = decryptCarData(driver.car.color);

                    carDetails = {
                        plate: plate || "No disponible",
                        model: model || "No disponible",
                        color: color || "No disponible",
                    };
                } catch (error) {
                    console.error("Error al desencriptar los datos del coche:", error);
                    carDetails = { plate: "Error", model: "Error", color: "Error" };
                }
            }

            return {
                tripId: trip.id,                     // ID del viaje
                driverName: driver ? driver.name : "Desconocido", // Nombre del conductor
                phoneNumber: driver ? driver.phoneNumber : "Desconocido", // Número telefónico del conductor
                carDetails: carDetails,              // Datos del coche desencriptados
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


module.exports = router;
