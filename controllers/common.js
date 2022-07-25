const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {ROLE_EMPLOYEE, STATUS_UPLOAD_FILE_SUCCESS, DOCUMENT_TYPE_LOGO, ROLE_SUPERADMIN, ROLE_ADMIN} = require("../utils/constants");
const {uploadFile} = require("../uploads/UploadFile");
const DocumentModel = require("../models/document");
const VehicleModel = require("../models/vehicle");
const ProductTypeModel = require("../models/productType");
const ProductModel = require("../models/product");
const ProjectTypeModel = require("../models/projectType");
const ProjectModel = require("../models/project");
const EquipmentTypeModel = require("../models/equipmentType");
const EquipmentModel = require("../models/equipment");
const ClientModel = require("../models/client");
const InvoiceModel = require("../models/invoice");
const TransportOrderModel = require("../models/transportOrder");
const PersonModel = require("../models/person");
const GpsPointModel = require("../models/gpsPoint");
const GpsRouteModel = require("../models/gpsRoute");
const commonController = {};
commonController.showStatis = async (req, res, next) => {
    try {
        const countVehicle = await VehicleModel.countDocuments({});
        const countProductType = await ProductTypeModel.countDocuments({});
        const countProduct = await ProductModel.countDocuments({});
        const countProjectType = await ProjectTypeModel.countDocuments({});
        const countProject= await ProjectModel.countDocuments({});
        const countEquipmentType = await EquipmentTypeModel.countDocuments({});
        const countEquipment = await EquipmentModel.countDocuments({});
        const countClient = await ClientModel.countDocuments({});
        const countInvoice = await InvoiceModel.countDocuments({});
        const countTransportOrder = await TransportOrderModel.countDocuments({});
        const countPerson = await PersonModel.countDocuments({});
        const countGpsRoute = await GpsRouteModel.countDocuments({});
        return res.status(httpStatus.OK).json({
            count: {
                vehicle: countVehicle,
                productType: countProductType,
                product: countProduct,
                projectType: countProjectType,
                project: countProject,
                equipmentType: countEquipmentType,
                equipment: countEquipment,
                client: countClient,
                invoice: countInvoice,
                transportOrder: countTransportOrder,
                person: countPerson,
                gpsRoute: countGpsRoute
            }
        });
    } catch (e) {
        next(e)
    }
}


module.exports = commonController;
