const express = require("express");
const projectRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const projectController = require("../controllers/project");


projectRoutes.get(
    "/list",
    auth,
    asyncWrapper(projectController.list),
);

projectRoutes.post(
    "/create",
    auth,
    asyncWrapper(projectController.create)
);

projectRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(projectController.show),
);

projectRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(projectController.edit)
);

projectRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(projectController.delete)
);

module.exports = projectRoutes;
