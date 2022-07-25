const jwt = require("jsonwebtoken");
const httpStatus = require("../utils/httpStatus");
const bcrypt = require("bcrypt");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {ROLE_EMPLOYEE, STATUS_UPLOAD_FILE_SUCCESS, DOCUMENT_TYPE_LOGO, ROLE_SUPERADMIN, ROLE_ADMIN, LANGUAGE_EN} = require("../utils/constants");
const {uploadFile} = require("../uploads/UploadFile");
const DocumentModel = require("../models/document");
const AddressModel = require("../models/address");
const PersonModel = require("../models/person");
const documentModel = require("../models/document");
const {ObjectId} = require("mongoose/lib/types");

const personController = {};

personController.list = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const all = req.query.all == 1;
        const isDriver = req.query.isDriver == 1;
        let query = {}
        switch (currentUser.role) {
            case ROLE_SUPERADMIN:
                const data1 = await UserModel.find({role: { $in: [ROLE_ADMIN, ROLE_EMPLOYEE] }});
                let objectIdForRoleSuperAdmin = [null];
                data1.forEach((item, index) => {
                    objectIdForRoleSuperAdmin = [
                        ...objectIdForRoleSuperAdmin,
                        new ObjectId(item._id)
                    ];
                })
                query = req.query.search ? {$text: { $search: req.query.search}, 'user': {
                        "$in": objectIdForRoleSuperAdmin
                    }} : {'user': {
                        "$in": objectIdForRoleSuperAdmin
                    }}
                break;
            case ROLE_ADMIN:
                const data2 = await UserModel.find({role: { $in: [ROLE_EMPLOYEE] }});
                let objectIdForRoleAdmin = [null];
                data2.forEach((item, index) => {
                    objectIdForRoleAdmin = [
                        ...objectIdForRoleAdmin,
                        new ObjectId(item._id)
                    ];
                })
                query = req.query.search ? {$text: { $search: req.query.search}, 'user': {
                        "$in": objectIdForRoleAdmin
                    }} : {'user': {
                        "$in": objectIdForRoleAdmin
                    }}
                break;
            default:
                query = req.query.search ? {$text: { $search: req.query.search}, user: userId} : {user: userId}
        }
        if (all) {
            if (isDriver) {
                const dataDriver = await UserModel.find({isDriver: true});
                let objectIdForDriver = [];
                dataDriver.forEach((item, index) => {
                    objectIdForDriver = [
                        ...objectIdForDriver,
                        new ObjectId(item._id)
                    ];
                })
                query = {
                    'user': {
                        "$in": objectIdForDriver
                    }
                }
            } else {
                query = {}
            }
        }
        PersonModel
            .find(query)
            .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate('user')
            .populate({
                path: 'address',
                populate: {
                    path: 'province',
                }
            })
            .populate({
                path: 'address',
                populate: {
                    path: 'district',
                }
            })
            .populate({
                path: 'address',
                populate: {
                    path: 'ward',
                }
            })
            .populate('avatar')
            .exec((err, doc) => {
                if (err) {
                    return res.json(err);
                }
                PersonModel.countDocuments(query).exec((count_error, count) => {
                    if (err) {
                        return res.json(count_error);
                    }
                    return res.json({
                        nbResults: count,
                        currentPage: page,
                        pageSize: doc.length,
                        maxPerPage: maxPerPageAll ? null : limit,
                        nbPages: maxPerPageAll ? 1 : Math.ceil(count/limit),
                        items: doc,
                        ...(maxPerPageAll ? {maxPerPageAll : true} : {})
                    });
                });
            });
    } catch (e) {
        next(e)
    }
}

personController.create = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to create an account!' : 'Bạn không có quyền tạo tài khoản!'
            });
        }
        const form = new formidable.IncomingForm();
        form.multiples = true;
        form.uploadDir = "uploads/";
        let userSaved = null;
        let addressSaved = null;
        let personSaved = null;
        let avatarSaved = null;
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    email,
                    firstName,
                    lastName,
                    phoneNumber,
                    birthday,
                    gender,
                    address_description,
                    address_city,
                    address_country,
                    address_postalCode,
                    address_province,
                    address_district,
                    address_ward,
                    isUser,
                    isDriver,
                    username,
                    password,
                    role,
                } = fields;
                if ([ROLE_SUPERADMIN, ROLE_ADMIN].includes(role) && currentUser.role === ROLE_ADMIN) {
                    return res.status(httpStatus.FORBIDDEN).json({
                        message: req.language === LANGUAGE_EN ? 'You do not have permission to create an account for this role!' : 'Bạn không có quyền tạo tài khoản cho role này!'
                    });
                }
                let checkEmail = await PersonModel.findOne({
                    email: email
                })
                if (checkEmail) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'Email already exists!' : 'Email đã tồn tại!'
                    });
                }

                if (username && isUser == 1) {
                    let checkUsername = await UserModel.findOne({
                        username: username
                    })
                    if (checkUsername) {
                        return res.status(httpStatus.BAD_REQUEST).json({
                            message: req.language === LANGUAGE_EN ? 'This username has already existed!' : 'Tên tài khoản đã tồn tại!'
                        });
                    }

                    //Hash password
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);
                    userSaved = await UserModel({
                        username: username,
                        password: hashedPassword,
                        enabled: true,
                        role: role ?? ROLE_EMPLOYEE,
                        isDriver: isDriver
                    }).save();
                }
                const avatarTemp = files.avatar;
                if (avatarTemp) {
                    const fileData = {
                        fileName: avatarTemp.newFilename,
                        mimeType: avatarTemp.mimetype
                    }
                    const resUpload = await uploadFile(fileData);
                    if (resUpload.status === STATUS_UPLOAD_FILE_SUCCESS) {
                        const avatar = DocumentModel({
                            fileId: resUpload.fileId,
                            fileSize: avatarTemp.size,
                            fileName: avatarTemp.newFilename,
                            originalName: avatarTemp.originalFilename,
                            mimeType: avatarTemp.mimetype,
                            documentType: DOCUMENT_TYPE_LOGO
                        })
                        avatarSaved = await avatar.save();
                    }
                }


                const address = AddressModel({
                    description: address_description,
                    city: address_city,
                    country: address_country,
                    postalCode: address_postalCode,
                    province: address_province ? address_province : null,
                    district: address_district ? address_district : null,
                    ward: address_ward ? address_ward : null,
                })
                addressSaved = await address.save();
                const person = PersonModel({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phoneNumber: phoneNumber,
                    birthday: birthday,
                    gender: gender,
                    address: addressSaved ? addressSaved._id : null,
                    avatar: avatarSaved ? avatarSaved._id : null,
                    user: userSaved ? userSaved._id : null,
                })
                personSaved = await person.save();
                if (userSaved) {
                    await UserModel.findByIdAndUpdate(userSaved._id, {
                        person: personSaved._id
                    });
                }
                return res.status(httpStatus.OK).json({
                    data: personSaved,
                })
            } catch (e) {
                if (userSaved) {
                    await UserModel.findByIdAndDelete(userSaved._id);
                }
                if (addressSaved) {
                    await AddressModel.findByIdAndDelete(addressSaved._id);
                }
                if (personSaved) {
                    await PersonModel.findByIdAndDelete(personSaved._id);
                }
                if (avatarSaved) {
                    await DocumentModel.findByIdAndDelete(avatarSaved._id);
                }
                next(e)
            }

        })
    } catch (e) {
        next(e)
    }
}

personController.edit = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        let paramId = req.params.id;

        let person = await PersonModel.findById(paramId).populate('user').populate('address').populate('avatar');
        if (person == null) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: req.language === LANGUAGE_EN ? 'Employee not found!' : 'Không tìm thấy nhân viên!'
            });
        }
        if (
            (currentUser.role === ROLE_SUPERADMIN && ROLE_SUPERADMIN === person.user?.role)
            || (currentUser.role === ROLE_ADMIN && [ROLE_SUPERADMIN, ROLE_ADMIN].includes(person.user?.role))
            || (currentUser.role === ROLE_EMPLOYEE)
        ) {
            if ((person.user?._id ?? "").toString() !== currentUserId) {
                return res.status(httpStatus.FORBIDDEN).json({
                    message: req.language === LANGUAGE_EN ? 'You do not have permission to edit this account!' : 'Bạn không có quyền chỉnh sửa tài khoản này!'
                });
            }
        }

        const form = new formidable.IncomingForm();
        form.multiples = true; //
        form.uploadDir = "uploads/";
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    email,
                    firstName,
                    lastName,
                    phoneNumber,
                    birthday,
                    gender,
                    address_description,
                    address_city,
                    address_country,
                    address_postalCode,
                    address_province,
                    address_district,
                    address_ward,
                    username,
                    password,
                    role,
                    avatar,
                    disabledUser,
                    confirmPassword,
                    changePassword,
                    isDriver,
                    isUser,
                } = fields;

                let checkEmail = await PersonModel.findOne({
                    email: email
                })
                if (checkEmail?._id && (checkEmail?._id.toString() !== person._id.toString())) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'Email already exists!' : 'Email đã tồn tại!'
                    });
                }

                let userSaved = null;
                if (role !== ROLE_EMPLOYEE && currentUser.role === ROLE_ADMIN && (person.user?._id ?? "").toString() !== currentUserId) {
                    return res.status(httpStatus.FORBIDDEN).json({
                        message: req.language === LANGUAGE_EN ? 'You do not have permission to create an account for this role!' : 'Bạn không có quyền tạo tài khoản cho role này!'
                    });
                }
                const userIdOld = person.user?._id;
                if (userIdOld) {
                    if (disabledUser == 1) {
                        userSaved = await UserModel.findByIdAndUpdate(userIdOld, {
                            enabled: false
                        })
                    } else {
                        let checkUsername = await UserModel.findOne({
                            username: username
                        })
                        if (checkUsername?._id && checkUsername._id.toString() !== userIdOld.toString()) {
                            return res.status(httpStatus.BAD_REQUEST).json({
                                message: req.language === LANGUAGE_EN ? 'This username has already existed!' : 'Tên tài khoản đã tồn tại!'
                            });
                        }
                        let hashedNewPassword = null;
                        if (changePassword == 1) {
                            const validPassword = await bcrypt.compare(confirmPassword, person.user?.password);
                            if (!validPassword) {
                                return res.status(httpStatus.BAD_REQUEST).json({
                                    message: req.language === LANGUAGE_EN ? 'Confirm password is incorrect!' : 'Xác nhận mật khẩu không chính xác!'
                                });
                            }
                            //Hash password
                            const salt = await bcrypt.genSalt(10);
                            hashedNewPassword = await bcrypt.hash(password, salt);
                        }
                        userSaved = await UserModel.findByIdAndUpdate(userIdOld, {
                            username: username,
                            role: role,
                            isDriver: isDriver,
                            ...((changePassword == 1 && hashedNewPassword)? {password: hashedNewPassword} : {}),
                            ...(!person.user.enabled ? {enabled: true} : {})
                        })
                    }
                } else {
                    if (username && isUser == 1) {
                        let checkUsername = await UserModel.findOne({
                            username: username
                        })
                        if (checkUsername) {
                            return res.status(httpStatus.BAD_REQUEST).json({
                                message: req.language === LANGUAGE_EN ? 'This username has already existed!' : 'Tên tài khoản đã tồn tại!'
                            });
                        }
                        //Hash password
                        const salt = await bcrypt.genSalt(10);
                        const hashedPassword = await bcrypt.hash(password, salt);
                        userSaved = await UserModel({
                            username: username,
                            password: hashedPassword,
                            enabled: true,
                            role: role ?? ROLE_EMPLOYEE,
                            isDriver: isDriver
                        }).save();
                    }
                }
                let avatarSaved = null;
                if (avatar !== undefined) {
                    avatarSaved = await documentModel.findById(avatar);
                } else {
                    const avatarTemp = files.avatar;
                    if (avatarTemp) {
                        const fileData = {
                            fileName: avatarTemp.newFilename,
                            mimeType: avatarTemp.mimetype
                        }
                        const resUpload = await uploadFile(fileData);
                        if (resUpload.status === STATUS_UPLOAD_FILE_SUCCESS) {
                            const avatar = DocumentModel({
                                fileId: resUpload.fileId,
                                fileSize: avatarTemp.size,
                                fileName: avatarTemp.newFilename,
                                originalName: avatarTemp.originalFilename,
                                mimeType: avatarTemp.mimetype,
                                documentType: DOCUMENT_TYPE_LOGO
                            })
                            avatarSaved = await avatar.save();
                        }
                    }
                }
                let addressId = person.address?._id;
                const addressFind = addressId ? await AddressModel.findById(addressId) : null;
                addressId = addressFind ? addressFind._id : null;
                const addressSaved = addressId ? await AddressModel.findByIdAndUpdate(addressId, {
                    description: address_description,
                    city: address_city,
                    country: address_country,
                    postalCode: address_postalCode,
                    province: address_province ? address_province : null,
                    district: address_district ? address_district : null,
                    ward: address_ward ? address_ward : null,
                }) : await AddressModel({
                    description: address_description,
                    city: address_city,
                    country: address_country,
                    postalCode: address_postalCode,
                    province: address_province ? address_province : null,
                    district: address_district ? address_district : null,
                    ward: address_ward ? address_ward : null,
                }).save();
                const personSaved = await PersonModel.findByIdAndUpdate(paramId, {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phoneNumber: phoneNumber,
                    birthday: birthday,
                    gender: gender,
                    address: addressSaved ? addressSaved._id : null,
                    avatar: avatarSaved ? avatarSaved._id : null,
                    user: userSaved ? userSaved._id : null,
                })
                return res.status(httpStatus.OK).json({
                    data: personSaved,
                })
            } catch (e) {
                next(e)
            }

        })
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}

personController.show = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await PersonModel.findById(paramId)
            .populate('user')
            .populate({
                path: 'address',
                populate: {
                    path: 'province',
                }
            })
            .populate({
                path: 'address',
                populate: {
                    path: 'district',
                }
            })
            .populate({
                path: 'address',
                populate: {
                    path: 'ward',
                }
            })
            .populate('avatar');
        if (item == null) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: req.language === LANGUAGE_EN ? 'Not found!' : 'Không tìm thấy!'
            });
        }

        return res.status(httpStatus.OK).json({
            item: item
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}

personController.delete = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        let paramId = req.params.id;
        let item = await PersonModel.findById(paramId);
        if (item == null) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: req.language === LANGUAGE_EN ? 'Not found!' : 'Không tìm thấy!'
            });
        }
        if (item.user) {
            await UserModel.findByIdAndDelete(item.user._id)
        }
        if (item.address) {
            await AddressModel.findByIdAndDelete(item.address._id)
        }
        if (item.avatar) {
            await DocumentModel.findByIdAndDelete(item.avatar._id)
        }

        if (
            (currentUser.role === ROLE_SUPERADMIN && ROLE_SUPERADMIN === item.user?.role)
            || (currentUser.role === ROLE_ADMIN && [ROLE_SUPERADMIN, ROLE_ADMIN].includes(item.user?.role))
            || (currentUser.role === ROLE_EMPLOYEE)
        ) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to delete this account!' : 'Bạn không có quyền xóa tài khoản này!'
            });
        }

        return res.status(httpStatus.OK).json({
            message: req.language === LANGUAGE_EN ? 'Successfully deleted!' : 'Xóa thành công!',
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}

module.exports = personController;
