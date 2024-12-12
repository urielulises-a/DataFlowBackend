const express = require("express");
const router = express.Router();
const historyService = require("../services/historyService");

// Obtener todo el historial de viajes
router.get("/", (req, res) => {
    const history = historyService.getHistory();
    res.json(history);
});

// Agregar un viaje al historial
router.post("/", (req, res) => {
    const { tripId } = req.body;

    const result = historyService.addHistory(tripId);
    if (result) {
        res.status(201).send("Viaje agregado al historial con éxito");
    } else {
        res.status(400).send("El viaje ya está en el historial");
    }
});

module.exports = router;
