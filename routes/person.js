const express = require("express");
const personRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const personController = require("../controllers/person");
const projectController = require("../controllers/project");
personRoutes.get(
    "/list",
    auth,
    asyncWrapper(personController.list),
);
personRoutes.post(
    "/create",
    auth,
    asyncWrapper(personController.create)
);

personRoutes.get(
    "/show",
    auth,
    asyncWrapper(personController.show),
);
personRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(personController.show),
);
personRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(personController.edit)
);

personRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(personController.delete)
);
module.exports = personRoutes;
