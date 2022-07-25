const express = require("express");
const userRoutes = require("../user");
const personRoutes = require("../person");
const productRoutes = require("../product");
const productTypeRoutes = require("../productType");
const equipmentRoutes = require("../equipment");
const equipmentTypeRoutes = require("../equipmentType");
const projectRoutes = require("../project");
const projectTypeRoutes = require("../projectType");
const clientRoutes = require("../client");
const transportRoutes = require("../transport");
const invoiceRoutes = require("../invoice");
const vehicleRoutes = require("../vehicle");
const gpsRouteRoutes = require("../gpsRoute");
const gpsPointRoutes = require("../gpsPoint");
const commonRoutes = require('../common');
const addressRoutes = require('../address');
const apiRoutes = express.Router();

apiRoutes.use("/user", userRoutes);
apiRoutes.use("/person", personRoutes);
apiRoutes.use("/product", productRoutes);
apiRoutes.use("/productType", productTypeRoutes);
apiRoutes.use("/equipment", equipmentRoutes);
apiRoutes.use("/equipmentType", equipmentTypeRoutes);
apiRoutes.use("/project", projectRoutes);
apiRoutes.use("/projectType", projectTypeRoutes);
apiRoutes.use("/client", clientRoutes);
apiRoutes.use("/transportOrder", transportRoutes);
apiRoutes.use("/vehicle", vehicleRoutes);
apiRoutes.use("/invoice", invoiceRoutes);
apiRoutes.use("/gpsRoute", gpsRouteRoutes);
apiRoutes.use("/gpsPoint", gpsPointRoutes);
apiRoutes.use("/common", commonRoutes);
apiRoutes.use("/address", addressRoutes);
apiRoutes.get(
    "/", (req, res) => res.json({ api: "is-working" })
);
module.exports = apiRoutes;
