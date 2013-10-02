define(['durandal/app', 'services/registrationService', 'knockout', 'MobileServiceClient', 'viewmodels/editRegistration'], function (app, registrationService, ko, webservice, editModal) {
    //Note: This module exports an object.
    //That means that every module that "requires" it will get the same object instance.
    //If you wish to be able to create multiple instances, instead export a function.
    //See the "welcome" module for an example of function export.
    var self = this;
    self.displayName = 'Registrering';

    //-- observables and variables
    self.speaker = ko.observable('');
    self.speakerId = ko.observable(webservice.currentUser ? webservice.currentUser.userId : '');
    self.speakerNameInput = ko.observable('');
    self.sessions = ko.observableArray([]);
    self.defaultLevel = 'Middels - 200';
    self.levels = ko.observableArray(['Lett - 100', self.defaultLevel, 'Ekspert - 300']);
    self.editSessionId = ko.observable('');

    //-- computed variables
    self.isAuthenticated = ko.computed(function () {
        return webservice.currentUser !== null && webservice.currentUser !== undefined;
    });
    self.speakerRegistered = ko.computed(function () {
        return self.speaker() != '';
    });
    self.isEditingSession = ko.computed(function (session){
        if (session)
            return self.editSessionId() === session.id;
        return false;
    });
    
    //-- forms/templates
    self.intializeSessionInput = function () {
        return {
            title: ko.observable(''),
            description: ko.observable(''),
            level: ko.observable(self.defaultLevel)
        };
    };
    self.registrationInput = ko.observable(self.intializeSessionInput());

    //-- form actions
    self.registerSpeaker = function() {
        if (self.speakerNameInput() === undefined || self.speakerNameInput() === '') {
            toastr.warning('Skriv inn et brukernavn');
            return;
        }
        
        registrationService.registerSpeakerNameAsync(self.speakerNameInput()).then(function (speaker) {
            self.speakerId(speaker.userId);
            self.speaker(speaker.name);
        });
    };

    self.registerSession = function (session) {
        registrationService.registerSessionAsync(session).then(function(newSession) {
            self.sessions.push(newSession);
            self.clearInput();
        });
    };
    
    self.updateSession = function (session) {
        toastr.error('not yet implemented');
        /*
        registrationService.updateSession(session).then(function (response) {
        });
        console.log(self.registrationUpdateSession);        */
    };

    self.removeSession = function(session) {
        app.showMessage('Er du sikker på at du vil slette foredraget "' + session.title +'"?', 'Slette foredrag', ['Ja', 'Nei']).then(function(dialogResult) {
            if (dialogResult === 'Ja') {
                
                registrationService.deleteSession(session).then(function() {

                    toastr.success(session.title + ' ble slettet.');

                    _.filter(self.sessions(), function(s) {
                        return s.id !== session.id;
                    });
                });
            }
        });
    };

    //-- helpers, todo: remove unused
    
    self.speakersAreEqual = function (speaker1, speaker2) {
        return speaker1.toLowerCase() === speaker2.toLowerCase();
    };

    self.allowRemove = function (session) {
        if (self.speaker() === undefined || self.speaker() === '') return false;
        return session.speaker.toLowerCase() === self.speaker().toLowerCase();
    };

    self.allowEdit = self.allowRemove; //Implement another if needed

    self.filterOwnSession = function (session) {
        if (self.speaker() === undefined || self.speaker() === '') return true; //no speaker to filter by
        if (session.speaker.toLowerCase() === self.speaker().toLowerCase()) return true;
        return false;
    };

    self.clearInput = function() {
        self.registrationInput().title('');
        self.registrationInput().description('');
        self.registrationInput().level(self.defaultLevel);
    };

    //-- activate
    self.activate = function () {
        if (webservice.currentUser) {
            //todo: save speaker name in localStorage and verify afterwards instead
            registrationService.getCurrentSpeakerNameAsync().then(function (name) {
                self.speaker(name || '');
            });
            
            registrationService.getSessionsAsync().then(function (sessions) {
                self.sessions(_.map(sessions, function(session) {
                    return {
                        id: session.id,
                        description: ko.observable(session.description),
                        title: ko.observable(session.title),
                        level: ko.observable(session.level),
                        isPublic: session.isPublic,
                        speaker: session.speaker.name
                    };
                }));
            });
        }
    };
    
    self.editSession = function (session) {
        app.showDialog(new editModal(session, self.levels)).then(function (results, save) {
            if (save) {
                session.title(results.title);
                session.description(results.description);
                session.level(results.level);
                
                registrationService.updateSession(session);
            }
        });
    };

    return self;
});