const fs = require("fs");
const filePath = "./NFS_Folder/routes.json"; // Ruta al archivo JSON que contiene las rutas

function getRoutes() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
}

function addRoute(routeData) {
    const routes = getRoutes();

    // Generar un nuevo ID único
    const newId = routes.length > 0 ? Math.max(...routes.map(route => route.id)) + 1 : 1;

    const newRoute = {
        id: newId, // Asignar el nuevo ID generado
        driverId: routeData.driverId,
        origin: routeData.origin,
        destination: routeData.destination,
        schedule: routeData.schedule,
        distance: routeData.distance // Puede ser calculada si necesario
    };

    // Agregar la nueva ruta a la lista y guardar
    routes.push(newRoute);
    fs.writeFileSync(filePath, JSON.stringify(routes, null, 2));

    return newId; // Retornar el ID generado
}

module.exports = { getRoutes, addRoute };
