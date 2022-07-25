const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    description: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: false,
    },
    postalCode: {
        type: String,
        required: false,
    },
    province: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VnProvince'
    },
    district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VnDistrict'
    },
    ward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VnWard'
    }
}, {
    timestamps: true
})

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
