"use strict";
define(['appsecurity','MobileServiceClient'], function (appsecurity, mobileservice) {
    var run = function() {

        test("admin has rights to any role", function () {
            appsecurity.user().isAdmin = true;

            ok(appsecurity.hasRightsForRole("Public"));
            ok(appsecurity.hasRightsForRole("Admin"));
            ok(appsecurity.hasRightsForRole("Arbitrary"));
        });

        test("getAuthInfo restores localStorage user", function() {
            var user = appsecurity.user();
            user.userId = '1234';
            localStorage.currentUser = JSON.stringify(user);
            mobileservice.setNextReturnObject(user);

            appsecurity.getAuthInfo();

            equal(appsecurity.user().userId, user.userId);
        });
    };

    return { run: run };
})