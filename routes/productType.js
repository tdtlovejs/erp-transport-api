const express = require("express");
const productTypeRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const productTypeController = require("../controllers/productType");


productTypeRoutes.get(
    "/list",
    auth,
    asyncWrapper(productTypeController.list),
);

productTypeRoutes.post(
    "/create",
    auth,
    asyncWrapper(productTypeController.create)
);

productTypeRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(productTypeController.show),
);

productTypeRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(productTypeController.edit)
);

productTypeRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(productTypeController.delete)
);

module.exports = productTypeRoutes;
