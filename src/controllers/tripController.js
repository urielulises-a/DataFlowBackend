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

module.exports = router;
