define(['knockout', 'MobileServiceClient', 'plugins/router'], function (ko, mobileservice, router) {
    
    var getUserTemplate = function() {
        return {
            isAuthenticated: false,
            name: null,
            antiforgeryToken: null,
            isAdmin: false,
            userId: null,
            authId: null,
            role: 'Public'
        };
    };
    
    var user = ko.observable(getUserTemplate());

    return {
        user: user,

        getAuthInfo: function() {
            var def = Q.defer(),
                self = this;

            if (localStorage.currentUser !== null && localStorage.currentUser !== undefined) {
                mobileservice.currentUser = JSON.parse(localStorage.currentUser);
                self.user().isAuthenticated = true;
                self.user().authId = mobileservice.currentUser.userId;

                mobileservice.getTable('Speaker')
                    .where({ authId: mobileservice.currentUser.userId })
                    .read()
                    .then(function (usr) {
                        if (usr.length > 0) {
                            usr = _.first(usr);

                            self.user().name    = usr.name;
                            self.user().isAdmin = usr.admin;
                            self.user().userId = usr.id;
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
        
        isRegistered: function () {
            return !(_.isNull(this.user().name) || _.isEmpty(this.user().name));
        },
        
        login: function () {
            return mobileservice.login('google').then(function (e) {
                toastr.success('Du er logget inn');
                return localStorage.currentUser = JSON.stringify(e);
            }, function (error) {
                toastr.error('En feil oppstod');
                console.log(error);
            });
        },
        
        logout: function () {
            mobileservice.logout();
            delete localStorage.currentUser;
            this.user({ isAuthenticated: false, name: '', antiforgeryToken: null, isAdmin: false, role: 'Public', authId: null });
            router.navigate('program');
        },
        
        hasRightsForRole: function(role) {
            if (this.user().isAdmin) return true;
            return role === this.user().role;
        }
    };
});