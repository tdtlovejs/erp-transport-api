const express = require("express");
const clientRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const clientController = require("../controllers/client");


clientRoutes.get(
    "/list",
    auth,
    asyncWrapper(clientController.list),
);

clientRoutes.post(
    "/create",
    auth,
    asyncWrapper(clientController.create)
);

clientRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(clientController.show),
);

clientRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(clientController.edit)
);

clientRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(clientController.delete)
);

module.exports = clientRoutes;
