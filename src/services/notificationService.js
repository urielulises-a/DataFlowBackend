const fs = require("fs");
const path = require("path");
const Notification = require("../models/notificationModel");

const filePath = path.join(__dirname, "../../NFS_Folder/notifications.json");

function getNotifications() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

function addNotification(notificationData) {
    const notifications = getNotifications();
    const newNotification = new Notification(
        notificationData.id,
        notificationData.userId,
        notificationData.message,
        new Date().toISOString() // Fecha actual en formato ISO
    );

    notifications.push(newNotification);
    fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2));
}

module.exports = {
    getNotifications,
    addNotification,
};
