const fs = require("fs");
const path = require("path");
const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const filePath = path.join(__dirname, "../../NFS_Folder/routes.json");

function getRoutes() {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data.trim() ? JSON.parse(data) : [];
}

function addRoute(routeData) {
    const routes = getRoutes();

    // Validar duplicados por ID
    if (routes.some(r => r.id === routeData.id)) {
        return false;
    }

    const newRoute = {
        id: routeData.id,
        driverId: routeData.driverId,
        origin: routeData.origin,
        destination: routeData.destination,
        schedule: routeData.schedule,
        distance: routeData.distance // Se puede calcular
    };
    
    routes.push(newRoute);
    fs.writeFileSync(filePath, JSON.stringify(routes, null, 2));
    return true;
}

// Calcular la ruta utilizando Google Maps API
async function calculateRoute(origin, destination) {
    try {
        const response = await client.directions({
            params: {
                origin: origin,
                destination: destination,
                key: GOOGLE_MAPS_API_KEY
            },
            timeout: 1000 // 1s
        });
        
        if (response.data && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const steps = route.legs[0].steps.map(step => ({
                distance: step.distance.text,
                duration: step.duration.text,
                instruction: step.html_instructions // Texto con las instrucciones detalladas para cada paso
            }));

            return {
                distance: route.legs[0].distance.text,
                duration: route.legs[0].duration.text,
                steps: steps
            };
        } else {
            throw new Error("No se pudo calcular la ruta");
        }
    } catch (error) {
        console.error("Error al calcular la ruta:", error);
        return null;
    }
}

module.exports = {
    getRoutes,
    addRoute,
    calculateRoute
};
