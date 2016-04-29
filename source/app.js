var path = require('path');
var express = require('express');
var nunjucks = require('nunjucks');


var app = express();

app.set('PORT', process.env.PORT || 3000);
app.set('TEMPLATES_DIRECTORY', path.join(__dirname, 'templates'));
app.set('STATIC_DIRECTORY', path.join(__dirname, 'static'));
app.set('views', app.get('TEMPLATES_DIRECTORY'));

nunjucks.configure(app.set('TEMPLATES_DIRECTORY'), { express: app });

app.listen(app.get('PORT'), function() {
    console.log('poker-app running at localhost:' + app.get('PORT'));
});


app.use('/static', express.static(app.get('STATIC_DIRECTORY')));
app.use('/', require('./resources/users/router'));


module.exports = app;
