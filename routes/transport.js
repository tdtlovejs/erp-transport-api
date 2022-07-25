const express = require("express");
const transportRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const transportController = require("../controllers/transportOrder");
const invoiceController = require("../controllers/invoice");


transportRoutes.get(
    "/list",
    auth,
    asyncWrapper(transportController.list),
);

transportRoutes.post(
    "/create",
    auth,
    asyncWrapper(transportController.create)
);

transportRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(transportController.show),
);

transportRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(transportController.edit)
);

transportRoutes.post(
    "/change-status/:id",
    auth,
    asyncWrapper(transportController.changeStatus)
);

transportRoutes.get(
    '/create-invoice/:id',
    auth,
    asyncWrapper(transportController.createInvoice)
)


transportRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(transportController.delete)
);

module.exports = transportRoutes;
