define(['plugins/router', 'durandal/app', 'MobileServiceClient', 'services/appsecurity'], function(router, app, client, appsecurity) {
    var self = {};

    self.routes = ko.observableArray([]);
    self.isAuthenticated = ko.observable(false);

    self.activate = function() {
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

        self.isAuthenticated.subscribe(function(newVal) {
            self.refreshRouteAccess();
        });

        self.isAuthenticated(appsecurity.isAuthenticated());

        return router.map([
            { route: '', title: 'Registrering', moduleId: 'viewmodels/registration', nav: true, authorize: true, role: 'Public', visible: ko.observable(false) },
            { route: 'program', title: 'Program', moduleId: 'viewmodels/program', nav: true, authorize: false, role: 'Public', visible: ko.observable(true) },
            { route: 'admin', title: 'Administrator', moduleId: 'viewmodels/admin', nav: true, authorize: true, role: 'Administrator', visible: ko.observable(false) }
        ]).buildNavigationModel()
            .mapUnknownRoutes('viewmodels/404', '404')
            .activate().then(function() {
                self.refreshRouteAccess();
            });
    };

    self.login = function() {
        appsecurity.login().then(function() {
            appsecurity.getAuthInfo().then(function() {
                self.isAuthenticated(true);

                //navigate to registration if user is not already registered
                if (appsecurity.isAuthenticated() && !appsecurity.isRegistered()) {
                    router.navigate('/')
                }
            });
        });
    };

    self.logout = function() {
        appsecurity.logout();
        appsecurity.getAuthInfo().then(function (user) {
            self.isAuthenticated(false);
        });
    };

    //helper method to refresh visible-values of the routes
    self.refreshRouteAccess = function() {
        _.each(router.navigationModel(), function(nav) {
            nav.visible((appsecurity.isAuthenticated() && appsecurity.hasRightsForRole(nav.role)) || !nav.authorize);
        });
    };
    

    return {
        activate: self.activate,
        login: self.login,
        logout: self.logout,
        router: router,
        isAuthenticated: self.isAuthenticated,
        
    };
});