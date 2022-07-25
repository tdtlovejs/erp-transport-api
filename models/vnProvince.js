const mongoose = require('mongoose');

const vnProvinceSchema = new mongoose.Schema({
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
    phoneCode: {
        type: Number,
        required: false,
    },
});
vnProvinceSchema.set('timestamps', true);
const vnProvince = mongoose.model('VnProvince', vnProvinceSchema);

module.exports = vnProvince;
