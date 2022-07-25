const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {STATUS_UPLOAD_FILE_SUCCESS, DOCUMENT_TYPE_LOGO, ROLE_SUPERADMIN, ROLE_ADMIN, LANGUAGE_EN} = require("../utils/constants");
const {uploadFile} = require("../uploads/UploadFile");
const DocumentModel = require("../models/document");
const ClientModel = require("../models/client");
const documentModel = require("../models/document");
const AddressModel = require("../models/address");
const PersonModel = require("../models/person");
const clientController = {};

clientController.list = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const query = req.query.search ? {$text: { $search: req.query.search}} : {}
        ClientModel
            .find(query)
            .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate('logo')
            // .populate('address')
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
            .populate('manager')
            .exec((err, doc) => {
                if (err) {
                    return res.json(err);
                }
                ClientModel.countDocuments(query).exec((count_error, count) => {
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

clientController.create = async (req, res, next) => {
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
                    email,
                    phoneNumber,
                    prospective,
                    manager,
                    address_description,
                    address_city,
                    address_country,
                    address_postalCode,
                    address_province,
                    address_district,
                    address_ward,
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
                const managerFind = manager ? await PersonModel.findById(manager) : null;

                const address = AddressModel({
                    description: address_description,
                    city: address_city,
                    country: address_country,
                    postalCode: address_postalCode,
                    province: address_province ? address_province : null,
                    district: address_district ? address_district : null,
                    ward: address_ward ? address_ward : null,
                })
                const addressSaved = await address.save();

                const itemSaved = await ClientModel({
                    name: name,
                    code: code,
                    email: email,
                    phoneNumber: phoneNumber,
                    prospective: prospective,
                    type: type,
                    manager: managerFind ? managerFind._id : null,
                    address: addressSaved ? addressSaved._id : null,
                    logo: logoSaved ? logoSaved._id : null,
                }).save();
                return res.status(httpStatus.OK).json({
                    item: itemSaved,
                })
            } catch (e) {
                next(e)
            }
        })
    } catch (e) {
        next(e)
    }
}

clientController.edit = async (req, res, next) => {
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
                    email,
                    phoneNumber,
                    prospective,
                    manager,
                    address_description,
                    address_city,
                    address_country,
                    address_postalCode,
                    address_province,
                    address_district,
                    address_ward,
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
                let addressId = item.address?._id;
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
                const managerFind = !!manager ? await PersonModel.findById(manager) : null;
                const itemSaved = await ClientModel.findByIdAndUpdate(paramId, {
                    name: name,
                    code: code,
                    email: email,
                    phoneNumber: phoneNumber,
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

clientController.show = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await ClientModel.findById(paramId)
            .populate('logo')
            // .populate('address')
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
            .populate('manager');

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

clientController.delete = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let paramId = req.params.id;
        let item = await ClientModel.findByIdAndDelete(paramId);
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

module.exports = clientController;
