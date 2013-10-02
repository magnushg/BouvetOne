define(['plugins/router', 'durandal/app', 'MobileServiceClient', 'services/appsecurity'], function (router, app, client, appsecurity) {
    return {
        router: router,
        
        search: function() {
            //It's really easy to show a message box.
            //You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        isAuthenticated: ko.computed(function() {
            return appsecurity.isAuthenticated();
        }),
        hideNavItem: function(nav) {
            if (nav.authorize && !appsecurity.isAuthenticated()) {
                return false;
            }
            if (!appsecurity.hasRightsForRole(nav.role)) {
                return false;
            } 
            return true;
        },

        activate: function () {
            
            router.guardRoute = function(instance, instruction) {
                if (instruction.config.authorize) {
                    if (appsecurity.isAuthenticated()) {
                        if (appsecurity.hasRightsForRole(instruction.config.role)) {
                            return true;
                        }
                    }
                    return '/#program';
                } else return true;
            }
            
            return router.map([
                { route: '',                title: 'Registrering',  moduleId: 'viewmodels/registration',    nav: true,  authorize: true,    role: 'Public'},
                { route: 'program',         title: 'Program',       moduleId: 'viewmodels/program',         nav: true,  authorize: false,   role: 'Public'},
                { route: 'admin',           title: 'Administrator', moduleId: 'viewmodels/admin',           nav: true,  authorize: true,    role: 'Administrator'}
            ]).buildNavigationModel()
                .mapUnknownRoutes('viewmodels/404', '404')
                .activate();
        },
        login: function() {
            appsecurity.login().then(function() {
                appsecurity.getAuthInfo().then(function(user) {
                    console.log(user);
                })
            });
        },
        logout: function () {
            appsecurity.logout();
            appsecurity.getAuthInfo().then(function(user) {
                console.log(user);
            });
        },
    };
});