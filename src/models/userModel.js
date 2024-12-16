class User {
    constructor(id, name, email, password, phoneNumber, type, car) {
        this.id = id;			// Identificador único del usuario
        this.name = name;		// Nombre completo
        this.email = email;		// Correo electrónico
        this.password = password;   	// Contraseña (almacenada de forma segura)
	    this.phoneNumber = phoneNumber;	// Numero telefonico
        this.type = type;           	// Tipo de usuario: "driver" o "passenger"
        this.car = car              	// Objeto de auto por si es conductor
    }
}

module.exports = User;
