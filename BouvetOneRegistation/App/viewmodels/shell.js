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

        activate: function () {
            
            router.guardRoute = function(instance, instruction) {
                if (instruction.config.authorize) {
                    if (appsecurity.isAuthenticated()) {
                        if (instruction.config.role === appsecurity.getRole()) {
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
        login: function () {
            client.login('google').then(function (e) {
                localStorage.currentUser = JSON.stringify(client.currentUser);
                toastr.success('Du er logget inn');
            }, function (error) {
                toastr.error('En feil oppstod');
                console.log(error);
            });
        },
        logout: function () {
            client.logout();
            delete localStorage.currentUser;
        },
    };
});