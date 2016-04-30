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

var path = require('path');
var nconf = require('nconf');


nconf
    .argv()
    .env([
        'DATA_BACKEND',
        'GCLOUD_PROJECT',
        'NODE_ENV',
        'OAUTH2_CLIENT_ID',
        'OAUTH2_CLIENT_SECRET',
        'OAUTH2_CALLBACK',
        'PORT'
    ])
    .file({ file: path.join(__dirname, 'config.json') })
    .defaults({
        DATA_BACKEND: 'datastore',
        MEMCACHE_URL: '127.0.0.1:11211',
        PORT: 3000
    });


checkConfig('GCLOUD_PROJECT');
checkConfig('OAUTH2_CLIENT_ID');
checkConfig('OAUTH2_CLIENT_SECRET');
checkConfig('OAUTH2_CALLBACK');


function checkConfig(setting) {
    if (!nconf.get(setting)) {
        throw new Error('You must set the ' + setting + ' environment '
            + 'variable or add it to config.json!');
    }
}


module.exports = nconf;
