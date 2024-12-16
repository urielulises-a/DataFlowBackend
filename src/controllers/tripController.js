// Importar las dependencias necesarias
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
const Car = require('../models/carModel');  // Asegúrate de que la ruta es correcta

router.post("/find", async (req, res) => {
    const { origin, destination } = req.body;

    const routes = routeService.getRoutes();
    const trips = tripService.getTrips();

    const filteredTrips = trips.filter(trip => {
        if (trip.status !== "waiting") return false;

        const route = routes.find(r => r.id === trip.routeId);
        if (!route) return false;

        const [time, period] = route.schedule.split(" ");
        let [hour, minute] = time.split(":").map(Number);
        if (period === "PM" && hour < 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        const currentDate = new Date();
        const scheduleDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute);

        const minutesElapsed = (currentDate - scheduleDate) / (1000 * 60);
        if (minutesElapsed > 15) return false;

        const originDistance = calculateDistance(origin.lat, origin.lng, route.origin.lat, route.origin.lng);
        const destinationDistance = calculateDistance(destination.lat, destination.lng, route.destination.lat, route.destination.lng);

        const isOriginClose = originDistance <= 1;
        const isDestinationClose = destinationDistance <= 1;

        return isOriginClose && isDestinationClose;
    });

    const tripDetails = await Promise.all(
        filteredTrips.map(async trip => {
            const driver = userService.getUserById(trip.driverId);
            const route = routes.find(r => r.id === trip.routeId);

            let carDetails = null;
            if (driver && driver.car) {
                try {
                    // Desencriptar los datos del coche utilizando decryptCarData
                    const plate = userService.decryptCarData(driver.car.plate);
                    const model = userService.decryptCarData(driver.car.model);
                    const color = userService.decryptCarData(driver.car.color);

                    // Crear un objeto Car con los datos desencriptados
                    carDetails = new Car(plate, model, color);
                } catch (error) {
                    console.error("Error al desencriptar los datos del coche:", error);
                    carDetails = new Car("Error", "Error", "Error"); // Valores por defecto en caso de error
                }
            }

            return {
                tripId: trip.id,
                driverName: driver ? driver.name : "Desconocido",
                phoneNumber: driver ? driver.phoneNumber : "Desconocido",
                carDetails: carDetails ? carDetails.toString() : "No disponible", // Aquí puedes llamar al método toString() para mostrar la info
                route: {
                    origin: route.origin,
                    destination: route.destination,
                },
                schedule: route.schedule,
                fare: trip.fare,
            };
        })
    );

    res.status(200).json(tripDetails);
});

// Cancelar asistencia a un viaje
router.delete("/cancelAssistant", (req, res) => {
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

    // Buscar el índice del pasajero a eliminar
    const passengerIndex = trip.passengerIds.indexOf(userId);
    if (passengerIndex === -1) {
        return res.status(404).json({ error: "Usuario no encontrado en este viaje." });
    }

    // Eliminar al pasajero del array
    trip.passengerIds.splice(passengerIndex, 1);

    // Guardar los cambios en el archivo JSON
    const updatedTrips = [...trips];
    updatedTrips[tripIndex] = trip;
    tripService.saveTrips(updatedTrips);

    res.status(200).json({ message: "Usuario eliminado del viaje exitosamente." });
});

const express = require("express");
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

