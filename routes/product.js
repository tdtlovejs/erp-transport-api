const express = require("express");
const productRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const productController = require("../controllers/product");


productRoutes.get(
    "/list",
    auth,
    asyncWrapper(productController.list),
);

productRoutes.post(
    "/create",
    auth,
    asyncWrapper(productController.create)
);

productRoutes.get(
    "/show/:id",
    auth,
    asyncWrapper(productController.show),
);

productRoutes.patch(
    "/edit/:id",
    auth,
    asyncWrapper(productController.edit)
);

productRoutes.delete(
    "/delete/:id",
    auth,
    asyncWrapper(productController.delete)
);

module.exports = productRoutes;
