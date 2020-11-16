const mongoose = require('mongoose');

const LimitSchema = mongoose.Schema({
    user_id : mongoose.Types.ObjectId,
    start : String,
    end : String,
    day : Date
},{
    timestamps : true
});

module.exports = mongoose.model('Limit', LimitSchema);