class Trip {
    constructor(id, routeId, passengerId, status) {
        this.id = id;             // Identificador único del viaje
        this.routeId = routeId;   // ID de la ruta asociada
        this.passengerId = passengerId; // ID del pasajero
        this.status = status;     // Estado del viaje: "confirmed", "completed"
    }
}

module.exports = Trip;
