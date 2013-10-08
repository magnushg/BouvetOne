"use strict";
requirejs.config({
    paths: {
        'text': '../BouvetOneRegistation/Scripts/text',
        'durandal': '../BouvetOneRegistation/Scripts/durandal',
        'plugins': '../BouvetOneRegistation/Scripts/durandal/plugins',
        'transitions': '../BouvetOneRegistation/Scripts/durandal/transitions',
        'knockout': '../BouvetOneRegistation/Scripts/knockout-2.3.0',
        'moment': '../BouvetOneRegistation/Scripts/moment',
        'jquery': '../BouvetOneRegistation/Scripts/jquery-1.9.1',
        'Q': '../BouvetOneRegistation/Scripts/q.min',

        //stubs
        'MobileServiceClient': 'stubs/MobileServiceClientFake',

        //services
        'appsecurity': '../BouvetOneRegistation/App/services/appsecurity'
        
    }
});

requirejs(['tests/appsecurityTest', 'Q'], function (appsecurityTest, Q) {
    /*
     * Appsecurity tests
    */
    appsecurityTest.run();
})