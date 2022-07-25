const jwt = require("jsonwebtoken");
const httpStatus = require("../utils/httpStatus");
const bcrypt = require("bcrypt");
const UserModel = require('../models/user')
const {JWT_SECRET, LANGUAGE_EN, FRONTEND_BASE_URL} = require("../utils/constants");
const formidable = require("formidable");
const { v4: uuidv4 } = require('uuid');
const {sendMail} = require("../service/SendMail");
const fs = require("fs");
const path = require("path");
const userController = {};
userController.login = async (req, res, next) => {
    try {
        const form = new formidable.IncomingForm();
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    username,
                    password
                } = fields;
                const user = await UserModel.findOne({
                    username: username
                })
                    .populate({
                        path : 'person',
                        populate: {
                            path: 'address',
                            populate: {
                                path: 'province',
                            }
                        }
                    })
                    .populate({
                        path : 'person',
                        populate: {
                            path: 'address',
                            populate: {
                                path: 'district',
                            }
                        }
                    })
                    .populate({
                        path : 'person',
                        populate: {
                            path: 'address',
                            populate: {
                                path: 'ward',
                            }
                        }
                    })
                    .populate({
                        path : 'person',
                        populate : {
                            path : 'avatar',
                        }
                    })
                if (!user) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'Username or password incorrect!' : 'Tên tài khoản hoặc mật khẩu không đúng!'
                    });
                }

                // password
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'Username or password incorrect!' : 'Tên tài khoản hoặc mật khẩu không đúng!'
                    });
                }

                if (!user.enabled) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'Your account disabled!' : 'Tài khoản của bạn bị vô hiệu hóa!'
                    });
                }


                // create and assign a token
                const token = jwt.sign(
                    {username: user.username, role: user.role, id: user._id},
                    JWT_SECRET
                );
                const dataPerson = user.person;
                const data = {
                    _id: user._id,
                    enabled: user.enabled,
                    username: user.username,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    isDriver: !!user.isDriver,
                    person: dataPerson ? dataPerson : null
                }
                return res.status(httpStatus.OK).json({
                    data: data,
                    token: token
                })
            } catch (e) {
                next(e);
            }
        })
    } catch (e) {
        next(e);
    }
}
userController.showCurrentUser = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const user = await UserModel.findById(currentUserId)
            .populate({
                path : 'person',
                populate: {
                    path: 'address',
                    populate: {
                        path: 'province',
                    }
                }
            })
            .populate({
                path : 'person',
                populate: {
                    path: 'address',
                    populate: {
                        path: 'district',
                    }
                }
            })
            .populate({
                path : 'person',
                populate: {
                    path: 'address',
                    populate: {
                        path: 'ward',
                    }
                }
            })
            .populate({
                path : 'person',
                populate : {
                    path : 'avatar',
                }
            })
        const dataPerson = user.person;
        const data = {
            _id: user._id,
            enabled: user.enabled,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isDriver: !!user.isDriver,
            person: dataPerson ? dataPerson : null
        }
        return res.status(httpStatus.OK).json({
            data: data,
        })
    } catch (e) {
        next(e);
    }
}
userController.forgotPassword = async (req, res, next) => {
    try {
        const form = new formidable.IncomingForm();
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    username,
                } = fields;
                const user = await UserModel.findOne({
                    username: username
                })
                    .populate({
                        path : 'person',
                        populate : {
                            path : 'address',
                        }
                    })
                    .populate({
                        path : 'person',
                        populate : {
                            path : 'avatar',
                        }
                    })
                if (!user) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'Username does not exist!' : 'Tên tài khoản không tồn tại!'
                    });
                }

                const fullName = (user.person?.firstName ?? "") + " " + (user.person?.lastName ?? "")
                const email = user.person?.email ?? "trandinhthang99.hy@gmail.com"
                const tokenReset = uuidv4();
                const linkResetPassword = `${FRONTEND_BASE_URL}reset-password/${tokenReset}`;
                const message = {
                    from: 'tdtsystem99@gmail.com',
                    to: email,
                    subject: 'TDT System | Reset password',
                    html: '<!DOCTYPE html>\n' +
                        '<html>\n' +
                        '<head>\n' +
                        '    <title>Page Title</title>\n' +
                        '</head>\n' +
                        '<body>\n' +
                        '<div style="background-color: #F5F5F5!important; padding: 40px;">\n' +
                        '    <div>\n' +
                        '        <h1>Reset password!</h1>\n' +
                        '    </div>\n' +
                        '    <div>\n' +
                        '        <img\n' +
                        '            alt="logo"\n' +
                        '            src="https://tdt-app.herokuapp.com/logo.png"\n' +
                        '            style="width: 60px; height: 60px;"\n' +
                        '        />\n' +
                        '    </div>\n' +
                        '    <div style="color: #54516a; font-weight: 600; font-size: 24px; margin: 10px 0;">\n' +
                        '        Hi '+fullName+'!\n' +
                        '    </div>\n' +
                        '    <div style="color: #282c34; font-size: 18px;">\n' +
                        '        To reset password please\n' +
                        '        <a\n' +
                        '            href="'+linkResetPassword+'"\n' +
                        '            style="color: #4169E1; font-weight: 700;"\n' +
                        '        >\n' +
                        '            click here\n' +
                        '        </a>\n' +
                        '    </div>\n' +
                        '\n' +
                        '</div>\n' +
                        '</body>\n' +
                        '</html>\n'
                };

                const resSendMail = await sendMail(message);
                const userSaved = await UserModel.findByIdAndUpdate(user._id, {
                    tokenReset: tokenReset,
                });

                return res.status(httpStatus.OK).json({
                    message: req.language === LANGUAGE_EN ? 'Your request has been submitted successfully, we have sent you an email!' : 'Gửi yêu cầu thành công, chúng tôi đã gửi một email cho bạn!'
                })
            } catch (e) {
                next(e);
            }
        })
    } catch (e) {
        next(e);
    }
}
userController.resetPassword = async (req, res, next) => {
    const token = req.params.token;
    try {
        const form = new formidable.IncomingForm();
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    password
                } = fields;
                const user = token ? await UserModel.findOne({
                    tokenReset: token
                }).populate('person') : null;
                if (!user) {
                    return res.status(httpStatus.NOT_FOUND).json({
                        message: req.language === LANGUAGE_EN ? 'Token has expired!' : 'Token đã hết hạn!'
                    });
                }

                //Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                await UserModel.findByIdAndUpdate(user._id, {
                    password: hashedPassword,
                    tokenReset: null
                }).populate('person');
                const fullName = (user.person?.firstName ?? "") + " " + (user.person?.lastName ?? "")
                const email = user.person?.email ?? "trandinhthang99.hy@gmail.com"

                const message = {
                    from: 'tdtsystem99@gmail.com',
                    to: email,
                    subject: 'TDT System | Reset password successfully',
                    html: '<!DOCTYPE html>\n' +
                        '<html>\n' +
                        '<head>\n' +
                        '    <title>Page Title</title>\n' +
                        '</head>\n' +
                        '<body>\n' +
                        '<div style="background-color: #F5F5F5!important; padding: 40px;">\n' +
                        '    <div>\n' +
                        '        <h1>Reset password successfully!</h1>\n' +
                        '    </div>\n' +
                        '    <div>\n' +
                        '        <img\n' +
                        '            alt="logo"\n' +
                        '            src="https://tdt-app.herokuapp.com/logo.png"\n' +
                        '            style="width: 60px; height: 60px;"\n' +
                        '        />\n' +
                        '    </div>\n' +
                        '    <div style="color: #54516a; font-weight: 600; font-size: 24px; margin: 10px 0;">\n' +
                        '        Hi '+fullName+'!\n' +
                        '    </div>\n' +
                        '</div>\n' +
                        '</body>\n' +
                        '</html>\n'
                };

                const resSendMail = await sendMail(message);
                return res.status(httpStatus.OK).json({
                    message: req.language === LANGUAGE_EN ? 'You have successfully changed your password!' : 'Bạn đã thay đổi mật khẩu thành công!'
                })
            } catch (e) {
                next(e);
            }
        })
    } catch (e) {
        next(e);
    }
}

module.exports = userController;
