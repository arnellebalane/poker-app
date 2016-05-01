var datastore = require('./datastore');


var users = datastore('users');


function getOrCreateUserProfile(request, response, next) {
    if (!request.session.userProfileSaved) {
        request.session.userProfileSaved = true;

        var query = [
            ['select', '__key__'],
            ['filter', 'id', '=', request.user.id]
        ];
        users.query(query)
            .then(function(entities) {
                if (entities.length) {
                    return entities[0];
                }
                return users.create(request.user).then(function(entity) {
                    return entity.key;
                });
            })
            .then(function(entity) {
                request.user.key = entity.key.id;
                next();
            });
    } else {
        next();
    }
}


exports.getOrCreateUserProfile = getOrCreateUserProfile;
