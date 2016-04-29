var fs = require('fs');
var path = require('path');


var configPath = path.join(__dirname, '..', 'config.json');
var config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

Object.keys(config).forEach(function(variable) {
    exports[variable] = config[variable];
});
