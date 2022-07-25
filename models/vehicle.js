const mongoose = require('mongoose');
const {GENDER_MALE, GENDER_FEMALE, GENDER_SECRET, CLIENT_TYPE_PERSONAL, CLIENT_TYPE_ORGANIZATION, VEHICLE_TYPE_BICYCLE,
    VEHICLE_TYPE_ELECTRIC_BICYCLE, VEHICLE_TYPE_MOTORCYCLE, VEHICLE_TYPE_ELECTRIC_MOTORCYCLE, VEHICLE_TYPE_CAR,
    VEHICLE_TYPE_ELECTRIC_CAR, VEHICLE_TYPE_TRUCK, VEHICLE_TYPE_OTHER,
    GPS_ROUTE_STATUS_COMPLETED,
    GPS_ROUTE_STATUS_MOVING
} = require("../utils/constants");

const vehicleSchema = new mongoose.Schema({
    logo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    name: {
        type: String,
        required: false,
    },
    code: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        enum: [
            VEHICLE_TYPE_BICYCLE,
            VEHICLE_TYPE_ELECTRIC_BICYCLE,
            VEHICLE_TYPE_MOTORCYCLE,
            VEHICLE_TYPE_ELECTRIC_MOTORCYCLE,
            VEHICLE_TYPE_CAR,
            VEHICLE_TYPE_ELECTRIC_CAR,
            VEHICLE_TYPE_TRUCK,
            VEHICLE_TYPE_OTHER
        ],
        required: false,
    },
    status: {
        type: String,
        enum: [
            GPS_ROUTE_STATUS_COMPLETED,
            GPS_ROUTE_STATUS_MOVING,
        ],
        required: false,
    },
});
vehicleSchema.set('timestamps', true);
vehicleSchema.index({name: 'text', code: 'text'});
const Client = mongoose.model('Vehicle', vehicleSchema);

module.exports = Client;
