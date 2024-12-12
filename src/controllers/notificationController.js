const express = require("express");
const router = express.Router();
const notificationService = require("../services/notificationService");

// Obtener todas las notificaciones
router.get("/", (req, res) => {
    const notifications = notificationService.getNotifications();
    res.json(notifications);
});

// Agregar una nueva notificación
router.post("/", (req, res) => {
    const notificationData = req.body;
    notificationService.addNotification(notificationData);
    res.status(201).send("Notificación enviada con éxito");
});

module.exports = router;
