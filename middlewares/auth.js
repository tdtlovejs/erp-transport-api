const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");
const httpStatus = require("../utils/httpStatus");
const {LANGUAGE_EN, LANGUAGE_VI} = require("../utils/constants");

const auth = async (req, res, next) => {
    try {
        if (req.headers.authorization) {
            let authorization = req.headers.authorization.split(' ')[1], decoded;
            try {
                decoded = jwt.verify(authorization, process.env.JWT_SECRET);
            } catch (e) {
                return res.status(httpStatus.UNAUTHORIZED).json({
                    success: false,
                    message: req.language === LANGUAGE_EN ? 'unauthorized!' : 'không được phép!'
                });
            }
            const userId = decoded.id;
            let user;
            try {
                user = await UserModel.findById(userId);
                if (user == null) {
                    return res.status(httpStatus.UNAUTHORIZED).json({
                        message: req.language === LANGUAGE_EN ? 'unauthorized!' : 'không được phép!'
                    });

                }
            } catch (error) {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error?.message});
            }

            req.userId = userId;
            req.language = [LANGUAGE_EN, LANGUAGE_VI].includes(req.headers.language) ? req.headers.language : LANGUAGE_EN;
            next();
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'unauthorized'
            });
        }
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error?.message});
    }
};

module.exports = auth;
