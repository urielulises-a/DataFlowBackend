class Preference {
    constructor(userId, preference) {
        this.userId = userId;       // ID del usuario asociado
        this.preference = preference; // Tipo de preferencia (e.g., "no-smoking", "pets-allowed")
    }
}

module.exports = Preference;
