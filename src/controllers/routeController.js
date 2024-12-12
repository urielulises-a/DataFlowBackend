const express = require("express");
const router = express.Router();
const routeService = require("../services/routeService");

// Obtener todas las rutas
router.get("/", (req, res) => {
    const routes = routeService.getRoutes();
    res.json(routes);
});

// Agregar una nueva ruta
router.post("/", (req, res) => {
    const route = req.body;
    const result = routeService.addRoute(route);

    if (result) {
        res.status(201).send("Ruta agregada con éxito");
    } else {
        res.status(400).send("La ruta ya existe");
    }
});

module.exports = router;
