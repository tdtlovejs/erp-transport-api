const mongoose = require('mongoose');

const equipmentTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: false,
    }
});
equipmentTypeSchema.set('timestamps', true);
equipmentTypeSchema.index({name: 'text', code: 'text'});
const EquipmentType = mongoose.model('EquipmentType', equipmentTypeSchema);

module.exports = EquipmentType;
