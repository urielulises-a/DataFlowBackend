// Modelo de viaje (tripModel.js)
const statusTypes = ["waiting","canceled","started", "finished"]
class Trip {

    constructor(id, driverId, routeId, passengerCount, passengerIds, fare, status = statusTypes[0]) {
        this.id = id;
        this.driverId = driverId;
        this.routeId = routeId;
        this.passengerCount = passengerCount;
        this.passengerIds = passengerIds;
        this.passengersIDs = [];
        this.fare = fare;
        this.status = status;
    }
}

module.exports = {Trip, statusTypes};
