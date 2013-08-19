define(['plugins/http', 'durandal/app', 'knockout'], function (http, app, ko) {
    //Note: This module exports an object.
    //That means that every module that "requires" it will get the same object instance.
    //If you wish to be able to create multiple instances, instead export a function.
    //See the "welcome" module for an example of function export.

    return {
        displayName: 'Registration',
        speaker: ko.observable,
        activate: function () {
            //the router's activator calls this function and waits for it to complete before proceding
            //if (this.images().length > 0) {
            //    return;
            //}
        }
    };
});