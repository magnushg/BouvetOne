define('MobileServiceClient', [], function () {
    //singleton fake of MobileServiceClient
    var instance;

    function init() {
        var nextReturnObject;

        return {
            getTable: function(str) {
                var stub = {};
                stub.then = function(func, err) {
                    func(nextReturnObject);
                    return stub;
                };
                stub.where = function() {
                    return stub;
                };
                stub.read = function() {
                    return stub;
                };

                return stub;
            },
                
            nextReturnObject: function() {
                return nextReturnObject;
            },
                
            setNextReturnObject: function(obj) {
                nextReturnObject = obj;
            }

        };
    }
    
    if (!instance) {
        instance = init();
    }

    return instance;
});