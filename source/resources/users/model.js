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

var gcloud = require('gcloud');
var config = require('../../config');


var datastore = gcloud.datastore({ projectId: config.GCLOUD_PROJECT });
var kind = 'User';


// Translates from Datastore's entity format to the format expected by the
// application.
//
// Datastore Format:
//   {
//       key: [kind, id],
//       data: {
//           property: value
//       }
//   }
//
// Application Format:
//   {
//       id: id,
//       property: value
//   }
function fromDatastore(object) {
    object.data.id = object.key.id;
    return object.data;
}


// Translates from the application's format to the datastore's extended entity
// property format. It also handles marking any specified properties as
// non-indexed. Does not translate the key.
//
// Application Format:
//   {
//       id: id,
//       property: value,
//       unindexedProperty: value
//   }
//
// Datastore Extended Format:
//   [
//       {
//           name: property,
//           value: value
//       },
//       {
//           name: unindexedProperty,
//           value: value,
//           excludeFromIndexes: true
//       }
//   ]
function toDatastore(object, nonIndexed) {
    nonIndexed = nonIndexed || [];
    var results = [];
    Object.keys(object).forEach(function(key) {
        if (object[key] === undefined) {
            return null;
        }
        results.push({
            name: key,
            value: object[key],
            excludeFromIndexes: nonIndexed.indexOf(key) !== -1
        });
    });
    return results;
}


// Lists all users in the Datastore sorted alphabetically by id. The ``limit``
// argument determines the maximum amount of resutls to return per page. The
// ``token`` argument allows requesting additional pages.
function list(limit, token) {
    var query = datastore.createQuery([kind])
        .limit(limit)
        .start(token);

    return new Promise(function(resolve, reject) {
        datastore.runQuery(query, function(error, entities, nextQuery) {
            if (error) {
                return reject(error);
            }
            resolve({
                entities: entities.map(fromDataStore),
                hasMore: entities.length === limit
                    ? nextQuery.startVal : false
            });
        });
    });
}


// Creates a new user or updates an existing user with new data. The provided
// data is automatically translated into Datastore format. If ``id`` argument
// is ``null``, it will create that user.
function update(id, data) {
    var key;
    if (id) {
        key = datastore.key([kind, parseInt(id, 10)]);
    } else {
        key = datastore.key(kind);
    }

    var entity = { key: key, data: toDatastore(data) };

    return new Promise(function(resolve, reject) {
        datastore.save(entity, function(error) {
            if (error) {
                return reject(error);
            }
            data.id = entity.key.id;
            resolve(data);
        });
    });
}


function read(id) {
    var key = datastore.key([kind, parseInt(id, 10)]);

    return new Promise(function(resolve, reject) {
        datastore.get(key, function(error, entity) {
            if (error) {
                return reject(error);
            }
            if (!entity) {
                return reject({ code: 404, message: 'Not found' });
            }
            resolve(fromDatastore(entity));
        });
    });
}


function remove(id) {
    var key = datastore.key([kind, parseInt(id, 10)]);

    return new Promise(function(resolve, reject) {
        datastore.delete(key, function(error) {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    });
}


module.exports = {
    create: function(data) {
        return update(null, data);
    },
    read: read,
    update: update,
    delete: remove,
    list: list
};
