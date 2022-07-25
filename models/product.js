const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
    price: {
        type: Number,
        required: false,
    },
    // vat: {
    //     type: Number,
    //     required: false,
    // },
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductType'
    },
    unit: {
        type: String,
        required: false,
    },
});
productSchema.set('timestamps', true);
productSchema.index({name: 'text', code: 'text'});
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
