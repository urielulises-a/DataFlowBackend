class Route {
    constructor(id, driverId, origin, destination, schedule) {
        this.id = id;
        this.origin = origin;
        this.destination = destination;
        this.schedule = schedule; // Formato: "08:00 AM"
    }
}

module.exports = Route;
