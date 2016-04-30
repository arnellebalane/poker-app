var path = require('path');
var express = require('express');
var session = require('express-session');
var memcached = require('connect-memcached');
var nunjucks = require('nunjucks');
var passport = require('passport');
var datastore = require('./lib/datastore');
var oauth2 = require('./lib/oauth2');
var middlewares = require('./lib/middlewares');
var config = require('./config');


var app = express();
var users = datastore('users');

var sessionConfig = {
    resave: false,
    saveUninitialized: false,
    secret: config.get('OAUTH2_CLIENT_SECRET'),
    signed: true
};

if (config.get('NODE_ENV') === 'production') {
    var MemcachedStore = memcached(session);
    sessionConfig.store = new MemcachedStore({
        hosts: [config.get('NODE_ENV')]
    });
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(oauth2.router);

var TEMPLATES_DIRECTORY = path.join(__dirname, 'templates');
var STATIC_DIRECTORY = path.join(__dirname, 'static');

app.set('views', TEMPLATES_DIRECTORY);
nunjucks.configure(TEMPLATES_DIRECTORY, { express: app });

app.listen(config.get('PORT'), function() {
    console.log('poker-app running at localhost:' + config.get('PORT'));
});


app.use('/static', express.static(STATIC_DIRECTORY));


app.get('/',
    oauth2.loginRequired('/login'),
    oauth2.templateVariables,
    middlewares.getOrCreateUserProfile,

    function(request, response) {
        users.all().then(function(entities) {
            var users = entities.filter(function(entity) {
                return entity.id !== request.user.id;
            });
            var context = { users: users };
            response.render('index.html', context);
        });
    }
);


app.get('/login',
    oauth2.logoutRequired('/'),
    oauth2.templateVariables,

    function(request, response) {
        response.render('login.html');
    }
);


module.exports = app;
