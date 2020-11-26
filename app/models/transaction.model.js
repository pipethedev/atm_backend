const mongoose = require('mongoose');

const TransactionSchema = mongoose.Schema({
    user_id : mongoose.Types.ObjectId,
    amount : Number,
    reference_id : String
}, {
    timestamps : true
});

module.exports = mongoose.model('Transaction', TransactionSchema);