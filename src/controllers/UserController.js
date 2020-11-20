require('dotenv').config();
const fetch = require('node-fetch');
const functions = require('../helpers/not.js');
const { check, validationResult} = require("express-validator/check");
const User = require('../models/user.model.js');
const Bet = require('../models/bet.model.js');
const Wallet = require('../models/wallet.model.js');
const Notification = require('../models/notfications.model');
const Limit = require('../models/limit.model.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');



const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, //ssl
    auth: {
        user:process.env.EMAIL_ADDRESS,
        pass:process.env.EMAIL_SECRET
    },
    tls: {
        rejectUnauthorized: false
    }
});

const handlebarOptions = {
    viewPath: './src/templates/',
    extName: '.hbs'
};

transporter.use('compile', hbs(handlebarOptions));

exports.getNotification = async (req, res) => {
    Notification.find({user_id : req.params.id}, (err, result) => {
        if(err) throw err;
        return res.send(result);
    });
}

exports.createUser = async (req, res) => {
    const data = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    if (await User.findOne({ email: req.body.email })) {
        return res.status(404).send({
            status : 404,
            message : `${data.email} already exists in the database`
        })
    }
    let info = {
        "recipientaccount": data.account_number,
        "destbankcode": data.bank_code,
        "PBFPubKey": process.env.RAVE_PUBKEY
    }
    await bcrypt.hash(data.password, 10, async (err, hash) => {
        await fetch('https://api.ravepay.co/flwv3-pug/getpaidx/api/resolve_account', {
            method: 'POST',
            body: JSON.stringify(info),
            headers: {
                'Content-Type': 'application/json'
            },
            }).then(response => response.json())
                .then(json => {
                    if(json.status === 'success'){
                        let body = {
                            name: data.name,
                            email: data.email,
                            password: hash,
                            account_number: data.account_number,
                            phone_number: data.phone_number,
                            wallet_value: 0,
                            bank_code: data.bank_code,
                            admin : false,
                            played: 0,
                            userToken: '',
                            resetPasswordExpires: '',
                        };
                        registerUserToDatabase(body, res);
                    }else{
                        return res.status(400).send(json)
                    }
                })
            .catch(err => console.log(err));
    });
}

exports.loginUser = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({
            email
        });
        if (!user)
            return res.status(401).json({
                message: 'Password or email address may be incorrect'
            });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({
                message: "Unauthorized !"
            });

        const payload = {
            user: user
        };

        jwt.sign(
            payload,
            "secret Key",
            {
                expiresIn: '20 days'
            },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    token
                });
            }
        );
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
}

exports.logoutUser = async (req, res) => {
    return res.send({
        message : 'User logged out'
    })
}

exports.fetchUser = async (req, res, next) => {
    //const token = req.header("token");
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'secret Key', (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.status(403).send({
                message: err.message || "ERROR: Could not connect to the protected route"
            })
        }
            //If token is successfully verified, we can send the authorized data
            res.status(200).json({
                message: 'Successful logged in',
                authorizedData
            });
        next();
    });
}

exports.forgotPassword = async (req, res) => {
    const userData = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await User.findOne({
        email: userData.email
    }).exec((err, user) => {
        if (user) {
            crypto.randomBytes(20, (err, buffer) => {
                const token = buffer.toString('hex');
                User.updateOne({_id: user._id}, {
                    userToken: token,
                    resetPasswordExpires: Date.now() + 86400000
                }, {upsert: true, new: true}).exec( (err, new_user) => {
                    if (err) throw  err;
                    let HelperOptions = {
                        from: `Allthingsmore ${process.env.EMAIL_ADDRESS}`,
                        to: userData.email,
                        subject: 'Allthingsmore | Password Reset',
                        context: {
                            name: new_user.name,
                            email: userData.email,
                            url: 'http://localhost:8080/reset?token=' + token
                        }
                    };
                    transporter.sendMail(HelperOptions, (error,info) => {
                        if(error) {
                           return res.json(error);
                        }else{
                            res.send({
                                userToken: token,
                                resetPasswordExpires: Date.now() + 3600000,
                                message : `An e-mail has been sent to ${userData.email} for further instructions`
                            });
                        }
                    });
                });
            });
        } else {
            return res.status(404).send({
                err : `${userData.email} not found`
            });
        }
    });
}

exports.resetPassword = async (req, res) => {
    User.findOne({
        userToken: req.body.token,
        resetPasswordExpires: { $gt: Date.now() }
    }, async (err, user) => {
        if(!user){
            return res.send({message: 'Password reset token is invalid or has expired.'});
        }
        await bcrypt.hash(req.body.password, 10, async (err, hash) => {
            user.password = hash;
            user.userToken = '';
            user.resetPasswordExpires = '';
            user.save(async (err) => {
                if(err) return res.send(err);
                else{
                    let send = functions.sendNot('Password Change Successful', 'password_change', user._id, res);
                    if(send){
                        return res.status(204).send({
                            message : 'Password Changed Successfully'
                        })
                    }
                }
            })
        });

    })
}

exports.updateUser = async (req, res) => {
    const data= req.body;
    User.findOne({"_id" : req.params.userId}, function(err, result) {
        if (err) throw err;
        const body = {
            _id : result._id,
            name: data.name,
            email: data.email,
            account_number: data.account_number,
            phone_number: data.phone_number,
            bank_code: data.bank_code,
            updatedAt : result.updatedAt,
            createdAt : result.createdAt,
            played : result.played,
            _v : result._v,
            admin : result.admin,
            resetPasswordExpires : result.resetPasswordExpires,
            userToken : result.userToken,
            wallet_value:  result.wallet_value
        };
        const payload = {
            user: body
        };
        User.findByIdAndUpdate(req.params.userId, body)
            .then(data => {
                if(!data) {
                    return res.status(404).send({
                        message: "User not found with id " + req.params.userId
                    });
                }
                jwt.sign(payload, "secret Key", { expiresIn: '21 days'}, (err, token)=>{
                    if (err) throw err;
                    functions.sendNot('Profile Updated', 'update_change', data._id, res);
                    res.status(200).json({
                        status : 200,
                        token
                    });
                })
            }).catch(err => {
            if(err.kind === 'ObjectId') {
                return res.status(404).send({
                    message: "User not found with id " + req.params.userId
                });
            }
            return res.status(500).send({
                message: "Error updating user with id " + req.params.userId
            });
        });
    });
}

exports.fetchAllUser = async  (req, res) => {
    User.find()
        .then(data => {
            res.send(data);
        }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving notes."
        });
    });
}

exports.deleteUser = (req, res) => {
    User.findByIdAndRemove(req.params.userId)
        .then(user => {
            if(!user) {
                return res.status(404).send({
                    message: "User not found with id " + req.params.userId
                });
            }
            res.send({message: "User deleted successfully!"});
        }).catch(err => {
        if(err.kind === 'ObjectId' || err.name === 'NotFound') {
            return res.status(404).send({
                message: "User not found with id " + req.params.userId
            });
        }
        return res.status(500).send({
            message: "Could not delete user with id " + req.params.userId
        });
    });
}

exports.test = async (req, res) => {
    const identifiers = await Wallet.find().populate("user_id");
    return res.send(identifiers);
}

exports.fetchUserColors = async  (req, res) => {
    await Bet.find({}, {
        "colors": 1
    }, async (err , result) => {
        if (err) throw  err;
        let combinedArray = [];
        let arrayLength = result.length;
        for (let i = 0; i < arrayLength; i++) {
            combinedArray.push(...result[i].colors);
            //Do something
        }
        const arr1=combinedArray;
        let mf = 1;
        let m = 0;
        let item;
        for (let i=0; i<arr1.length; i++)
        {
            for (let j=i; j<arr1.length; j++)
            {
                if (arr1[i] === arr1[j])
                    m++;
                if (mf<m)
                {
                    mf=m;
                    item = arr1[i];
                }
            }
            m=0;
        }
        return res.send({
            item,
            mode : mf
        });
    });
}

exports.blockUsers = async (req, res) => {
    await Limit.find( async (err, result) => {
        if(result.length > 0 ){
            await Limit.updateOne({
                "user_id": req.body.id
            }, {$set: {
                start: req.body.start,
                end : req.body.end,
                day : req.body.day
            }}, (err) => {
                if (err) throw err;
                return res.send({
                    status : 201,
                    message : `User cannot longer earn from ${req.body.start} to ${req.body.end} on ${req.body.date}`
                });
            });
        }else{
            const limit = new Limit({
                user_id : req.body.id,
                start : req.body.start,
                end : req.body.end,
                day : req.body.day
            });
            if(limit.save()){
                return res.send(limit);
            }else{
                return res.status(500).send({
                    status : 500,
                    error : "An internal error just occurred"
                });
            }
        }
    })

}


async function registerUserToDatabase(body, res) {
    const user = new User(body);
    user.save((err, result) => {
        if (err) return res.send(err);
        else {
            const wallet = new Wallet({
                user_id : result._id,
                value : 0,
                locked : false
            });
            let notification = functions.sendNot('Welcome to A.T.M', 'welcome', result._id, res);
            if(notification){
                wallet.save().then(data => {
                    return res.status(201).send({
                        message : "Wallet and account created"
                    });
                }).catch(err => {
                    return res.status(500).send({
                        message : "Wallet and account could not be created"
                    });
                });
            }
        }
    });
}

async function verifyRefreshToken(refreshToken, req, res, next) {
    if (!req.headers['authorization']) {
        return res.status(401).send({
            message : 'Unauthorized'
        })
    }
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader.split(' ')
    const token = bearerToken[1]
    jwt.verify(token, 'secret Key', (err, payload) => {
        if (err) {
            const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
            return res.status(401).send({
                message : message
            })
        }
        req.payload = payload
        next()
    })
}



