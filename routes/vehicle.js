const express = require("express");
const vehicleRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const vehicleController = require("../controllers/vehicle");


vehicleRoutes.get(
    "/list",
    auth,
    asyncWrapper(vehicleController.list),
);

vehicleRoutes.post(
    "/create",
    auth,
    asyncWrapper(vehicleController.create)
);

vehicleRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(vehicleController.show),
);

vehicleRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(vehicleController.edit)
);

vehicleRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(vehicleController.delete)
);

module.exports = vehicleRoutes;
