var path = require('path');
var express = require('express');
var session = require('express-session');
var memcached = require('connect-memcached');
var nunjucks = require('nunjucks');
var passport = require('passport');
var requests = require('request');
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
        hosts: [config.get('MEMCACHE_URL')]
    });
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(oauth2.router);

var TEMPLATES_DIRECTORY = path.join(__dirname, 'templates');
var STATIC_DIRECTORY = path.join(__dirname, 'static');
var SERVICE_WORKER_PATH = path.join(__dirname, 'static',
    'javascripts', 'service-worker.js');
var MANIFEST_FILE_PATH = path.join(__dirname, 'manifest.json');

app.set('views', TEMPLATES_DIRECTORY);
nunjucks.configure(TEMPLATES_DIRECTORY, { express: app });

app.listen(config.get('PORT'), function() {
    console.log('poker-app running at localhost:' + config.get('PORT'));
});


app.use('/static', express.static(STATIC_DIRECTORY));
app.use('/service-worker.js', express.static(SERVICE_WORKER_PATH));
app.use('/manifest.json', express.static(MANIFEST_FILE_PATH));


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


app.get('/subscribe',
    oauth2.loginRequired('/'),

    function(request, response) {
        var subscriptionId = request.query.id;
        users.retrieve(request.user.key)
            .then(function(user) {
                if (!user.subscriptions
                || user.subscriptions.indexOf(subscriptionId) === -1) {
                    user.subscriptions = user.subscriptions || [];
                    user.subscriptions.push(subscriptionId);

                    delete user.key;
                    return users.update(request.user.key, user);
                }
                return user;
            })
            .then(function(user) {
                response.status(200).end();
            });
    }
);


app.get('/unsubscribe',
    oauth2.loginRequired('/'),

    function(request, response) {
        var subscriptionId = request.query.id;
        users.retrieve(request.user.key)
            .then(function(user) {
                if (user.subscriptions && user.subscriptions.length) {
                    var index = user.subscriptions.indexOf(subscriptionId);
                    user.subscriptions.splice(index, 1);

                    delete user.key;
                    return users.update(request.user.key, user);
                }
                return user;
            })
            .then(function(user) {
                response.status(200).end();
            });
    }
);


app.get('/poke',
    oauth2.loginRequired('/'),

    function(request, response) {
        var query = [['filter', 'id', '=', request.query.id]];
        users.query(query).then(function(user) {
            if (user[0].subscriptions && user[0].subscriptions[0].length) {
                var options = {
                    url: 'https://android.googleapis.com/gcm/send',
                    headers: {
                        Authorization: 'key=' + config.get('GCM_API_KEY')
                    },
                    body: {
                        registration_ids: user[0].subscriptions,
                        notification: {
                            title: 'Poker App Notification',
                            body: request.user.name + ' poked you.',
                            icon: request.user.image
                        }
                    },
                    json: true
                };
                requests.post(options);
            }
            response.status(200).end();
        });
    });


module.exports = app;
