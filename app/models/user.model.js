const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name : String,
    email : {
        type : String,
        unique : true
    },
    password : String,
    account_number: String,
    phone_number: Number,
    wallet_value : Number,
    bank_code: String,
    played : Number,
    userToken : String,
    admin : Boolean,
    resetPasswordExpires : Date,
}, {
    timestamps : true
});

module.exports = mongoose.model('User', UserSchema);