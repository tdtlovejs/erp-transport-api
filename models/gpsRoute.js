const mongoose = require('mongoose');
const {GENDER_MALE, GENDER_FEMALE, GENDER_SECRET, GPS_ROUTE_STATUS_AVAILABLE_STATUS,
    GPS_ROUTE_STATUS_UNAVAILABLE_STATUS, GPS_ROUTE_STATUS_MOVING_STATUS, GPS_ROUTE_STATUS_COMPLETED,
    GPS_ROUTE_STATUS_MOVING
} = require("../utils/constants");

const gpsRouteSchema = new mongoose.Schema({
    startAt: {
        type: Date,
        required: false,
    },
    endAt: {
        type: Date,
        required: false,
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    status: {
        type: String,
        enum: [
            GPS_ROUTE_STATUS_COMPLETED,
            GPS_ROUTE_STATUS_MOVING,
        ],
        required: false,
    },
    gpsPoints: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GpsPoint"
        },
    ],
    duration: {
        type: Number,
        required: false,
    },
    distance: {
        type: Number,
        required: false,
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person'
    },
    transportOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TransportOrder'
    },
});
gpsRouteSchema.set('timestamps', true);
const gpsRoute = mongoose.model('gpsRoute', gpsRouteSchema);

module.exports = gpsRoute;
