class History {
    constructor(tripId, date, status) {
        this.tripId = tripId;     // ID del viaje asociado
        this.date = date;         // Fecha de finalización del viaje
        this.status = status;     // Estado del viaje (siempre "completed")
    }
}

module.exports = History;
