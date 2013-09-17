define(['plugins/router', 'durandal/app', 'MobileServiceClient'], function (router, app, client) {
    return {
        router: router,
        search: function() {
            //It's really easy to show a message box.
            //You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        activate: function () {
            return router.map([
                { route: '',                title: 'Registrering',  moduleId: 'viewmodels/registration',    nav: true},
                { route: 'program',         title: 'Program',       moduleId: 'viewmodels/program',         nav: true}
            ]).buildNavigationModel()
                .mapUnknownRoutes('viewmodels/404', '404')
                .activate();
        },
        login: function () {
            client.login('google').then(function (e) {
                toastr.success('Du er logget inn');
                authenticated(true);
            }, function (error) {
                toastr.error('En feil oppstod');
                console.log(error);
            });
        },
        logout: function () {
            client.logout();
            authenticated(false);
        },
        authenticated: ko.observable(false)
    };
});