const mongoose = require('mongoose');
const {GENDER_MALE, GENDER_FEMALE, GENDER_SECRET} = require("../utils/constants");

const personSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    firstName: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false,
        unique: true,
    },
    phoneNumber: {
        type: String,
        required: false,
    },
    birthday: {
        type: Date,
        required: false,
    },
    gender: {
        type: String,
        enum: [
            GENDER_MALE,
            GENDER_FEMALE,
            GENDER_SECRET
        ],
        required: false,
        default: GENDER_SECRET,
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    avatar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
});
personSchema.set('timestamps', true);
personSchema.index({firstName: 'text', lastName: 'text', email: 'text'});
const Person = mongoose.model('Person', personSchema);

module.exports = Person;
