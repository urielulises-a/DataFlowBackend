const fs = require("fs");
const filePath = "./NFS_Folder/trips.json"; // Ruta al archivo JSON de viajes

function getTrips() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
}

function addTrip(tripData) {
    const trips = getTrips();

    // Generar un nuevo ID único
    const newId = trips.length > 0 ? Math.max(...trips.map(trip => trip.id)) + 1 : 1;

    const newTrip = {
        id: newId, // Asignar el ID generado
        driverId: tripData.driverId,
        routeId: tripData.routeId,
        passengerCount: tripData.passengerCount,
        fare: tripData.fare,
        passengerIds: tripData.passengerIds || [],
        status: tripData.status || "waiting" // Estado inicial por defecto
    };

    trips.push(newTrip);

    // Guardar los cambios en el archivo
    fs.writeFileSync(filePath, JSON.stringify(trips, null, 2));

    return newId; // Retornar el ID generado para referencia
}

function updateTripStatus(tripId, status) {
    const trips = getTrips();

    const tripIndex = trips.findIndex(trip => trip.id === tripId);
    if (tripIndex === -1) {
        return false;
    }

    trips[tripIndex].status = status;

    // Guardar los cambios en el archivo
    fs.writeFileSync(filePath, JSON.stringify(trips, null, 2));

    return true;
}

module.exports = { getTrips, addTrip, updateTripStatus };
