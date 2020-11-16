module.exports = (app) => {

    const bet = require('../controllers/BetController.js');

    app.route('/api/bet').post(bet.makeBet);

    app.route('/api/bet/computer_play/:user_id').post(bet.computerPlay);

    app.route('/api/bet/:id').get(bet.getBet);

}