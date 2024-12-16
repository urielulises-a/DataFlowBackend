const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

// Función para encriptar datos (AES-256)
function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);  // Generar un IV aleatorio
    let cipher = crypto.createCipheriv('aes-256-cbc', encryptionKeyBuffer, iv);  // Crear el cifrador con AES-256-CBC
    let encrypted = cipher.update(text, 'utf8', 'hex');  // Encriptar los datos
    encrypted += cipher.final('hex');  // Completar el cifrado
    return iv.toString('hex') + ':' + encrypted;  // Retornar el IV y el texto cifrado
}

// Función para desencriptar datos
function decrypt(text) {
    let textParts = text.split(':');  // Dividir el IV y el texto cifrado
    let iv = Buffer.from(textParts.shift(), 'hex');  // Convertir el IV de nuevo
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');  // Convertir el texto cifrado
    let decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKeyBuffer, iv);  // Crear el descifrador
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');  // Desencriptar los datos
    decrypted += decipher.final('utf8');  // Completar la desencriptación
    return decrypted;  // Retornar el texto desencriptado
}

// Encriptar datos del coche
async function encryptCarData(carDetails) {
    const plateHash = encrypt(carDetails.plate);
    const modelHash = encrypt(carDetails.model);
    const colorHash = encrypt(carDetails.color);

    return {
        plate: plateHash,
        model: modelHash,
        color: colorHash,
    };
}

// Desencriptar datos del coche
async function decryptCarData(carDetails) {
    const plate = decrypt(carDetails.plate);
    const model = decrypt(carDetails.model);
    const color = decrypt(carDetails.color);

    return {
        plate,
        model,
        color,
    };
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

    // Crear un objeto de coche cifrado si es un conductor
    let car = null;
    if (userData.type === "driver" && userData.carDetails) {
        car = await encryptCarData(userData.carDetails);
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
