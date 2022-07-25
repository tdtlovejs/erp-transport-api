const mongoose = require('mongoose');
const {GENDER_MALE, GENDER_FEMALE, GENDER_SECRET, CLIENT_TYPE_PERSONAL, CLIENT_TYPE_ORGANIZATION} = require("../utils/constants");

const clientSchema = new mongoose.Schema({
    logo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    name: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: false,
    },
    phoneNumber: {
        type: String,
        required: false,
    },
    code: {
        type: String,
        required: false,
    },
    prospective: {
        type: Boolean,
        required: false,
        default: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Person'
    },
    type: {
        type: String,
        enum: [
            CLIENT_TYPE_PERSONAL,
            CLIENT_TYPE_ORGANIZATION,
        ],
        // required: true,
        default: CLIENT_TYPE_PERSONAL,
    },
});
clientSchema.set('timestamps', true);
clientSchema.index({name: 'text', code: 'text'});
const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
