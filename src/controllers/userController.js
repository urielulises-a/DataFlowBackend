const express = require("express");
const router = express.Router();
const userService = require("../services/userService");

// Obtener todos los usuarios (solo para pruebas)
router.get("/", (req, res) => {
    const users = userService.getUsers();
    res.json(users);
});

// Registro de un nuevo usuario
// Modificar el controlador de registro para que almacene la información del conductor
router.post("/register", async (req, res) => {
    const { name, email, password, phoneNumber, type, carDetails } = req.body;
    // Validación del tipo de usuario
    if (type === "driver" && !carDetails) {
        return res.status(400).send("Se requiere información del vehículo para los conductores.");
    }

    // Agregar el conductor o pasajero al sistema
    const UID = await userService.addUser({ name, email, password, phoneNumber, type, carDetails });
    if (UID) {
        res.status(201).json({ message: "Inicio de sesión exitoso", UID });
    } else {
        res.status(400).send("El correo ya está registrado");
    }
});


// Login de usuario
router.post("/login", async (req, res) => {
    console.log(`Intento de Login desde ${req.headers.origin}`);
    const { email, password } = req.body;

    const user = await userService.verifyUser(email, password);
    if (user) {
        res.status(200).json({ message: "Inicio de sesión exitoso", user });
    } else {
        res.status(401).send("Credenciales inválidas");
    }
});

module.exports = router;
