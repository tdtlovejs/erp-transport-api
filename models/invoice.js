const mongoose = require('mongoose');
const {INVOICE_STATUS_DRAFT, INVOICE_STATUS_ACCEPTED} = require("../utils/constants");
const {boolean} = require("joi");

const invoiceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
    },
    note: {
        type: String,
        required: false,
    },
    exportDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        enum: [
            INVOICE_STATUS_DRAFT,
            INVOICE_STATUS_ACCEPTED,
        ],
        required: false,
        default: INVOICE_STATUS_DRAFT,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    transportOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TransportOrder'
    },
    addInfoClient: {
        type: Boolean,
        required: false,
        default: false
    },
    clientName: {
        type: String,
        required: false,
    },
    clientEmail: {
        type: String,
        required: false,
        unique: false,
    },
    clientPhoneNumber: {
        type: String,
        required: false,
    },
    clientDescription: {
        type: String,
        required: false,
    },
    clientAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    comment: {
        type: String,
        required: false,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            amount: {
                type: Number,
                required: false,
            },
            // name: {
            //     type: String,
            //     required: false,
            // },
            price: {
                type: Number,
                required: false,
            },
        }
    ],
    pdf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    countSent: {
        type: Number,
        required: false,
    },
});
invoiceSchema.set('timestamps', true);
invoiceSchema.index({title: 'text', note: 'text'});
const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
