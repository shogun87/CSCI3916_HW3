/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //hack
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors()); // allowing browser to call
app.use(bodyParser.json()); // using a json parser, so we don't have to do json.parse all the time
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router(); // so we can use get requests

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body",
        message: "",            // added message parameter to send back in response
        query: ""               // added query parameter to send back queries in response
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    // if no username or password then return return failure with message
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else { // else create new user
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };

        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successfully created new user.'})
    }
});

router.post('/signin', function (req, res) {
    var user = db.findOne(req.body.username);

    if (!user) {
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
        if (req.body.password === user.password) {
            var userToken = { id: user.id, username: user.username };
            var token = jwt.sign(userToken, process.env.SECRET_KEY);
            res.json ({success: true, token: 'JWT ' + token});
        }
        else {
            res.status(401).send({success: false, msg: 'Authentication failed.'});
        }
    }
});

// Movie route
router.route('/movies')
    // GET functionality
    .get(function(req, res) {
        res = res.status(200);          // return status of 200
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);  // create json object
        o.message = "GET movies"        // change the json message
        o.query = req.query;            // change the json query info to user query, if there was one
        res.json(o);
    })
    // POST functionality
    .post(function(req, res) {
        res = res.status(200);          // return status of 200
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);  // create json object
        o.message = "movie saved"       // change the json message
        o.query = req.query;            // change the json query info to user query, if there was one
        res.json(o);
    })
    .put(authJwtController.isAuthenticated, function(req, res) {
        console.log(req.body);
        res = res.status(200);          // return status of 200
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);  // create json object
        o.message = "movie updated"     // change the json message
        o.query = req.query;            // change the json query info to user query, if there was one
        res.json(o);
    })
    .delete(authController.isAuthenticated, function(req, res) {
        console.log(req.body);
        res = res.status(200);          // return status of 200
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);  // create json object
        o.message = "movie deleted"     // change the json message
        o.query = req.query;            // change the json query info to user query, if there was one
        res.json(o);
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


