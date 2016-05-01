var gcloud = require('gcloud');
var config = require('../config');


var datastore = gcloud.datastore({
    projectId: config.get('GCLOUD_PROJECT')
});


function fromDatastore(object) {
    object.data.key = object.key;
    return object.data;
}


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

        datastore.insert(entity, function(error) {
            if (error) {
                return reject(error);
            }
            resolve(fromDatastore(entity));
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
            resolve(fromDatastore(entity));
        });
    });
}


function update(kind, id, data) {
    return new Promise(function(resolve, reject) {
        var key = datastore.key([kind, parseInt(id, 10)]);
        var entity = { key: key, data: toDatastore(data) };

        datastore.update(entity, function(error) {
            if (error) {
                return reject(error);
            }
            resolve(fromDatastore(entity));
        });
    });
}


function remove(kind, id) {
    return new Promise(function(resolve, reject) {
        var key = datastore.key([kind, parseInt(id, 10)]);

        datastore.delete(key, function(error) {
            if (error) {
                return reject(error);
            }
            resolve(key);
        });
    });
}


function query(kind, queries) {
    return new Promise(function(resolve, reject) {
        var dsQuery = datastore.createQuery(kind);
        (queries || []).forEach(function(query) {
            var method = query[0];
            var parameters = query.slice(1);
            dsQuery = dsQuery[method].apply(dsQuery, parameters);
        });

        datastore.runQuery(dsQuery, function(error, entities) {
            if (error) {
                return reject(error);
            }
            resolve(entities.map(fromDatastore));
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
            return remove(kind, id);
        },
        query: function(queries) {
            return query(kind, queries);
        },
        all: function() {
            return query(kind, []);
        }
    };
}


module.exports = datastoreFactory;
