const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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
    description: {
        type: String,
        required: false,
    },
    startDate: {
        type: Date,
        required: false,
    },
    endDate: {
        type: Date,
        required: false,
    },
    days: {
        type: Number,
        required: false,
    },
    amount: {
        type: Number,
        required: false,
    },
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectType'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    equipments: [
        {
            equipment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Equipment"
            },
            amount: {
                type: Number,
                required: true,
            }
        }
    ],
});
projectSchema.set('timestamps', true);
projectSchema.index({name: 'text', code: 'text', description: 'text'});
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
