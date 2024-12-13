const express = require("express");
const router = express.Router();
const routeService = require("../services/routeService");

// Obtener todas las rutas
router.get("/", (req, res) => {
    const routes = routeService.getRoutes();
    res.json(routes);
});

// Calcular la ruta
router.get("/calculate-route", async (req, res) => {
    const { origin, destination } = req.query;

    // Verificar que los parámetros de consulta estén presentes
    if (!origin || !destination) {
        return res.status(400).send("Los parámetros de origen y destino son requeridos");
    }

    // Calcular la ruta usando Google Maps API
    const routeDetails = await routeService.calculateRoute(origin, destination);

    if (routeDetails) {
        res.json(routeDetails); // Devuelve los detalles de la ruta (distancia, duración, pasos)
    } else {
        res.status(500).send("Error al calcular la ruta");
    }
});

module.exports = router;
