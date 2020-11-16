const mongoose = require('mongoose');

const PredictionSchema = mongoose.Schema({
    win : String,
    color : Array,
    user_id : mongoose.Types.ObjectId,
    qty : Number,
},{
    timestamps : true
});

module.exports = mongoose.model('Prediction', PredictionSchema);