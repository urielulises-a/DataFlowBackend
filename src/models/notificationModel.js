class Notification {
    constructor(id, userId, message, date) {
        this.id = id;          // Identificador único de la notificación
        this.userId = userId;  // ID del usuario destinatario
        this.message = message; // Mensaje de la notificación
        this.date = date;       // Fecha de envío
    }
}

module.exports = Notification;
