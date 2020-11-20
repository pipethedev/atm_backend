const mongoose = require('mongoose');

const WalletSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    value : Number,
    debitable : Number,
    locked : Boolean,
},{
    timestamps : true
});

module.exports = mongoose.model('Wallet', WalletSchema);