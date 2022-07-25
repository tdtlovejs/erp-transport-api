const mongoose = require('mongoose');

const projectTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: false,
    }
});
projectTypeSchema.set('timestamps', true);
projectTypeSchema.index({name: 'text', code: 'text'});
const ProjectType = mongoose.model('ProjectType', projectTypeSchema);

module.exports = ProjectType;
