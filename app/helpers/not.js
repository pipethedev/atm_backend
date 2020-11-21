"use strict";
const Notification = require('../models/notfications.model');

const {req, res} = require("express");

module.exports.sendNot = function sendNotification (message, type, id, main){
    let alert = Notification({
        message : message,
        main : main,
        type : type,
        user_id : id
    });
    return !!alert.save();
}