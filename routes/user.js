const userController = require("../controllers/user");
const {asyncWrapper} = require("../utils/asyncWrapper");
const express = require("express");
const usersRoutes = express.Router();
const auth = require("../middlewares/auth");

usersRoutes.post(
    "/login",
    asyncWrapper(userController.login)
);

usersRoutes.get(
    "/current-user",
    auth,
    asyncWrapper(userController.showCurrentUser)
);

usersRoutes.post(
    "/forgot-password",
    asyncWrapper(userController.forgotPassword)
)
usersRoutes.post(
    "/reset-password/:token",
    asyncWrapper(userController.resetPassword)
);
module.exports = usersRoutes;
