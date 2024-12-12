const fs = require("fs");
const path = require("path");
const Preference = require("../models/preferencesModel");

const filePath = path.join(__dirname, "../../NFS_Folder/preferences.json");

function getPreferences() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

function addPreference(preferenceData) {
    const preferences = getPreferences();

    // Verificar si la preferencia ya está registrada para el usuario
    if (preferences.some(p => p.userId === preferenceData.userId && p.preference === preferenceData.preference)) {
        return false;
    }

    const newPreference = new Preference(preferenceData.userId, preferenceData.preference);
    preferences.push(newPreference);
    fs.writeFileSync(filePath, JSON.stringify(preferences, null, 2));
    return true;
}

module.exports = {
    getPreferences,
    addPreference,
};
