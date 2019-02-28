'use strict'
/**
 * Provides methods for authorizing users
 */

// the file name
const registeredUsers = require('../user-db.json')


module.exports = {
    /**
     * Returns whether the user is authorized
     */
    authorizeUser: function(email,password) {
        var isAuthorized = password === registeredUsers[email];
        return isAuthorized;
    }
}