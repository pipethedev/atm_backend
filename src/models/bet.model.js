const mongoose = require('mongoose');

const BetSchema = mongoose.Schema({
    colors : Array,
    amount : Number,
    gain_lost : Number,
    type : Boolean,
    computer : Array,
    user_id : mongoose.Types.ObjectId,
    qty : Number,
},{
    timestamps : true
});

module.exports = mongoose.model('Bet', BetSchema);