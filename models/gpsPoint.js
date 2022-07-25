const mongoose = require('mongoose');

const gpsPointSchema = new mongoose.Schema({
    longitude: {
        type: String,
        required: false,
    },
    latitude: {
        type: String,
        required: false,
    },
    time: {
        type: Date,
        required: false,
    },
    distance: {
        type: Number,
        required: false,
    },
    gpsRoute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'gpsRoute'
    },
});
gpsPointSchema.set('timestamps', true);
const GpsPoint = mongoose.model('GpsPoint', gpsPointSchema);

module.exports = GpsPoint;
