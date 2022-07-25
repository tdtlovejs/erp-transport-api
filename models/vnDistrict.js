const mongoose = require('mongoose');

const vnDistrictSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: Number,
        required: true,
        unique: true,
    },
    codename: {
        type: String,
        required: false,
    },
    divisionType: {
        type: String,
        required: false,
    },
    shortCodename: {
        type: String,
        required: false,
    },
    vnProvince: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VnProvince',
        required: true,
    }
});
vnDistrictSchema.set('timestamps', true);
const vnDistrict = mongoose.model('VnDistrict', vnDistrictSchema);

module.exports = vnDistrict;
