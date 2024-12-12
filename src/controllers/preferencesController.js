const express = require("express");
const router = express.Router();
const preferencesService = require("../services/preferencesService");

// Obtener todas las preferencias
router.get("/", (req, res) => {
    const preferences = preferencesService.getPreferences();
    res.json(preferences);
});

// Agregar una nueva preferencia
router.post("/", (req, res) => {
    const preferenceData = req.body;

    const result = preferencesService.addPreference(preferenceData);
    if (result) {
        res.status(201).send("Preferencia agregada con éxito");
    } else {
        res.status(400).send("Preferencia ya existente para el usuario");
    }
});

module.exports = router;
