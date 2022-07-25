const express = require("express");
const apiRoutes = require("./api");
const httpStatus = require("../utils/httpStatus");

const mainRouter = express.Router();
mainRouter.get("/", (req, res, next) => {
    return res.status(httpStatus.OK).json({
        message: 'HELLO'
    });
});
mainRouter.use("/api/v1", apiRoutes);

module.exports = mainRouter;
