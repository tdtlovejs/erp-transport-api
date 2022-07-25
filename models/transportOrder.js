const mongoose = require('mongoose');
const {GENDER_MALE, GENDER_FEMALE, GENDER_SECRET, TRANSPORT_STATUS_WAITING, TRANSPORT_STATUS_COMPLETED,
    TRANSPORT_STATUS_CANCELED
} = require("../utils/constants");

const transportOrderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: [
            TRANSPORT_STATUS_WAITING,
            TRANSPORT_STATUS_COMPLETED,
            TRANSPORT_STATUS_CANCELED
        ],
        required: false,
        default: TRANSPORT_STATUS_WAITING,
    },
    expectedDepartAt: {
        type: Date,
        required: false,
    },
    expectedArrivalAt: {
        type: Date,
        required: false,
    },
    departAt: {
        type: Date,
        required: false,
    },
    arrivalAt: {
        type: Date,
        required: false,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
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
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
        }
    ],
});
transportOrderSchema.set('timestamps', true);
transportOrderSchema.index({title: 'text'});
const TransportOrder = mongoose.model('TransportOrder', transportOrderSchema);

module.exports = TransportOrder;
