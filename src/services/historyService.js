const fs = require("fs");
const path = require("path");
const History = require("../models/historyModel");

const filePath = path.join(__dirname, "../../NFS_Folder/history.json");

// Obtener todo el historial
function getHistory() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

// Agregar un viaje al historial
function addHistory(tripId) {
    const history = getHistory();

    // Validar si el viaje ya está registrado en el historial
    if (history.some(h => h.tripId === tripId)) {
        return false;
    }

    const newHistory = new History(
        tripId,
        new Date().toISOString(), // Fecha actual en formato ISO
        "completed"
    );

    history.push(newHistory);
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
    return true;
}

module.exports = {
    getHistory,
    addHistory,
};
