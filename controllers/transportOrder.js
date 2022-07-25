const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {ROLE_SUPERADMIN, ROLE_ADMIN, INVOICE_STATUS_DRAFT, TRANSPORT_STATUS_WAITING, TRANSPORT_STATUS_COMPLETED, TRANSPORT_STATUS_CANCELED, LANGUAGE_EN} = require("../utils/constants");
const ClientModel = require("../models/client");
const AddressModel = require("../models/address");
const TransportOrderModel = require("../models/transportOrder");
const ProjectModel = require("../models/project");
const InvoiceModel = require("../models/invoice");
const transportOrderController = {};

transportOrderController.list = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const status = req.query.status ? req.query.status : null;
        const query = req.query.search ? {
            $text: { $search: req.query.search},
            ...(status ? {status: status} : {})
        } : {
            ...(status ? {status: status} : {})
        }
        TransportOrderModel
            .find(query)
            .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate('project')
            .populate('client')
            .populate('invoice')
            .populate({
                path: 'clientAddress',
                populate: {
                    path: 'province',
                }
            })
            .populate({
                path: 'clientAddress',
                populate: {
                    path: 'district',
                }
            })
            .populate({
                path: 'clientAddress',
                populate: {
                    path: 'ward',
                }
            })
            .populate({
                path : 'products.product',
                populate : {
                    path : 'logo',
                }
            })
            .exec((err, doc) => {
                if (err) {
                    return res.json(err);
                }
                TransportOrderModel.countDocuments(query).exec((count_error, count) => {
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

transportOrderController.create = async (req, res, next) => {
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
                    title,
                    expectedDepartAt,
                    expectedArrivalAt,
                    departAt,
                    arrivalAt,
                    project,
                    client,
                    addInfoClient,
                    clientName,
                    clientEmail,
                    clientPhoneNumber,
                    clientDescription,
                    clientAddress_address_description,
                    clientAddress_address_city,
                    clientAddress_address_country,
                    clientAddress_address_postalCode,
                    clientAddress_address_province,
                    clientAddress_address_district,
                    clientAddress_address_ward,
                    comment,
                    products
                } = fields;
                let dataProducts = Array.isArray(JSON.parse(products)) ? JSON.parse(products) : []

                const projectFind = project ? await ProjectModel.findById(project) : null;
                const clientFind = client ? await ClientModel.findById(client) : null;
                const address = AddressModel({
                    description: clientAddress_address_description,
                    city: clientAddress_address_city,
                    country: clientAddress_address_country,
                    postalCode: clientAddress_address_postalCode,
                    province: clientAddress_address_province ? clientAddress_address_province : null,
                    district: clientAddress_address_district ? clientAddress_address_district : null,
                    ward: clientAddress_address_ward ? clientAddress_address_ward : null,
                })
                const addressSaved = await address.save();

                const itemSaved = await TransportOrderModel({
                    title: title,
                    expectedDepartAt: expectedDepartAt,
                    expectedArrivalAt: expectedArrivalAt,
                    departAt: departAt,
                    arrivalAt: arrivalAt,
                    status: TRANSPORT_STATUS_WAITING,
                    project: projectFind ? projectFind._id : null,
                    client: clientFind ? clientFind._id : null,
                    clientAddress: addressSaved ? addressSaved._id : null,
                    clientName: clientName,
                    clientEmail: clientEmail,
                    clientPhoneNumber: clientPhoneNumber,
                    clientDescription: clientDescription,
                    comment: comment,
                    addInfoClient: addInfoClient,
                    products: dataProducts.map((item, index) => {
                        return ({
                            product: item.product,
                            amount: item.amount,
                            price: item.price,
                        })
                    })
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

transportOrderController.edit = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        let paramId = req.params.id;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let item = await TransportOrderModel.findById(paramId);
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
                    title,
                    expectedDepartAt,
                    expectedArrivalAt,
                    departAt,
                    arrivalAt,
                    project,
                    client,
                    addInfoClient,
                    clientName,
                    clientEmail,
                    clientPhoneNumber,
                    clientDescription,
                    clientAddress_address_description,
                    clientAddress_address_city,
                    clientAddress_address_country,
                    clientAddress_address_postalCode,
                    clientAddress_address_province,
                    clientAddress_address_district,
                    clientAddress_address_ward,
                    comment,
                    products
                } = fields;
                let dataProducts = Array.isArray(JSON.parse(products)) ? JSON.parse(products) : []

                let addressId = item.clientAddress?._id;
                const addressFind = addressId ? await AddressModel.findById(addressId) : null;
                addressId = addressFind ? addressFind._id : null;
                const addressSaved = addressId ? await AddressModel.findByIdAndUpdate(addressId, {
                    description: clientAddress_address_description,
                    city: clientAddress_address_city,
                    country: clientAddress_address_country,
                    postalCode: clientAddress_address_postalCode,
                    province: clientAddress_address_province ? clientAddress_address_province : null,
                    district: clientAddress_address_district ? clientAddress_address_district : null,
                    ward: clientAddress_address_ward ? clientAddress_address_ward : null,
                }) : await AddressModel({
                    description: clientAddress_address_description,
                    city: clientAddress_address_city,
                    country: clientAddress_address_country,
                    postalCode: clientAddress_address_postalCode,
                    province: clientAddress_address_province ? clientAddress_address_province : null,
                    district: clientAddress_address_district ? clientAddress_address_district : null,
                    ward: clientAddress_address_ward ? clientAddress_address_ward : null,
                }).save();
                const projectFind = project ? await ProjectModel.findById(project) : null;
                const clientFind = client ? await ClientModel.findById(client) : null;
                const itemSaved = await TransportOrderModel.findByIdAndUpdate(paramId, {
                    title:title,
                    expectedDepartAt: expectedDepartAt,
                    expectedArrivalAt: expectedArrivalAt,
                    departAt: departAt,
                    arrivalAt: arrivalAt,
                    project: projectFind ? projectFind._id : null,
                    client: clientFind ? clientFind._id : null,
                    clientAddress: addressSaved ? addressSaved._id : null,
                    clientName: clientName,
                    clientEmail: clientEmail,
                    clientPhoneNumber: clientPhoneNumber,
                    clientDescription: clientDescription,
                    comment: comment,
                    addInfoClient: addInfoClient,
                    products: dataProducts.map((item, index) => {
                        return ({
                            product: item.product,
                            amount: item.amount,
                            price: item.price,
                        })
                    })
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

transportOrderController.changeStatus = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        let paramId = req.params.id;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let item = await TransportOrderModel.findById(paramId);
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
                    status
                } = fields;
                const itemSaved = await TransportOrderModel.findByIdAndUpdate(paramId, {
                    ...([TRANSPORT_STATUS_WAITING, TRANSPORT_STATUS_COMPLETED, TRANSPORT_STATUS_CANCELED].includes(status) ? {
                        status: status
                    } : {})
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

transportOrderController.createInvoice = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        let paramId = req.params.id;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let item = await TransportOrderModel.findById(paramId).populate('clientAddress');
        if (item == null) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: req.language === LANGUAGE_EN ? 'Not found!' : 'Không tìm thấy!'
            });
        }
        if (item.status === TRANSPORT_STATUS_COMPLETED) {
            const address = AddressModel({
                description: item.clientAddress?.description ?? "",
                city: item.clientAddress?.city ?? "",
                country: item.clientAddress?.country ?? "",
                postalCode: item.clientAddress?.postalCode ?? "",
                province: item.clientAddress?.province ? item.clientAddress?.province : null,
                district: item.clientAddress?.district ? item.clientAddress?.district : null,
                ward: item.clientAddress?.ward ? item.clientAddress?.ward : null,
            })
            const addressSaved = await address.save();
            const invoice = InvoiceModel({
                title: "TO_" + item.title ?? "",
                exportDate: new Date().toISOString(),
                status: INVOICE_STATUS_DRAFT,
                project: item.project ? item.project : null,
                client: item.client ? item.client : null,
                clientAddress: addressSaved ? addressSaved._id : null,
                clientName: item.clientName ?? "",
                clientDescription: item.clientDescription ?? "",
                comment: item.comment ?? "",
                addInfoClient: !!item.addInfoClient,
                products: item.products.map((itemP, index) => {
                    return ({
                        product: itemP.product,
                        amount: itemP.amount,
                        price: itemP.price,
                    })
                }),
                transportOrder: item._id,
            })
            const invoiceSaved = await invoice.save();
            const itemSaved = await TransportOrderModel.findByIdAndUpdate(item._id, {
                invoice: invoiceSaved._id
            });
            return res.status(httpStatus.OK).json({
                item: itemSaved,
                invoice: invoiceSaved
            })
        } else {
            return res.status(httpStatus.BAD_REQUEST).json({
                message: req.language === LANGUAGE_EN ? 'Transport order not completed!' : 'Đơn hàng chưa hoàn thành!'
            })
        }
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}


transportOrderController.show = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await TransportOrderModel
            .findById(paramId)
            .populate('project')
            .populate('client')
            .populate('invoice')
            .populate({
                path: 'clientAddress',
                populate: {
                    path: 'province',
                }
            })
            .populate({
                path: 'clientAddress',
                populate: {
                    path: 'district',
                }
            })
            .populate({
                path: 'clientAddress',
                populate: {
                    path: 'ward',
                }
            })
            .populate({
                path : 'products.product',
                populate : {
                    path : 'logo',
                }
            })
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

transportOrderController.delete = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let paramId = req.params.id;
        let item = await TransportOrderModel.findByIdAndDelete(paramId);
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

module.exports = transportOrderController;
