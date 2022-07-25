const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    logo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    name: {
        type: String,
        required: true,
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EquipmentType'
    },
    serialNumber: {
        type: String,
        required: false,
    },
    mark: {
        type: String,
        required: false,
    },
    model: {
        type: String,
        required: false,
    },
    version: {
        type: String,
        required: false,
    },
    purchaseDate: {
        type: Date,
        required: false,
    },
    transferDate: {
        type: Date,
        required: false,
    },
    lossDate: {
        type: Date,
        required: false,
    },
    maintenanceDate: {
        type: Date,
        required: false,
    },
});
equipmentSchema.set('timestamps', true);
equipmentSchema.index({name: 'text', code: 'text'});
const Equipment = mongoose.model('Equipment', equipmentSchema);

module.exports = Equipment;
