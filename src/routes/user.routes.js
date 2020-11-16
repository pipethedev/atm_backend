const { body } = require('express-validator');
module.exports = (app) => {
    const users = require('../controllers/UserController.js');

    //Create User

    app.route('/api/user/register', [
        body('name').isString(),
        body('email').isEmail(),
        body('password').isLength({ min: 7 }),
        body('verified').isBoolean(),
        body('phone_number').isNumeric(),
    ]).post(users.createUser);


    //Login User
    app.route('/api/user/login', [
        body('email').isEmail().not().isEmpty(),
        body('password').not().isEmpty(),
    ]).post(users.loginUser);

    //Get User
    app.route('/api/user/data').get(users.fetchUser);

    //Get User
    app.route('/api/user/logout').delete(users.logoutUser);

    //Get all users
    app.route('/api/user/all').get(users.fetchAllUser);

    //Block users from winning
    app.route('/api/user/block_winnings').patch(users.blockUsers);

    app.route('/api/user/test').get(users.test);

    //get colors
    app.route('/api/user/colors').get(users.fetchUserColors);

    //forgot password
    app.route('/api/user/forgot',[
        body('email').isEmail(),
    ]).post(users.forgotPassword);

    //reset password
    app.route('/api/user/reset').put(users.resetPassword);


    //Update user
    app.route('/api/users/:userId',[
        body('name').isString(),
        body('email').isEmail(),
        body('password').isLength({ min: 7 }),
        body('account_number').not().isEmpty(),
        body('phone_number').isNumeric(),
    ]).put(users.updateUser);
    //

    //Delete user
    app.delete('/api/users/:userId', users.deleteUser);
}