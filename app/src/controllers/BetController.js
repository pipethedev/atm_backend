const Bet = require('../models/bet.model.js');
const User = require('../models/user.model.js');
const Wallet = require('../models/wallet.model.js');
const Prediction = require('../models/prediction.model.js');

// let first = Math.floor(Math.random() * 3);
// let second = Math.floor(Math.random() * 3);
let random = Math.floor(Math.random() * 10);

exports.makeBet = (req, res) => {

    //allocated points
    let winAll = 1.2;
    let winColor = 0.32;
    let winSingle = 0.12;


    //user selection

    let colorSelection = req.body.colors;
    let numberSelection = req.body.value;
    let amountPlayed = req.body.amount;
    let savedAmount = req.body.amount;
    let main;
    let response;
    let type;



    //available colors
    let colors = shuffle(["red","blue","green"]);

    //random bet number
    let random_number = Math.floor(Math.random() * 10);

        main = colors.splice(Math.floor(Math.random()*colors.length), 2)
    // var arr1 = [1,2,3,4,5,6];
    // var arr2 = [4];
    //let check = main.some(r=> colorSelection.indexOf(r) >= 0)
    let check = colorSelection.every((el) => {
        return main.indexOf(el) !== -1;
    });
   // console.log(shuffle(colors), colorSelection, random_number);
    switch (amountPlayed !== '' || amountPlayed !== 0) {
        case check:
            amountPlayed = parseInt((amountPlayed * winSingle));
            response = `Won ${winSingle}`
            type = true
            break;
        case checkEquality(shuffle(main), colorSelection):
            amountPlayed = parseInt((amountPlayed * winColor));
            response = `Won ${winColor}`
            type = true
            break;
        case ( checkEquality(shuffle(main), colorSelection) && (numberSelection === random_number) ):
            amountPlayed = parseInt((amountPlayed * winAll));
            response = `Won ${winAll}`
            type = true
            break;
        default:
            amountPlayed = 0
            response = `Won 0.00`
            type = false
            break;
    }

    // return res.send(type);
    taskOnWallet(req.body.user_id, amountPlayed, savedAmount, type, res)
    .then(r => {
        let data;
        let register = registerPrediction(type, shuffle(main), random_number,req.body.user_id, res);
        if (type === true) {
             data = savedAmount - (0.4 * savedAmount);
        } else {
             data = savedAmount - (0.3 * savedAmount) + 20 ;
        }
        let bet = registerBet(shuffle(main), type, data, colorSelection, amountPlayed, numberSelection, res, req.body.user_id);
        if(register && bet){
            return res.send({
                status : 201,
                type,
                message : 'Bet played successfully',
                main,
                random
            });
        }
    });

}

exports.getBet = (req, res) => {
    Prediction.find({"user_id" : req.params.id}, (err, result) => {
        return res.send(result);
    });
}

exports.getBetUser = (req, res) => {
    Bet.find({"user_id" : req.params.id}, (err, result) => {
        return res.send(result);
    });
}

exports.computerPlay = (req, res) => {

    let type = 'made';
    let random = Math.floor(Math.random() * 10);

    let colors = shuffle(["red","blue","green"]);

    for(let i = colors.length-1; i>=0;i--){
        colors.splice(Math.floor(Math.random()*colors.length), 2);
        let game = registerPrediction(type, shuffle(colors), random ,req.params.user_id, res);
        if(game){
            return res.send({
                status : 201,
                message : 'Bot played the game',
                colors,
                random
            });
        }else{
            return res.status(500).send({
                status : 500,
                message : 'An internal error just occurred'
            });
        }
    }
}

async function taskOnWallet(id , cash, cash2, type, res){
    let newvalues
    let data;
    Wallet.findOne({"user_id" : id }, async (err, result) => {
        if((result.value > cash2) || (result.value === cash2)) {
            if (type === true) {
                data = cash2 - (0.4 * cash2);
                console.log(data)
                newvalues = {$set: {value: parseInt(result.value + data)}};
            } else {
                data = cash2 - (0.3 * cash2);
                console.log(data)
                newvalues = {$set: {value: parseInt(result.value - parseInt(data + 20))}};
                await fundAdmin('5fb043e99ac4ca626004e00f', data, res);
            }
            await Wallet.updateOne({
                "user_id": id
            }, newvalues, (err) => {
                if (err) throw err;
            });
        }else {
            return true;
        }
    });
}

async function fundAdmin(id, amount, res){
    User.findOne({"_id" : id }, async (err, result) => {
        if (err) throw err;
        await User.findByIdAndUpdate(id, {
            wallet_value : result.wallet_value + amount
        },{new : true}).then(user => {
            if(!user) {
                return res.status(404).send({
                    message: "User not found with id " + id
                });
            }else{
               return res.send(user);
            }

        }).catch(err => {
            return res.status(500).send({
                message: err.message ||  "Error updating user with id " + id
            });
        });
    });

}

function registerPrediction(win, shuffle1, random_number, user_id) {
    const prediction = new Prediction({
        win : win,
        color : shuffle1,
        qty : random_number,
        user_id : user_id
    });
    return !!prediction.save();
}

function registerBet(computer, type, data, colorSelection, amountPlayed, numberSelection, res, id) {
    const bet = new Bet({
        computer : computer,
        type : type,
        gain_lost : data,
        colors : colorSelection,
        amount : amountPlayed,
        qty : numberSelection,
        user_id : id
    });

    if(bet.save()){
        return true;
    }
}

function checkEquality(array1, array2){
    if(array1.length !== array2.length){
        return false;
    }
    return array1.sort().toString() === array2.sort().toString();
}

function arrayContains(arr, searchFor) {
    if (typeof arr.includes == "undefined") {
        var arrLength = arr.length;
        for (var i = 0; i < arrLength; i++) {
            if (arr[i] === searchFor) {
                return true;
            }
        }
        return false;
    }
    return arr.includes(searchFor);
}

function shuffle(array) {
    let ctr = array.length;
    let temp;
    let index;

    // While there are elements in the array
    while (ctr > 0) {
        index = Math.floor(Math.random() * ctr);
        ctr--;
        temp = array[ctr];
        array[ctr] = array[index];
        array[index] = temp;
    }
    return array;
}