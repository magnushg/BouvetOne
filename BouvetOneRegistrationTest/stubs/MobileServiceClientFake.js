define('MobileServiceClient', [], function () {
    //singleton fake of MobileServiceClient
    var instance;

    function init() {
        var nextReturnObject;
        var currentUser;
        
        var promiseStub = {};
        promiseStub.then = function (func, err) {
            func(nextReturnObject);
            return promiseStub;
        };
        promiseStub.where = function () {
            return promiseStub;
        };
        promiseStub.read = function () {
            return promiseStub;
        };

        return {
            getTable: function(str) {
                return promiseStub;
            },

            login: function(str) {
                return promiseStub;
            },

            logout: function () {
                return;
            },
                
            setNextReturnObject: function(obj) {
                nextReturnObject = obj;
            },
            
            setCurrentUser: function(obj) {
                currentUser = obj;
            }
        };
    }
    
    if (!instance) {
        instance = init();
    }

    return instance;
});