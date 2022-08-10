const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {STATUS_UPLOAD_FILE_SUCCESS, DOCUMENT_TYPE_LOGO, ROLE_SUPERADMIN, ROLE_ADMIN, LANGUAGE_EN, VEHICLE_STATUS_MOVING,
    GPS_ROUTE_STATUS_MOVING
} = require("../utils/constants");
const {uploadFile} = require("../uploads/UploadFile");
const DocumentModel = require("../models/document");
const VehicleModel = require("../models/vehicle");
const documentModel = require("../models/document");
const GpsPointModel = require("../models/gpsPoint");
const GpsRouteModel = require("../models/gpsRoute");
const vehicleController = {};
vehicleController.list = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const query = req.query.search ? {$text: { $search: req.query.search}, ...(req.query.removeMoving == 1 ? {
            status: {
                "$nin": [VEHICLE_STATUS_MOVING]
            }} : {})} : {...(req.query.removeMoving == 1 ? {
                status: {
                    "$nin": [VEHICLE_STATUS_MOVING]
                }
            } : {})}
        VehicleModel
            .find(query)
            .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate('logo')
            .exec((err, doc) => {
                if (err) {
                    return res.json(err);
                }
                VehicleModel.countDocuments(query).exec(async (count_error, count) => {
                    if (err) {
                        return res.json(count_error);
                    }
                    let dataGpsPoint = {}
                    if (req.query.showLastPoint == 1) {
                        for (let index = 0; index < doc.length; index++) {
                            const item = doc[index];
                            const lastGpsRouteByVehicle = await GpsRouteModel
                                .findOne({
                                    vehicle: item._id,
                                    status: GPS_ROUTE_STATUS_MOVING
                                })
                                .sort({'updatedAt': -1})
                            if (lastGpsRouteByVehicle) {
                                const lastGpsPointByVehicle = await GpsPointModel.findOne({
                                    gpsRoute: lastGpsRouteByVehicle._id
                                }).sort({'updatedAt': -1})
                                    .populate({
                                        path: 'gpsRoute',
                                        populate: {
                                            path: 'transportOrder',
                                        }
                                    })
                                    .populate({
                                        path: 'gpsRoute',
                                        populate: {
                                            path: 'driver',
                                            populate: {
                                                path: 'avatar',
                                            }
                                        }
                                    })
                                    .populate({
                                        path: 'gpsRoute',
                                        populate: {
                                            path: 'vehicle',
                                            populate: {
                                                path: 'logo',
                                            }
                                        }
                                    })
                                if (lastGpsPointByVehicle) {
                                    dataGpsPoint[item._id] = lastGpsPointByVehicle
                                }
                            }

                        }
                    }
                    return res.json({
                        nbResults: count,
                        currentPage: page,
                        pageSize: doc.length,
                        maxPerPage: maxPerPageAll ? null : limit,
                        nbPages: maxPerPageAll ? 1 : Math.ceil(count / limit),
                        items: doc,
                        dataGpsPoint: dataGpsPoint,
                        ...(maxPerPageAll ? {maxPerPageAll: true} : {})
                    });
                });
            });
    } catch (e) {
        next(e)
    }
}

vehicleController.create = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        const form = new formidable.IncomingForm();
        form.multiples = true; //
        form.uploadDir = "uploads/";
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    name,
                    code,
                    description,
                    type
                } = fields;
                const logoTemp = files.logo;
                let logoSaved = null;
                if (logoTemp) {
                    const fileData = {
                        fileName: logoTemp.newFilename,
                        mimeType: logoTemp.mimetype
                    }
                    const resUpload = await uploadFile(fileData);
                    if (resUpload.status === STATUS_UPLOAD_FILE_SUCCESS) {
                        const avatar = DocumentModel({
                            fileId: resUpload.fileId,
                            fileSize: logoTemp.size,
                            fileName: logoTemp.newFilename,
                            originalName: logoTemp.originalFilename,
                            mimeType: logoTemp.mimetype,
                            documentType: DOCUMENT_TYPE_LOGO
                        })
                        logoSaved = await avatar.save();
                    }
                }

                const vehicleSaved = await VehicleModel({
                    name: name,
                    code: code,
                    description: description,
                    type: type,
                    logo: logoSaved ? logoSaved._id : null,
                }).save();
                if (vehicleSaved) {
                    return res.status(httpStatus.OK).json({
                        item: vehicleSaved,
                    })
                } else {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: 'Error'
                    })
                }
            } catch (e) {
                next(e)
            }
        })
    } catch (e) {
        next(e)
    }
}

vehicleController.edit = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        let paramId = req.params.id;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let item = await VehicleModel.findById(paramId);
        if (item == null) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: req.language === LANGUAGE_EN ? 'Not found!' : 'Không tìm thấy!'
            });
        }

        const form = new formidable.IncomingForm();
        form.multiples = true; //
        form.uploadDir = "uploads/";
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    name,
                    code,
                    description,
                    type,
                    logo
                } = fields;
                let logoSaved = null;
                if (logo !== '' && logo !== undefined) {
                   logoSaved = await documentModel.findById(logo);
                } else {
                    const logoTemp = files.logo;
                    if (logoTemp) {
                        const fileData = {
                            fileName: logoTemp.newFilename,
                            mimeType: logoTemp.mimetype
                        }
                        const resUpload = await uploadFile(fileData);
                        if (resUpload.status === STATUS_UPLOAD_FILE_SUCCESS) {
                            const avatar = DocumentModel({
                                fileId: resUpload.fileId,
                                fileSize: logoTemp.size,
                                fileName: logoTemp.newFilename,
                                originalName: logoTemp.originalFilename,
                                mimeType: logoTemp.mimetype,
                                documentType: DOCUMENT_TYPE_LOGO
                            })
                            logoSaved = await avatar.save();
                        }
                    }
                }

                const itemSaved = await VehicleModel.findByIdAndUpdate(paramId, {
                    name: name,
                    code: code,
                    description: description,
                    type: type,
                    logo: logoSaved ? logoSaved._id : null,
                });
                return res.status(httpStatus.OK).json({
                    item: itemSaved,
                })
            } catch (e) {
                next(e)
            }
        })
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}

vehicleController.show = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await VehicleModel.findById(paramId).populate('logo');
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

vehicleController.delete = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let paramId = req.params.id;
        let item = await VehicleModel.findByIdAndDelete(paramId);
        if (item == null) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: req.language === LANGUAGE_EN ? 'Not found!' : 'Không tìm thấy!'
            });
        }
        return res.status(httpStatus.OK).json({
            message: req.language === LANGUAGE_EN ? 'Successfully deleted!' : 'Xóa thành công!',
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}

module.exports = vehicleController;
