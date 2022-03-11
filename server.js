/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
// var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');

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
    // if no username or password then return failure with message
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else { // else create new user
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code === 11000)
                    return res.json({success: false, message: 'A user with that username already exists'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function (err, user) {
        if (err) {
            res.send(err);
        }
        else if(!userNew.username || !userNew.password || !user) {
            res.json({success: false, message: "User not found in database." })
        }
        else {
            user.comparePassword(userNew.password, function (isMatch) {
                if (isMatch) {
                    var userToken = {id: user.id, username: user.username};
                    var token = jwt.sign(userToken, process.env.SECRET_KEY);
                    res.json({success: true, token: 'JWT ' + token});
                } else {
                    res.status(401).send({success: false, msg: 'Authentication failed.'});
                }
            })
        }
    });
});

// Movie route with parameters
router.route('/movies/*')
    // GET functionality with /movies/:movieparameters
    .get(authJwtController.isAuthenticated, function(req, res) {
        Movie.findOne({ title: req.params[0] }, function(err, movie) {
            if(err){
                res.send(err);
            }
            else if(!movie) {
                res.status(400).json({success: false, message: "Movie not found in database." })
            }
            else{
                res.status(200).json(movie)
            }
        })
    })

    // // PUT functionality
    // .put(authJwtController.isAuthenticated, function(req, res) {
    //     console.log(req.body);
    //     res = res.status(200);          // return status of 200
    //     if (req.get('Content-Type')) {
    //         res = res.type(req.get('Content-Type'));
    //     }
    //     var o = getJSONObjectForMovieRequirement(req);  // create json object
    //     o.message = "movie updated"     // change the json message
    //     o.query = req.query;            // change the json query info to user query, if there was one
    //     res.json(o);
    // })

    // DELETE functionality
    .delete(authJwtController.isAuthenticated, function(req, res) {
        Movie.remove({ title: req.params['0'] }, (err) => {
            if(err){
                return res.status(400).json({ success: false, message: "Failed to delete movie from database."})
            }
            else {
                return res.status(200).json({ success: true, message: "Movie was deleted from database."})
            }
        })
    });

// Movie route
router.route('/movies')
    // GET functionality
    .get(authJwtController.isAuthenticated, function(req, res) {
        Movie.find({}, function(err, movies){
            if(err){
                return res.status(401).json({success: false, message: "Failed to get Movies from database."})
            }
            else{
                return res.status(200).json(movies);
            }
        })
    })
    // POST functionality
    .post(authJwtController.isAuthenticated, function(req, res) {
        // make sure the user input all required entries for a new movie
        // if (!req.body.title || !req.body.released || !req.body.genre || !req.body.actor1 || !req.body.actor2 || !req.body.actor3) {
        if (!req.body.title || !req.body.released || !req.body.genre || req.body.actors.length < 3) {
            res.status(400).json({success: false, msg: "Please include 'title', 'year released', 'genre', and at least 3 actors."})
        } else { // else create new user
            var movie = new Movie();
            movie.title = req.body.title;
            movie.released = req.body.released;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            // movie.actor1 = req.body.actor1;
            // movie.actor2 = req.body.actor2;
            // movie.actor3 = req.body.actor3;

            movie.save(function(err) {
                if(err) {
                    return res.status(500).json({success: false, message: "Problem saving movie to database."});
                }
                else {
                    return res.status(200).json({success: true, message: "Successfully added movie to database."})
                }
            })
        }
    })
    // // PUT functionality
    // .put(authJwtController.isAuthenticated, function(req, res) {
    //     console.log(req.body);
    //     res = res.status(200);          // return status of 200
    //     if (req.get('Content-Type')) {
    //         res = res.type(req.get('Content-Type'));
    //     }
    //     var o = getJSONObjectForMovieRequirement(req);  // create json object
    //     o.message = "movie updated"     // change the json message
    //     o.query = req.query;            // change the json query info to user query, if there was one
    //     res.json(o);
    // })
    // // DELETE functionality
    // .delete(authJwtController.isAuthenticated, function(req, res) {
    //     Movie.remove({ title: req.body.title }, (err) => {
    //         if(err){
    //             return res.json({ success: false, message: "Failed to delete movie from database."})
    //         }
    //         else {
    //             return res.json({ success: true, message: "Movie was deleted from database."})
    //         }
    //     })
    // });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


