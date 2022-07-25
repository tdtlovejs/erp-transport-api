const express = require("express");
const gpsPointRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const gpsPointController = require("../controllers/gpsPoint");


gpsPointRoutes.get(
    "/list",
    auth,
    asyncWrapper(gpsPointController.list),
);

gpsPointRoutes.post(
    "/create",
    auth,
    asyncWrapper(gpsPointController.create)
);

module.exports = gpsPointRoutes;
