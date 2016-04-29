var gcloud = require('gcloud');
var config = require('./config');


// Translates from datastore's entity format to the format expected by the
// application.
function fromDatastore(object) {
    object.data.id = object.key.id;
    return object.data;
}


// Translates from the application's format to the datastore's extended entity
// property format. It also handles marking any specified properties as
// non-index. Does not translate the key.
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


function create(kind, data) {
    return new Promise(function(resolve, reject) {
        var key = datastore.key(kind);
        var entity = { key: key, data: toDatastore(data) };

        datastore.insert({ key: key, data: entity }, function(error) {
            if (error) {
                return reject(error);
            }
            resolve(entity);
        });
    });
}


function retrieve(kind, id) {
    return new Promise(function(resolve, reject) {
        var key = datastore.key([kind, parseInt(id, 10)]);

        datastore.get(key, function(error, entity) {
            if (error) {
                return reject(error);
            }
            resolve(entity);
        });
    });
}


function update(kind, id, data) {
    return new Promise(function(resolve, reject) {
        var key = datastore.key([kind, parseInt(id, 10)]);
        var entity = { key: key, data: toDatastore(data) };

        datastore.update({ key: key, data: entity }, function(error) {
            if (error) {
                return reject(error);
            }
            resolve(entity);
        });
    });
}


function delete(kind, id) {
    return new Promise(functoin(resolve, reject) {
        var key = datastore.key([kind, parseInt(id, 10)]);

        datastore.delete(key, function(error) {
            if (error) {
                return reject(error);
            }
            resolve(key);
        });
    });
}


function datastoreFactory(kind) {
    return {
        create: function(data) {
            return create(kind, data);
        },
        retrieve: function(id) {
            return retrieve(kind, id);
        },
        update: function(id, data) {
            return update(kind, id, data);
        },
        delete: function(id) {
            return delete(kind, id);
        }
    };
}


module.exports = datastoreFactory;