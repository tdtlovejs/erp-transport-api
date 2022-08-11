const httpStatus = require("../utils/httpStatus");
const formidable = require("formidable");
const UserModel = require("../models/user");
const {ROLE_SUPERADMIN, ROLE_ADMIN, VEHICLE_STATUS_MOVING, GPS_ROUTE_STATUS_COMPLETED, TRANSPORT_STATUS_COMPLETED,
    REAL_TIME_GPS_POINT, LANGUAGE_EN
} = require("../utils/constants");
const GpsPointModel = require("../models/gpsPoint");
const EquipmentTypeModel = require("../models/equipmentType");
const GpsRouteModel = require("../models/gpsRoute");
const VehicleModel = require("../models/vehicle");
const TransportOrderModel = require("../models/transportOrder");
const gpsPointController = {};

gpsPointController.list = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.maxPerPage) || 5;
        const maxPerPageAll = req.query.maxPerPageAll == 1;
        const query = req.query.search ? {
            $text: { $search: req.query.search},
            ...(req.query.gpsRouteId ? {gpsRoute: req.query.gpsRouteId} : {})
        } : {
            ...(req.query.gpsRouteId ? {gpsRoute: req.query.gpsRouteId} : {})
        }
        GpsPointModel
            .find(query)
            // .sort({'updatedAt':-1})
            .skip(!maxPerPageAll ? (page - 1) * limit : undefined)
            .limit(!maxPerPageAll ? limit : undefined)
            .populate('gpsRoute')
            .exec((err, doc) => {
                if (err) {
                    return res.json(err);
                }
                GpsPointModel.countDocuments(query).exec((count_error, count) => {
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

gpsPointController.create = async (req, res, next) => {
    try {
        const currentUserId = req.userId;
        const form = new formidable.IncomingForm();
        form.multiples = true; //
        form.parse(req, async function (err, fields, files) {
            try {
                const {
                    longitude,
                    latitude,
                    time,
                    distance,
                    gpsRoute,
                    isComplete
                } = fields;
                const newISOString = new Date().toISOString();
                const gpsRouteFind = gpsRoute ? await GpsRouteModel.findById(gpsRoute) : null;
                let gpsRouteSaved = gpsRouteFind;
                const gpsPoint = GpsPointModel({
                    longitude: longitude,
                    latitude: latitude,
                    time: time,
                    distance: distance,
                    gpsRoute: gpsRouteFind ? gpsRouteFind._id : null,
                })
                let vehicleSaved = await VehicleModel.findById(gpsRouteFind.vehicle);
                const gpsPointSaved = await gpsPoint.save();
                if (isComplete == 1 && gpsRouteFind) {
                    gpsRouteSaved = await GpsRouteModel.findByIdAndUpdate(gpsRouteFind._id, {
                        status: GPS_ROUTE_STATUS_COMPLETED,
                        endAt: newISOString
                    })
                        // .populate({
                        //     path: 'vehicle',
                        //     populate: {
                        //         path: 'logo',
                        //     }
                        // })
                        .populate({
                            path: 'driver',
                            populate: {
                                path: 'avatar',
                            }
                        })
                        .populate('transportOrder');

                    if (gpsRouteFind.vehicle) {
                        vehicleSaved = await VehicleModel.findByIdAndUpdate(gpsRouteFind.vehicle, {
                            status: ''
                        })
                    }
                    if (gpsRouteFind.transportOrder) {
                        const transportSaved = await TransportOrderModel.findByIdAndUpdate(gpsRouteFind.transportOrder, {
                            status: TRANSPORT_STATUS_COMPLETED,
                            arrivalAt: newISOString
                        })
                    }
                }
                try {
                    global._io.emit(REAL_TIME_GPS_POINT, {
                        gpsRoute: gpsRouteSaved,
                        gpsPoint: gpsPointSaved,
                        vehicle: vehicleSaved
                    })
                } catch (e) {
                }

                return res.status(httpStatus.OK).json({
                    item: gpsPointSaved,
                    // vehicle: vehicleSaved,
                    gpsRoute1223: gpsRouteSaved,
                })
            } catch (e) {
                next(e)
            }
        })
    } catch (e) {
        next(e)
    }
}

module.exports = gpsPointController;
