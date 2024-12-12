const fs = require("fs");
const path = require("path");
const Trip = require("../models/tripModel");

const filePath = path.join(__dirname, "../../NFS_Folder/trips.json");

function getTrips() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

function addTrip(tripData) {
    const trips = getTrips();

    // Validar si el viaje ya existe por ID
    if (trips.some(t => t.id === tripData.id)) {
        return false;
    }

    const newTrip = new Trip(tripData.id, tripData.routeId, tripData.passengerId, "confirmed");
    trips.push(newTrip);
    fs.writeFileSync(filePath, JSON.stringify(trips, null, 2));
    return true;
}

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
