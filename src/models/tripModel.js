// Modelo de viaje (tripModel.js)
class Trip {
    constructor(id, driverId, originLat, originLng, destinationLat, destinationLng, passengerCount, fare, status = "pending") {
        this.id = id;
        this.driverId = driverId;
        this.originLat = originLat;  // Latitud de origen
        this.originLng = originLng;  // Longitud de origen
        this.destinationLat = destinationLat;  // Latitud de destino
        this.destinationLng = destinationLng;  // Longitud de destino
        this.passengerCount = passengerCount;
        this.fare = fare;
        this.status = status;
    }
}



module.exports = Trip;
