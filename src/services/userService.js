const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Car = require("../models/carModel")

const filePath = path.join(__dirname, "../../NFS_Folder/users.json");

// Leer usuarios desde el archivo JSON
function getUsers() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
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

    // Crear un objeto de coche si es un conductor
    let id;
    let car = null;
    if (userData.type === "driver" && userData.carDetails) {
        car = new Car(userData.carDetails.plate, userData.carDetails.model, userData.carDetails.color);
        console.log(`Datos del auto: ${car}`)
    }

    // Crear un nuevo usuario
    const newUser = new User(
        userData.id,
        userData.name,
        userData.email,
	    userData.phoneNumber,
        hashedPassword,
        userData.phoneNumber,
        userData.type,
        car  // Asociar coche solo si es un conductor
    );

    users.push(newUser);
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    return true;
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
};
