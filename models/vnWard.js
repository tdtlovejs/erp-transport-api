const mongoose = require('mongoose');

const vnWardSchema = new mongoose.Schema({
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
    shortCodename: {
        type: String,
        required: false,
    },
    vnDistrict: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VnDistrict',
        required: true,
    }
});
vnWardSchema.set('timestamps', true);
const vnWard = mongoose.model('VnWard', vnWardSchema);

module.exports = vnWard;
