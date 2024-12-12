const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../NFS_Folder/routes.json");

function getRoutes() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

function addRoute(route) {
    const routes = getRoutes();

    // Validar duplicados por ID
    if (routes.some(r => r.id === route.id)) {
        return false;
    }

    routes.push(route);
    fs.writeFileSync(filePath, JSON.stringify(routes, null, 2));
    return true;
}

module.exports = {
    getRoutes,
    addRoute,
};
