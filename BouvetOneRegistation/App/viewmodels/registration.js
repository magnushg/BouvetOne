"use strict";
define(['durandal/app', 'services/registrationService', 'knockout', 'MobileServiceClient', 'viewmodels/editRegistration', 'services/appsecurity'], function (app, registrationService, ko, webservice, editModal, appsecurity) {

    var pub = {},
        priv = {};

    pub.displayName = 'Registrering';

    //-- observables and variables
    pub.speaker = ko.observable(appsecurity.user().name);
    pub.speakerNameInput = ko.observable('');
    pub.mySessions = ko.observableArray([]);
    pub.defaultLevel = 'Middels - 200';
    pub.levels = ko.observableArray(['Lett - 100', 'Middels - 200', 'Ekspert - 300']);
    pub.editSessionId = ko.observable('');
    pub.speakerRegistered = ko.observable(false);
    pub.registrationInput = ko.observable();
    
    //-- form actions
    pub.registerSpeaker = function() {
        if (pub.speakerNameInput() === undefined || pub.speakerNameInput() === '') {
            toastr.warning('Skriv inn et brukernavn');
            return;
        }
        
        registrationService.registerSpeakerNameAsync(pub.speakerNameInput()).then(function (speaker) {
            //update appsecurity
            appsecurity.getAuthInfo();
            //in case any old sessions bound to the userId exists
            priv.fetchSessions();
            pub.speakerRegistered(true);
            pub.speaker(speaker.name);
        });
    };

    pub.registerSession = function (session) {
        registrationService.registerSessionAsync(session).then(function (newSession) {
            priv.clearInput();
            
            pub.mySessions.push(
                {
                    id: newSession.id,
                    description: ko.observable(newSession.description),
                    title: ko.observable(newSession.title),
                    level: ko.observable(newSession.level),
                    isPublic: ko.observable(newSession.isPublic),
                }
            );
        });
    };
    
    pub.removeSession = function(session) {
        app.showMessage('Er du sikker på at du vil slette foredraget "' + session.title() +'"?', 'Slette foredrag', ['Ja', 'Nei']).then(function(dialogResult) {
            if (dialogResult === 'Ja') {
                
                registrationService.deleteSession(session).then(function(e) {

                    toastr.success(session.title() + ' ble slettet.');

                    pub.mySessions(_.filter(pub.mySessions(), function (s) {
                        return s.id !== session.id;
                    }));
                }, 
                function(error) {
                    toastr.error('Du har ikke tillatelse til å slette ' + session.title() + '. Dette kan skje hvis den allerede står på programmet.');
                });
            }
        });
    };

    //-- activate
    pub.activate = function () {
        pub.registrationInput(priv.intializeSessionInput());
        pub.speakerRegistered(appsecurity.isRegistered());
        
        if (pub.speakerRegistered()) {
            priv.fetchSessions();
        }
    };

    priv.fetchSessions = function() {
        registrationService.getSessionsAsync().then(function (sessions) {
            pub.mySessions(_.map(
                    //filter out sessions that arent the user's
                    _.filter(sessions, function (session) {
                        return session.speakerId == appsecurity.user().userId;
                    }),
                    function (session) {
                        return {
                            id: session.id,
                            description: ko.observable(session.description),
                            title: ko.observable(session.title),
                            level: ko.observable(session.level),
                            isPublic: ko.observable(session.isPublic),
                        };
                    }
                ));
            
            return pub.mySessions();
        });
    };
        
    pub.editSession = function (session) {
        app.showDialog(new editModal(session, pub.levels)).then(function (results, save) {
            if (save) {
                session.title(results.title);
                session.description(results.description);
                session.level(results.level);
                
                registrationService.updateSession(session);
            }
        });
    };
        
    //-- helpers
    priv.clearInput = function () {
        pub.registrationInput().title('');
        pub.registrationInput().description('');
        pub.registrationInput().level(self.defaultLevel);
    };

    //-- forms/templates
    priv.intializeSessionInput = function () {
        return {
            title: ko.observable(''),
            description: ko.observable(''),
            level: ko.observable(self.defaultLevel)
        };
    };
    
    return pub;
});