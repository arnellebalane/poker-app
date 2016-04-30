// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var express = require('express');
var config = require('../config');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;


function extractProfile(profile) {
    var imageUrl = '';
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value.replace(/sz=\d+$/g, 'sz=200');
    }
    return {
        id: profile.id,
        name: profile.displayName,
        image: imageUrl
    };
}


var strategy = new GoogleStrategy({
    clientID: config.get('OAUTH2_CLIENT_ID'),
    clientSecret: config.get('OAUTH2_CLIENT_SECRET'),
    callbackURL: config.get('OAUTH2_CALLBACK'),
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


var router = express.Router();


router.get('/auth/login', function(request, response, next) {
    if (request.query.return) {
        request.session.oauth2return = request.query.return;
    }
    next();
}, passport.authenticate('google', { scope: ['email', 'profile'] }));


router.get('/auth/google/callback',
    passport.authenticate('google'),

    function(request, response) {
        var redirect = request.session.oauth2return || '/';
        delete request.session.oauth2return;
        delete request.session.userProfileSaved;
        response.redirect(redirect);
    }
);


router.get('/auth/logout', function(request, response) {
    request.logout();
    response.redirect('/');
});


function loginRequired(redirectUrl) {
    return function(request, response, next) {
        if (!request.user) {
            request.session.oauth2return = request.originalUrl;
            return response.redirect(redirectUrl);
        }
        next();
    };
}


function logoutRequired(redirectUrl) {
    return function(request, response, next) {
        if (request.user) {
            return response.redirect(redirectUrl);
        }
        next();
    };
}


function templateVariables(request, response, next) {
    response.locals.profile = request.user;
    response.locals.loginUrl = '/auth/login?return='
        + encodeURIComponent(request.originalUrl);
    response.locals.logoutUrl = '/auth/logout?return='
        + encodeURIComponent(request.originalUrl);
    next();
}


module.exports = {
    router: router,
    loginRequired: loginRequired,
    logoutRequired: logoutRequired,
    templateVariables: templateVariables
};
