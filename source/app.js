var path = require('path');
var express = require('express');
var nunjucks = require('nunjucks');
var datastore = require('./datastore');


var app = express();
var users = datastore('users');

app.set('PORT', process.env.PORT || 3000);
app.set('TEMPLATES_DIRECTORY', path.join(__dirname, 'templates'));
app.set('STATIC_DIRECTORY', path.join(__dirname, 'static'));
app.set('views', app.get('TEMPLATES_DIRECTORY'));

nunjucks.configure(app.set('TEMPLATES_DIRECTORY'), { express: app });

app.listen(app.get('PORT'), function() {
    console.log('poker-app running at localhost:' + app.get('PORT'));
});


app.use('/static', express.static(app.get('STATIC_DIRECTORY')));


app.get('/', function(request, response) {
    users.all().then(function(entities) {
        response.render('index.html', { users: entities });
    });
});


module.exports = app;
