'use strict'
module.exports = function(router) {
    router.get('/info', function(req,res,next) {
        res.json({
           status: 'Running',
           infoMessage: 'All good!' 
        });
    })
}