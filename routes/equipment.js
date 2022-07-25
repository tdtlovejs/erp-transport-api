const express = require("express");
const equipmentRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const equipmentController = require("../controllers/equipment");


equipmentRoutes.get(
    "/list",
    auth,
    asyncWrapper(equipmentController.list),
);

equipmentRoutes.post(
    "/create",
    auth,
    asyncWrapper(equipmentController.create)
);

equipmentRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(equipmentController.show),
);

equipmentRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(equipmentController.edit)
);

equipmentRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(equipmentController.delete)
);

module.exports = equipmentRoutes;
