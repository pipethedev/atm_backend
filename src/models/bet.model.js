const mongoose = require('mongoose');

const BetSchema = mongoose.Schema({
    colors : Array,
    amount : Number,
    user_id : mongoose.Types.ObjectId,
    qty : Number,
},{
    timestamps : true
});

module.exports = mongoose.model('Bet', BetSchema);