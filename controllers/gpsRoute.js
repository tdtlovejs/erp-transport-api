const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {ROLE_EMPLOYEE, STATUS_UPLOAD_FILE_SUCCESS, DOCUMENT_TYPE_LOGO, ROLE_SUPERADMIN, ROLE_ADMIN,
    TRANSPORT_STATUS_WAITING, GPS_ROUTE_STATUS_MOVING, TRANSPORT_STATUS_COMPLETED, TRANSPORT_STATUS_CANCELED,
    VEHICLE_STATUS_MOVING, GPS_ROUTE_STATUS_COMPLETED, LANGUAGE_EN, TRANSPORT_STATUS_MOVING
} = require("../utils/constants");
const {uploadFile} = require("../uploads/UploadFile");
const DocumentModel = require("../models/document");
const ClientModel = require("../models/client");
const documentModel = require("../models/document");
const AddressModel = require("../models/address");
const PersonModel = require("../models/person");
const VehicleModel = require("../models/vehicle");
const TransportModel = require("../models/transportOrder");
const GpsRouteModel = require("../models/gpsRoute");

const gpsRouteController = {};
gpsRouteController.list = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        const person = currentUser.person;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const isAdmin = [ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)

        const query = {
            status: GPS_ROUTE_STATUS_COMPLETED,
            ...((isAdmin && !req.query.isOnlyMe) ? {
                ...(req.query.driver ? {driver: req.query.driver} : {}),
                ...(req.query.vehicle ? {vehicle: req.query.vehicle} : {})
            } : {driver: person})
        }
        GpsRouteModel
            .find(query)
            .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate({
                path: 'vehicle',
                populate: {
                    path: 'logo',
                }
            })
            .populate({
                path: 'driver',
                populate: {
                    path: 'avatar',
                }
            })
            .populate('transportOrder')
            .exec((err, doc) => {
                if (err) {
                    return res.json(err);
                }
                GpsRouteModel.countDocuments(query).exec((count_error, count) => {
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

gpsRouteController.showCurrent = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        const person = currentUser.person;
        const gpsRouteLastByDriver = await GpsRouteModel.
        findOne({
            driver: person,
            status: GPS_ROUTE_STATUS_MOVING,
        })
            .sort({ 'created_at' : -1 })
            .populate({
                path: 'vehicle',
                populate: {
                    path: 'logo',
                }
            })
            .populate('transportOrder')
            // .populate('populate')
            // .populate({
            //     path: 'driver',
            //     populate: {
            //         path: 'logo',
            //     }
            // })
            // .populate({
            //     path: 'vehicle',
            //     populate: {
            //         path: 'logo',
            //     }
            // })
            // .populate({
            //     path: 'transportOrder',
            //     populate: {
            //         path: 'client',
            //         populate: {
            //             path: 'address',
            //         }
            //     }
            // })
            // .populate({
            //     path: 'transportOrder',
            //     populate: {
            //         path: 'clientAddress',
            //     }
            // })
        if (gpsRouteLastByDriver) {
            return res.status(httpStatus.OK).json({
                item: gpsRouteLastByDriver,
            })
        } else {
            return res.status(httpStatus.OK).json({
                item: null,
            })
        }
    } catch (e) {
        next(e)
    }
}

gpsRouteController.create = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (!currentUser.isDriver) {
            return res.status(httpStatus.FORBIDDEN).json({
                message:  req.language === LANGUAGE_EN ? 'You do not have permission to create a gps route!' : 'Bạn không có quyền tạo lộ trình!'
            });
        }
        const person = currentUser.person;
        const form = new formidable.IncomingForm();
        form.multiples = true; //
        form.uploadDir = "uploads/";
        form.parse(req,  async function (err, fields, files) {
            try {
                const {
                    vehicle,
                    transportOrder,
                } = fields;
                const vehicleFind = vehicle ? await VehicleModel.findById(vehicle) : null;
                const transportOrderFind = transportOrder ? await TransportModel.findById(transportOrder) : null;
                if (!vehicleFind || !transportOrderFind) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'Vehicle and transport order required!' : 'Bắt buộc phải có phương tiện và đơn hàng!'
                    })
                }
                if (transportOrderFind.status !== TRANSPORT_STATUS_WAITING) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'The transport order is not in a waiting status!' : 'Đơn hàng không đang ở trạng thái chờ!'
                    })
                }
                if (vehicleFind.status === VEHICLE_STATUS_MOVING) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'This car is moving!' : 'Xe này đang di chuyển!'
                    })
                }
                const gpsRouteLastByDriver = await GpsRouteModel.
                findOne({
                    driver: person
                }).sort({ 'created_at' : -1 })
                if (gpsRouteLastByDriver && gpsRouteLastByDriver.status === GPS_ROUTE_STATUS_MOVING) {
                    return res.status(httpStatus.BAD_REQUEST).json({
                        message: req.language === LANGUAGE_EN ? 'You have an unfinished bill of lading!' : 'Bạn đang có một đơn vận chưa hoàn thành!'
                    })
                }
                const newISOString = new Date().toISOString();

                const gpsRouteSaved = await GpsRouteModel({
                    startAt: newISOString,
                    vehicle: vehicleFind ? vehicleFind._id : null,
                    status: GPS_ROUTE_STATUS_MOVING,
                    driver: person,
                    transportOrder: transportOrderFind ? transportOrderFind._id : null,
                }).save();

                const vehicleSaved = await VehicleModel.findByIdAndUpdate(vehicle, {
                    status: VEHICLE_STATUS_MOVING
                });
                const transportOrderSaved = await TransportModel.findByIdAndUpdate(transportOrder, {
                    departAt: newISOString,
                    status: TRANSPORT_STATUS_MOVING
                });
                return res.status(httpStatus.OK).json({
                    item: gpsRouteSaved,
                    vehicle: vehicleSaved,
                    transportOrder: transportOrderSaved,
                })
            } catch (e) {
                next(e)
            }
        })
    } catch (e) {
        next(e)
    }
}

gpsRouteController.edit = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        let paramId = req.params.id;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let item = await ClientModel.findById(paramId);
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
                    prospective,
                    manager,
                    address_description,
                    address_city,
                    address_country,
                    address_postalCode,
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
                const addressId = item.address?._id;
                const addressSaved = addressId ? await AddressModel.findByIdAndUpdate(addressId, {
                    description: address_description,
                    city: address_city,
                    country: address_country,
                    postalCode: address_postalCode,
                }) : await AddressModel({
                    description: address_description,
                    city: address_city,
                    country: address_country,
                    postalCode: address_postalCode,
                }).save();
                const managerFind = !!manager ? await PersonModel.findById(manager) : null;
                const itemSaved = await ClientModel.findByIdAndUpdate(paramId, {
                    name: name,
                    code: code,
                    prospective: prospective,
                    type: type,
                    manager: managerFind ? managerFind._id : null,
                    address: addressSaved ? addressSaved._id : null,
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


gpsRouteController.delete = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await GpsRouteModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let paramId = req.params.id;
        let item = await GpsRouteModel.findByIdAndDelete(paramId);
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

module.exports = gpsRouteController;
