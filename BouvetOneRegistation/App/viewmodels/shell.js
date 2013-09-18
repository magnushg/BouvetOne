define(['plugins/router', 'durandal/app', 'MobileServiceClient'], function (router, app, client) {
    return {
        router: router,
        search: function() {
            //It's really easy to show a message box.
            //You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        activate: function () {
            if (localStorage.currentUser != null) {
                client.currentUser = JSON.parse(localStorage.currentUser);
            }
            return router.map([
                { route: '',                title: 'Registrering',  moduleId: 'viewmodels/registration',    nav: true},
                { route: 'program',         title: 'Program',       moduleId: 'viewmodels/program',         nav: true}
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
            localStorage.currentUser = null;
        },
        authenticated: ko.computed(function () {
            //todo: ugly. had to put there since authenticate is called before activate
            if (localStorage.currentUser != null) {
                client.currentUser = JSON.parse(localStorage.currentUser);
            }
            
            return client.currentUser != null;
        })
    };
});