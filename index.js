const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
require('dotenv').config();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});


const app = express();
app.use(bodyParser.json());
app.use(cors);

const userRoutes = require("./src/controllers/userController");
const routeRoutes = require("./src/controllers/routeController");
const tripRoutes = require("./src/controllers/tripController");
const historyRoutes = require("./src/controllers/historyController");
const preferenceRoutes = require("./src/controllers/preferencesController");
const notificationRoutes = require("./src/controllers/notificationController");

app.use("/users", userRoutes);
app.use("/routes", routeRoutes);
app.use("/trips", tripRoutes);
app.use("/preferences", preferenceRoutes);
app.use("/notifications", notificationRoutes);
app.use("/history", historyRoutes);



// Puerto del servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
