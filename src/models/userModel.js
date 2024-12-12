class User {
    constructor(id, name, email, password, phoneNumber, type) {
        this.id = id;             // Identificador único del usuario
        this.name = name;         // Nombre completo
        this.email = email;       // Correo electrónico
        this.password = password; // Contraseña (almacenada de forma segura)
        this.phoneNumber = phoneNumber; // Número telefónico
        this.type = type;         // Tipo de usuario: "driver" o "passenger"
    }
}

module.exports = User;
