const express = require("express");
const gpsRouteRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const gpsRouteController = require("../controllers/gpsRoute");
gpsRouteRoutes.get(
    "/list",
    auth,
    asyncWrapper(gpsRouteController.list),
);


gpsRouteRoutes.get(
    "/show-current",
    auth,
    asyncWrapper(gpsRouteController.showCurrent),
);

gpsRouteRoutes.post(
    "/create",
    auth,
    asyncWrapper(gpsRouteController.create)
);

gpsRouteRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(gpsRouteController.show),
);

gpsRouteRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(gpsRouteController.edit)
);

gpsRouteRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(gpsRouteController.delete)
);

module.exports = gpsRouteRoutes;
