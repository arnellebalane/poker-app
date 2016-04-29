var express = require('express');
var config = require('../config');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;


function extractProfile(profile) {
    var imageUrl = '';
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value;
    }
    return {
        id:  profile.id,
        name: profile.displayName,
        image: imageUrl
    };
}


var strategy = new GoogleStrategy({
    clientID: config.OAUTH2_CLIENT_ID,
    clientSecret: config.OAUTH2_CLIENT_SECRET,
    callbackURL: config.OAUTH2_CALLBACK,
    accessType: 'offline'
}, function(accessToken, refreshToken, profile, callback) {
    callback(null, extractProfile(profile));
});

passport.use(strategy);

passport.serializeUser(function(user, callback) {
    callback(null, user);
});

passport.deserializeUser(function(object, callback) {
    callback(null, object);
});


function authRequired(request, response, next) {
    if (!request.user) {
        request.session.oauth2return = request.originalUrl;
        return response.redirect('/auth/login');
    }
    next();
}


function addTemplateVariables(request, response, next) {
    response.locals.profile = request.user;
    response.locals.login = '/auth/login?return='
        + encodeURIComponent(request.originalUrl);
    response.locals.logout = '/auth/logout?return='
        + encodeURIComponent(request.originalUrl);
    next();
}


var router = express.Router();


router.get('/auth/login', function(request, response, next) {
    if (request.query.return) {
        request.session.oauth2return = request.query.return;
    }
    next();
}, passport.authenticate('google', { scope: ['email', 'profile'] }));


router.get('/auth/google/callback', passport.authenticate('google'),
function(request, response) {
    var redirect = request.session.oauth2return || '/';
    delete request.session.oauth2return;
    response.redirect(redirect);
});


router.get('/auth/logout', function(request, response) {
    request.logout();
    response.redirect('/');
});


module.exports = {
    extractProfile: extractProfile,
    router: router,
    required: authRequired,
    template: addTemplateVariables
}
