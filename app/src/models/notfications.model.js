const mongoose = require('mongoose');

const NotificationSchema = mongoose.Schema({
    user_id : mongoose.Types.ObjectId,
    message : String,
    main : String,
    type : String
},{
    timestamps : true
});

module.exports = mongoose.model('Notification', NotificationSchema);