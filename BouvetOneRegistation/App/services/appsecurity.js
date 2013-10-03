﻿define(['knockout', 'MobileServiceClient'], function(ko, mobileservice) {
    var user = ko.observable({ isAuthenticated: false, name: null, antiforgeryToken: null, isAdmin: false, role: 'Public' });

    var getRole = function(usr) {
        return usr.admin ? 'Administrator' : 'Public';
    };
    
    return {
        user: user,

        getAuthInfo: function() {
            var def = Q.defer(),
                self = this;

            if (localStorage.currentUser !== null && localStorage.currentUser !== undefined) {
                mobileservice.currentUser = JSON.parse(localStorage.currentUser);
                self.user().isAuthenticated = true;

                mobileservice.getTable('Speaker')
                    .where({ userId: mobileservice.currentUser.userId })
                    .read()
                    .then(function (usr) {
                        if (usr.length > 0) {
                            usr = _.first(usr);

                            self.user().name     = usr.name
                            self.user().isAdmin  = usr.admin
                            self.user().name     = usr.name;
                        }
                        def.resolve(self.user());
                    });
            } else {
                def.resolve(self.user());
            }

            return def.promise;
        },
        
        isAuthenticated: function() {
            return this.user().isAuthenticated;
        },
        
        isRegistered: function() {
            return this.user().name !== null;
        },
        
        login: function () {
            return mobileservice.login('google').then(function (e) {
                toastr.success('Du er logget inn');
                return localStorage.currentUser = JSON.stringify(mobileservice.currentUser);
            }, function (error) {
                toastr.error('En feil oppstod');
                console.log(error);
            });
        },
        
        logout: function () {
            mobileservice.logout();
            delete localStorage.currentUser;
            this.user({ isAuthenticated: false, name: '', antiforgeryToken: null, isAdmin: false, role: 'Public' });
        },
        
        hasRightsForRole: function(role) {
            if (this.user().isAdmin) return true;
            return role === this.user().role;
        }
    };
});