const express = require("express");
const addressRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const addressController = require("../controllers/address");


addressRoutes.get(
    "/initVnAddress",
    auth,
    asyncWrapper(addressController.initVnAddress),
);

addressRoutes.get(
    "/listVnProvince",
    // auth,
    asyncWrapper(addressController.listVnProvince),
);

addressRoutes.get(
    "/listVnDistrictByProvince",
    // auth,
    asyncWrapper(addressController.listVnDistrictByProvince),
);

addressRoutes.get(
    "/listVnWardByDistrict",
    // auth,
    asyncWrapper(addressController.listVnWardByDistrict),
);


module.exports = addressRoutes;
