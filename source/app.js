var path = require('path');
var express = require('express');
var session = require('express-session');
var nunjucks = require('nunjucks');
var passport = require('passport');
var datastore = require('./lib/datastore');
var oauth2 = require('./lib/oauth2');
var config = require('./config');


var app = express();
var users = datastore('users');

app.set('PORT', process.env.PORT || 3000);
app.set('TEMPLATES_DIRECTORY', path.join(__dirname, 'templates'));
app.set('STATIC_DIRECTORY', path.join(__dirname, 'static'));
app.set('views', app.get('TEMPLATES_DIRECTORY'));

nunjucks.configure(app.set('TEMPLATES_DIRECTORY'), { express: app });

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: config.OAUTH2_CLIENT_SECRET,
    signed: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(oauth2.router);

app.listen(app.get('PORT'), function() {
    console.log('poker-app running at localhost:' + app.get('PORT'));
});


app.use('/static', express.static(app.get('STATIC_DIRECTORY')));


app.get('/', oauth2.required, oauth2.template, function(request, response) {
    users.all().then(function(entities) {
        var context = { users: entities };
        response.render('index.html', context);
    });
});


module.exports = app;
