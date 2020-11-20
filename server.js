const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const robots = require('express-robots-txt');
const favicon = require('serve-favicon');
const path = require('path');
require('dotenv').config();

// create express app
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true , limit : '50mb'}))

// parse application/json
app.use(bodyParser.json())

//enable cors
app.use(cors())

app.use(robots({ UserAgent: '*', Disallow: '/' }))

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// Configuring the database
const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');


mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(dbConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

//enable cors

app.use(cors({
    origin : ['http://localhost:8080', 'http://192.168.43.192:8080'],
    optionsSuccessStatus: 200,
    methods: "GET,PUT,POST,DELETE",
    preflightContinue: false,
}));



// define a simple route
app.get('/', (req, res) => {
    return res.json({"message": "Welcome to Backend."});
});

app.get('/favicon.ico', (req, res) => res.status(204));




require('./app/src/routes/user.routes.js')(app);

require('./app/src/routes/wallet.routes.js')(app);

require('./app/src/routes/bet.routes.js')(app);



// listen for requests

app.listen(process.env.PORT || 3000);