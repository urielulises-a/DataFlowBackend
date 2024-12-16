const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");  // Importamos uuid para generar IDs únicos
const User = require("../models/userModel");
const Car = require("../models/carModel");

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

// Encriptar datos del coche
async function encryptCarData(carDetails) {
    const plateHash = await bcrypt.hash(carDetails.plate, 10);
    const modelHash = await bcrypt.hash(carDetails.model, 10);
    const colorHash = await bcrypt.hash(carDetails.color, 10);

    return {
        plate: plateHash,
        model: modelHash,
        color: colorHash,
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
    const newUserId = uuidv4();  // Generamos un ID único con uuid

    // Crear un objeto de coche cifrado si es un conductor
    let car = null;
    if (userData.type === "driver" && userData.carDetails) {
        car = await encryptCarData(userData.carDetails);
    }

    // Crear un nuevo usuario
    const newUser = new User(
        newUserId,  // Asignar el UUID generado
        userData.name,
        userData.email,
        hashedPassword,
        userData.phoneNumber,
        userData.type,
        car  // Asociar coche cifrado solo si es un conductor
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
};
