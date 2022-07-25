const express = require("express");
const equipmentTypeRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const equipmentTypeController = require("../controllers/equipmentType");


equipmentTypeRoutes.get(
    "/list",
    auth,
    asyncWrapper(equipmentTypeController.list),
);

equipmentTypeRoutes.post(
    "/create",
    auth,
    asyncWrapper(equipmentTypeController.create)
);

equipmentTypeRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(equipmentTypeController.show),
);

equipmentTypeRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(equipmentTypeController.edit)
);

equipmentTypeRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(equipmentTypeController.delete)
);

module.exports = equipmentTypeRoutes;
