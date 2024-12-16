const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");  // Asegúrate de tener bcrypt importado
const { v4: uuidv4 } = require("uuid");
const User = require("../models/userModel");
const Car = require("../models/carModel");

// Cargar variables de entorno desde .env
require('dotenv').config();

// Verificar si la clave de encriptación está definida y es válida
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error("La clave de encriptación no está definida correctamente en el archivo .env");
}

const encryptionKeyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');  // Convertir clave en buffer
const IV_LENGTH = 16;  // Longitud del IV para AES-256

const filePath = path.join(__dirname, "../../NFS_Folder/users.json");

// Leer usuarios desde el archivo JSON
function getUsers() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

// Obtener un usuario por su ID
function getUserById(userId) {
    const users = getUsers();  // Leer todos los usuarios
    return users.find(u => u.id === userId);  // Encontrar el usuario por su ID
}

// Agregar un nuevo usuario
async function addUser(userData) {
    const users = getUsers();

    // Verificar si el usuario ya existe
    if (users.some(u => u.email === userData.email)) {
        return false;
    }

    // Cifrar la contraseña del usuario
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Generar un UUID para el nuevo usuario
    const newUserId = uuidv4();

    // Crear un objeto de coche sin cifrado si es un conductor
    let car = null;
    if (userData.type === "driver" && userData.carDetails) {
        car = userData.carDetails; // No se realiza encriptación
    }

    // Crear un nuevo usuario
    const newUser = new User(
        newUserId,
        userData.name,
        userData.email,
        hashedPassword,
        userData.phoneNumber,
        userData.type,
        car
    );

    users.push(newUser);
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    return newUserId;
}


// Verificar las credenciales del usuario
async function verifyUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return false;
    }

    // Comparar la contraseña proporcionada con la almacenada
    const isPasswordValid = await bcrypt.compare(password, user.password);
    return isPasswordValid ? user : false;
}

module.exports = {
    getUsers,
    addUser,
    verifyUser,
    getUserById,
    encryptCarData,
    decryptCarData,
};
