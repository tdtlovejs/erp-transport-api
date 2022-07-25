const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {STATUS_UPLOAD_FILE_SUCCESS, ROLE_SUPERADMIN, ROLE_ADMIN, INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_ACCEPTED, DOCUMENT_TYPE_INVOICE_PDF, LANGUAGE_EN
} = require("../utils/constants");
const {uploadFile} = require("../uploads/UploadFile");
const DocumentModel = require("../models/document");
const ClientModel = require("../models/client");
const AddressModel = require("../models/address");
const InvoiceModel = require("../models/invoice");
const ProjectModel = require("../models/project");
const path = require('path');
const fs = require("fs");
const pdf = require("pdf-creator-node");
const moment = require("moment");
const {sendMail} = require("../service/SendMail");
const options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
};
const invoiceController = {};

invoiceController.list = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const query = req.query.search ? {$text: { $search: req.query.search}} : {}
        InvoiceModel
            .find(query)
            .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate('project')
            .populate('client')
            .populate('transportOrder')
            // .populate('clientAddress')
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
            .populate('pdf')
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
                InvoiceModel.countDocuments(query).exec((count_error, count) => {
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
invoiceController.create = async (req, res, next) => {
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
                    note,
                    exportDate,
                    expiryDate,
                    status,
                    project,
                    client,
                    transportOrder,
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

                const itemSaved = await InvoiceModel({
                    title: title,
                    note: note,
                    exportDate: exportDate,
                    expiryDate: expiryDate,
                    status: INVOICE_STATUS_DRAFT,
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
invoiceController.edit = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        let paramId = req.params.id;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let item = await InvoiceModel.findById(paramId);
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
                    note,
                    exportDate,
                    expiryDate,
                    status,
                    project,
                    client,
                    transportOrder,
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
                const itemSaved = await InvoiceModel.findByIdAndUpdate(paramId, {
                    title: title,
                    note: note,
                    exportDate: exportDate,
                    expiryDate: expiryDate,
                    status: INVOICE_STATUS_DRAFT,
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
invoiceController.show = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await InvoiceModel
            .findById(paramId)
            .populate('project')
            .populate('client')
            .populate('transportOrder')
            // .populate('clientAddress')
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
            .populate('pdf')
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
invoiceController.changeStatus = async (req, res, next) => {
    try {
        let paramId = req.params.id;
        let item = await InvoiceModel.findById(paramId);
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
                const itemSaved = await InvoiceModel.findByIdAndUpdate(paramId, {
                    ...([INVOICE_STATUS_DRAFT, INVOICE_STATUS_ACCEPTED].includes(status) ? {
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
invoiceController.exportPdf = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await InvoiceModel.findById(paramId)
            .populate({
                path : 'project',
                populate : {
                    path : 'logo',
                }
            })
            .populate('client')
            .populate({
                path: 'client',
                populate: {
                    path: 'logo',
                }
            })
            .populate({
                path : 'client',
                populate: {
                    path: 'address',
                    populate: {
                        path: 'province',
                    }
                }
            })
            .populate({
                path : 'client',
                populate: {
                    path: 'address',
                    populate: {
                        path: 'district',
                    }
                }
            })
            .populate({
                path : 'client',
                populate: {
                    path: 'address',
                    populate: {
                        path: 'ward',
                    }
                }
            })
            .populate('pdf')
            // .populate('clientAddress')
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
        const html = fs.readFileSync(path.join(__dirname, '../views/invoice-export-pdf.html'), 'utf-8');

        let amountTotal = 0;
        item.products.forEach((itemP, indexP) => {
            amountTotal += Number((itemP.price ?? 0) * (itemP.amount ?? 0));
        })

        const bitmapProjectLogo = fs.readFileSync(path.join(__dirname, '../views/images/calendar.png'));
        let calendar_icon = bitmapProjectLogo.toString('base64');
        const document = {
            html: html,
            data: {
                paramId: item._id,
                title: item.title,
                note: item.note,
                exportDate: item.exportDate ? moment(item.exportDate).format('LL') : '',
                expiryDate: item.expiryDate ? moment(item.expiryDate).format('LL') : '',
                products: item.products.map((item, index) => ({
                    ...item,
                    name: item.product?.name ?? "",
                    price: Number(item.price ?? 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + " VND",
                    amount: item.amount ?? "",
                    totalPrice: Number((item.price ?? 0)*(item.amount ?? 0)).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + " VND",
                })),
                comment: item.comment,
                clientName: item.clientName,
                clientEmail: item.clientEmail,
                clientPhoneNumber: item.clientPhoneNumber,
                clientDescription: item.clientDescription,
                clientAddress_province: item.clientAddress?.province?.name ?? "",
                clientAddress_district: item.clientAddress?.province?.name ?? "",
                clientAddress_ward: item.clientAddress?.ward?.name ?? "",
                clientAddress_description: item.clientAddress?.description ?? "",
                amountTotal: amountTotal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + " VND",
                // project
                project_name: item.project?.name ?? "",
                project_code: item.project?.description ?? "",

                // client
                client_name: item.client?.name ?? "",
                client_code: item.client?.code ?? "",
                client_email: item.client?.email ?? "",
                client_phoneNumber: item.client?.phoneNumber ?? "",
                clientAddressProvince: item.client?.address?.province?.name ?? '',
                clientAddressDistrict: item.client?.address?.district?.name ?? '',
                clientAddressWard: item.client?.address?.ward?.name ?? '',
                clientAddDescription: item.client?.address?.description ?? "",
                calendar_icon: calendar_icon
            },
            path: "./views/invoice_pdf/"+item._id+".pdf",
            type: "",
        };

        pdf
            .create(document, options)
            .then(async () => {
                const fileData = {
                    fileName: item._id + '.pdf',
                    mimeType: 'application/pdf',
                    isLocal: true,
                    pathLocal: path.join(__dirname, '../views/invoice_pdf/' + item._id + '.pdf')
                }
                const resUpload = await uploadFile(fileData);
                if (resUpload.status === STATUS_UPLOAD_FILE_SUCCESS) {
                    const pdfDocId = item.pdf?._id;
                    const pdfSaved = pdfDocId ? await DocumentModel.findByIdAndUpdate(pdfDocId, {
                        fileId: resUpload.fileId,
                        fileName: item._id + '.pdf',
                        originalName: item._id + '.pdf',
                        mimeType: 'application/pdf',
                        documentType: DOCUMENT_TYPE_INVOICE_PDF
                    }) : await DocumentModel({
                        fileId: resUpload.fileId,
                        fileName: item._id + '.pdf',
                        originalName: item._id + '.pdf',
                        mimeType: 'application/pdf',
                        documentType: DOCUMENT_TYPE_INVOICE_PDF
                    }).save();
                    const itemSaved = await InvoiceModel.findByIdAndUpdate(item._id, {
                        pdf: pdfSaved ? pdfSaved._id : null,
                    });
                    if (itemSaved) {
                        return res.status(httpStatus.OK).json({
                            item: itemSaved,
                        })
                    }
                } else {
                    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                        item: item
                    });
                }
            })
            .catch((error) => {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
            });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}
invoiceController.delete = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const currentUser = await UserModel.findById(currentUserId);
        if (![ROLE_SUPERADMIN, ROLE_ADMIN].includes(currentUser.role)) {
            return res.status(httpStatus.FORBIDDEN).json({
                message: req.language === LANGUAGE_EN ? 'You do not have permission to perform this action!' : 'Bạn không có quyền thưc hiện hành động này!'
            });
        }
        let paramId = req.params.id;
        let item = await InvoiceModel.findByIdAndDelete(paramId);
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

invoiceController.getTotalAmountByYear = async (req, res, next) => {
    try {
        let paramId = req.params.id;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const items = await InvoiceModel.find({
            exportDate: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year+1, 0, 1),
                $ne: null
            }
        })


        let data = {};
        [0,1,2,3,4,5,6,7,8,9,10,11].forEach((month) => {
            data[month] = 0;
        })
        items.forEach((item, index) => {
            const month = new Date(item.exportDate).getMonth()
            let totalAmountByMonth = 0;
            item.products.forEach((itemP, indexP) => {
                totalAmountByMonth += Number(itemP.amount ?? 0) * Number(itemP.price ?? 0);
            })
            if (!data.hasOwnProperty(month)) {
                data[month] = totalAmountByMonth;
            } else {
                data[month] += data[month] + totalAmountByMonth;
            }
        })

        return res.status(httpStatus.OK).json({
            // items: items,
            total: data
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}

invoiceController.sendPdfToClient = async (req, res, next) => {
    try {
        let paramId = req.params.id;

        let item = await InvoiceModel
            .findById(paramId)
            .populate('client')
            .populate('pdf')
        if (item == null) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: req.language === LANGUAGE_EN ? 'Not found!' : 'Không tìm thấy!'
            });
        }
        const email = item.client?.email ? item.client?.email : item.clientEmail ?? null;
        if (item.pdf && email) {
            const title = item.title ?? "";
            const name = item.client?.name ?? "";
            const filePdfId = item.pdf?.fileId;
            const linkFilePdf = filePdfId ? `https://drive.google.com/uc?export=view&id=${filePdfId}` : null;
            const message = {
                from: 'tdtsystem99@gmail.com',
                to: email,
                subject: 'TDT System | Invoice Pdf',
                html: '<!DOCTYPE html>\n' +
                    '<html>\n' +
                    '<head>\n' +
                    '    <title>Page Title</title>\n' +
                    '</head>\n' +
                    '<body>\n' +
                    '<div style="background-color: #F5F5F5!important; padding: 40px;">\n' +
                    '    <div>\n' +
                    '        <h1>Invoice | '+title+'!</h1>\n' +
                    '    </div>\n' +
                    '    <div>\n' +
                    '        <img\n' +
                    '            alt="logo"\n' +
                    '            src="https://tdt-app.herokuapp.com/logo.png"\n' +
                    '            style="width: 60px; height: 60px;"\n' +
                    '        />\n' +
                    '    </div>\n' +
                    '    <div style="color: #54516a; font-weight: 600; font-size: 24px; margin: 10px 0;">\n' +
                    '        Hi '+name+'!\n' +
                    '    </div>\n' +
                    '\n' +
                    '    <div style="color: #282c34; font-size: 18px;">\n' +
                    '        To download invoice pdf please\n' +
                    '        <a\n' +
                    '                href="'+linkFilePdf+'"\n' +
                    '                style="color: #4169E1; font-weight: 700;"\n' +
                    '        >\n' +
                    '            click here\n' +
                    '        </a>\n' +
                    '    </div>\n' +
                    '</div>\n' +
                    '</body>\n' +
                    '</html>\n',
                    attachments: [{
                        filename:`${item._id}.pdf`,
                        contentType: 'application/pdf',
                        path: linkFilePdf
                    }]
            };
            const resSendMail = await sendMail(message);
            const itemSaved = await InvoiceModel.findByIdAndUpdate(item._id, {
                countSent: (item.countSent ?? 0) + 1
            });
            if (itemSaved) {
                return res.status(httpStatus.OK).json({
                    item: itemSaved,
                })
            }
        }
        return res.status(httpStatus.OK).json({
            item: item
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}
module.exports = invoiceController;
