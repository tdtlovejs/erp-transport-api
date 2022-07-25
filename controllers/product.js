const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {ROLE_EMPLOYEE, STATUS_UPLOAD_FILE_SUCCESS, DOCUMENT_TYPE_LOGO, ROLE_SUPERADMIN, ROLE_ADMIN, LANGUAGE_EN} = require("../utils/constants");
const {uploadFile} = require("../uploads/UploadFile");
const DocumentModel = require("../models/document");
const ProductModel = require("../models/product");
const ProductTypeModel = require("../models/productType");
const documentModel = require("../models/document");

const productController = {};

productController.list = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const query = req.query.search ? {$text: { $search: req.query.search}} : {}
        ProductModel
            .find(query)
            .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate('logo')
            .populate('type')
            .exec((err, doc) => {
                if (err) {
                    return res.json(err);
                }
                ProductModel.countDocuments(query).exec((count_error, count) => {
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

productController.create = async (req, res, next) => {
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
                    price,
                    type,
                    unit
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
                console.log(type)
                const typeFind = type ? await ProductTypeModel.findById(type) : null;
                const product = ProductModel({
                    name: name,
                    code: code,
                    price: price,
                    type: typeFind ? typeFind._id : null,
                    unit: unit,
                    logo: logoSaved ? logoSaved._id : null,
                })
                const productSaved = await product.save();
                return res.status(httpStatus.OK).json({
                    item: productSaved,
                })
            } catch (e) {
                next(e)
            }
        })
    } catch (e) {
        next(e)
    }
}

productController.edit = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        let paramId = req.params.id;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let item = await ProductModel.findById(paramId);
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
                    price,
                    type,
                    unit,
                    logo
                } = fields;
                console.log(type)
                let logoSaved = null;
                if (logo !== undefined) {
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
                const typeFind = type ? await ProductTypeModel.findById(type) : null;
                const itemSaved = await ProductModel.findByIdAndUpdate(paramId, {
                    name: name,
                    code: code,
                    price: price,
                    type: typeFind ? typeFind._id : null,
                    unit: unit,
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

productController.show = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await ProductModel.findById(paramId)
            .populate('logo')
            .populate('type');
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

productController.delete = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let paramId = req.params.id;
        let item = await ProductModel.findByIdAndDelete(paramId);
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

module.exports = productController;
