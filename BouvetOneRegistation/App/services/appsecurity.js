define(['knockout', 'MobileServiceClient'], function(ko, mobileservice) {
    var user = ko.observable({ isAuthenticated: false, name: '', antiforgeryToken: null, isAdmin: false });
    
    return {
        user: user,

        getAuthInfo: function() {
            var def = Q.defer(),
                self = this;

            if (localStorage.currentUser !== null && localStorage.currentUser !== undefined) {
                mobileservice.currentUser = JSON.parse(localStorage.currentUser);

                mobileservice.getTable('Speaker')
                    .where({ userId: mobileservice.currentUser.userId })
                    .read()
                    .then(function (usr) {
                        if (usr.length > 0) {
                            usr = _.first(usr);

                            self.user({
                                isAuthenticated: true,
                                name: usr.name,
                                isAdmin: usr.admin
                            });
                            def.resolve(self.user());
                        }
                    });
            } else {
                def.resolve(self.user());
            }

            return def.promise;
        },
        
        isAuthenticated: function() {
            return this.user().isAuthenticated;
        },
        
        getRole: function () {
            if (this.user().isAdmin) return 'Administrator';
            else return 'Public';
        }
    };
});