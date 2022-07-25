const express = require("express");
const projectTypeRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const projectTypeController = require("../controllers/projectType");


projectTypeRoutes.get(
    "/list",
    auth,
    asyncWrapper(projectTypeController.list),
);

projectTypeRoutes.post(
    "/create",
    auth,
    asyncWrapper(projectTypeController.create)
);

projectTypeRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(projectTypeController.show),
);

projectTypeRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(projectTypeController.edit)
);

projectTypeRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(projectTypeController.delete)
);

module.exports = projectTypeRoutes;
