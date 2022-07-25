const express = require("express");
const commonRoutes = express.Router();
const auth = require("../middlewares/auth");
const {asyncWrapper} = require("../utils/asyncWrapper");
const commonController = require("../controllers/common");


commonRoutes.get(
    "/statis",
    auth,
    asyncWrapper(commonController.showStatis),
);

module.exports = commonRoutes;
