const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: false,
        unique: true
    }
});
productTypeSchema.set('timestamps', true);
productTypeSchema.index({name: 'text', code: 'text'});
const ProductType = mongoose.model('ProductType', productTypeSchema);

module.exports = ProductType;
