"use strict";
define(['appsecurity','MobileServiceClient'], function (appsecurity, mobileservice) {
    var run = function() {

        test("admin has rights to any role", function () {
            appsecurity.user().isAdmin = true;

            ok(appsecurity.hasRightsForRole("Public"), "public rights");
            ok(appsecurity.hasRightsForRole("Admin"), "admin rights");
            ok(appsecurity.hasRightsForRole("Arbitrary"), "any rights");
        });

        test("getAuthInfo restores localStorage user", function() {
            //create a dummy localstorage user
            var user = appsecurity.user();
            user.userId = '1234';
            user.name = 'name';
            user.isAdmin = true;
            localStorage.currentUser = JSON.stringify(user);
            
            //set mobileservice to return this user when querying the db
            mobileservice.setNextReturnObject(user);

            appsecurity.getAuthInfo();

            //check if appsecurity correctly sets user
            equal(appsecurity.user().userId, user.userId, "userId matches");
            equal(appsecurity.user().name, user.name, "name matches");
            equal(appsecurity.user().admin, user.admin, "admin rights matches");
        });

        test("isRegistered() returns false if user is not yet registered", function() {

            mobileservice.setNextReturnObject({});

            appsecurity.getAuthInfo();

            ok(appsecurity.isRegistered(), false);
        });

        test("login sets localStorage", function() {
            var usr = { userId: '123' };
            mobileservice.setNextReturnObject(usr);

            appsecurity.login();

            equal(usr.userId, JSON.parse(localStorage.currentUser).userId);
        });

        test("logout deletes localStorage", function() {
            var usr = { userId: '123' };
            mobileservice.setNextReturnObject(usr);

            appsecurity.login();
            appsecurity.logout();
            
            ok(localStorage.currentUser === undefined);
        });
        
        test("logout sets isAuthenticated to false and role to public", function() {
            var usr = { userId: '123' };
            mobileservice.setNextReturnObject(usr);

            appsecurity.login();
            appsecurity.logout();
            
            ok(appsecurity.isAuthenticated() === false);
            ok(appsecurity.hasRightsForRole('Admin') === false);
        });
    };

    return { run: run };
})