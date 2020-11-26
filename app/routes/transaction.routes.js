module.exports = (app) => {

    const transaction = require('../controllers/TransactionController.js');

    app.route('/api/transaction/save').post(transaction.saveTransaction);

    app.route('/api/transaction/:id').get(transaction.getTransaction);

}