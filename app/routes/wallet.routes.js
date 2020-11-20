const { body } = require('express-validator');

module.exports = (app) => {

    const wallet = require('../controllers/WalletController.js');

    app.route('/api/wallet/:id').get(wallet.getWallet);

    app.route('/api/wallet/:id').put(wallet.actionWallet);

    app.route('/api/wallet/withdraw/:id').put(wallet.cashoutWallet);

    app.route('/api/wallet/lock/:id').put(wallet.lockWallet);

}