const fetch = require('node-fetch');
const functions = require('../helpers/not.js');
const Wallet = require('../models/wallet.model.js');

exports.getWallet = async (req, res) => {
    Wallet.findOne({"user_id" : req.params.id}, (err, result) => {
        return res.send(result);
    });
}

exports.actionWallet = async (req, res) => {
    if(req.body.status !== 'Approved'){
        return res.status(204).send({
            message : "Wallet couldn't be funded"
        });
    }
    let id = req.params.id;
    // if(req.body.amount < 500 && req.body.type === 'credit'){
    //     return res.status(400).send({
    //         message : "You can't fund your wallet with anything lesser than 500"
    //     })
    // }
    await performTaskOnWallet(req.body.type, req.body.amount, id, res);
}

exports.cashoutWallet = async (req, res) => {
    await fetch('https://api.flutterwave.com/v3/transfers', {
        method: "POST",
        body: JSON.stringify({
            "account_bank": req.body.bank_code,
            "account_number": req.body.account_number,
            "amount": req.body.amount,
            "narration": "Money Withdrawal from A.T.M Bet",
            "currency": "NGN",
            "reference": 'allthings_more_betting'+Math.floor((Math.random() * 1000000000) + 1),
            "debit_currency": "NGN"
        }),
        headers: {
            'Authorization': `Bearer ${process.env.RAVE_KEY}`,
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
        .then(json => {
            if(json.status === 'success'){
                if(performTaskOnWallet("debit", req.body.amount, req.params.id, res)){
                    functions.sendNot('Money withdraw', 'cashout', req.params.id, `A sum of ${req.body.amount} has been sent to your account`);
                    return res.send({
                        status : 200,
                        json
                    });
                }else{
                    return res.status(200).send({
                        message : "Insufficient funds"
                    })
                }
            }else{
                return res.status(200).send({
                    message : "Invalid Details"
                })
            }
        })
        .catch(err => {
            return res.send(err);
        });
}

exports.lockWallet = async (req, res) => {
    await Wallet.updateOne({
        "user_id" : req.body.user_id
    }, {
        locked : true
    }, (err) => {
        if (err) throw err;
        return res.status(200).send({
            message : "Wallet locked"
        });
    });
}

exports.updateDebit = async (req, res)  => {
    await updateDebitable(req, res, req.params.id, req.body.debitable);
}


async function updateDebitable(req, res, id, amount){
    await Wallet.updateOne({
        "user_id" : id
    }, {$set: {debitable: amount }}, (err) => {
        if (err) throw err;
        return res.status(200).send({
            message : amount
        });
    });
}

async function performTaskOnWallet(type, amount, id, res) {
    let newvalues;
    let good = {
        "message": "Wallet updated successfully"
    }
    let bad = {
        "message" : "Please fund your wallet !!"
    }
    await Wallet.findOne({"user_id": id}, async (err, result) => {
        if(err){
            return res.status(404).send({
               message : `${id} not found`
            });
        }
        if(type === 'credit'){
            newvalues = {$set: {value: parseInt(result.value + amount)}};
        }else{
            newvalues = {$set: {value: parseInt(result.value - amount)}};
        }
        if(type === 'debit' && amount < 0){
            return false;
        }else{
            let send = await Wallet.updateOne({
                "user_id": id
            }, newvalues);
            return !!send;
        }
    });
}
