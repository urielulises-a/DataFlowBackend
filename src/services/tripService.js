const Trip = require("../models/tripModel");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../NFS_Folder/trips.json");

// Obtener todos los viajes
function getTrips() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

// Agregar un nuevo viaje
function addTrip(tripData) {
    const trips = getTrips();

    // Verificar si el viaje ya existe por ID
    if (trips.some(t => t.id === tripData.id)) {
        return false;
    }

    // Crear un nuevo viaje con los datos proporcionados
    const newTrip = new Trip(
        tripData.id,
        tripData.driverId,
        tripData.originLat,
        tripData.originLng,
        tripData.destinationLat,
        tripData.destinationLng,
        tripData.passengerCount,
        tripData.fare
    );

    trips.push(newTrip);
    fs.writeFileSync(filePath, JSON.stringify(trips, null, 2));
    return true;
}

// Actualizar el estado de un viaje
function updateTripStatus(tripId, status) {
    const trips = getTrips();
    const tripIndex = trips.findIndex(t => t.id === tripId);

    if (tripIndex === -1) {
        return false;
    }

    trips[tripIndex].status = status;
    fs.writeFileSync(filePath, JSON.stringify(trips, null, 2));
    return true;
}

module.exports = {
    getTrips,
    addTrip,
    updateTripStatus,
};
