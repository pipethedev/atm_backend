const Transaction = require('../models/transaction.model.js');


exports.saveTransaction = (req, res) => {
    const transaction = new Transaction();
    transaction.user_id = req.body.user_id;
    transaction.amount = req.body.amount;
    transaction.reference_id = req.body.reference_id;
    if (transaction.save()){
        return res.status(200).send({
            message : "Transaction saved"
        });
    }
}

exports.getTransaction = (req, res) => {
    Transaction.find({"user_id" : req.params.id}, (err, result) => {
        return res.send(result);
    }).sort({"_id":-1});
}