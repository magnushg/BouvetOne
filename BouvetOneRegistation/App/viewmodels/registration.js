define(['durandal/app', 'services/registrationService', 'knockout', 'MobileServiceClient'], function (app, registrationService, ko, webservice) {
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
    self.editSessionId = null;

    //-- computed variables
    self.isAuthenticated = ko.computed(function () {
        return webservice.currentUser !== null && webservice.currentUser !== undefined;
    });
    self.speakerRegistered = ko.computed(function () {
        return self.speaker() != '';
    });
    self.isEditingSession = function (session) {
        return editSessionId === session.id;
    };
    
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
            /*
            var speaker = _.find(self.speakers(), function(s) {
                return s.id === self.speakerId();
            });
            if (speaker !== undefined) {
                speaker.sessions.push({ id: newId, speaker: speaker.name, title: registrationInput().title(), description: self.registrationInput().description(), level: self.registrationInput().level() });
                self.clearInput();
            }    */
        });
    };
    
    self.updateSession = function (session) {
        registrationService.updateSession(session).then(function (response) {
        });
        console.log(self.registrationUpdateSession);
    };

    self.removeSession = function(session) {
        app.showMessage('Er du sikker på at du vil slette foredraget "' + session.title +'"?', 'Slette foredrag', ['Ja', 'Nei']).then(function(dialogResult) {
            if (dialogResult === 'Ja') {
                var speaker = _.find(self.speakers(), function (spk) {
                    return self.speakersAreEqual(spk.name,session.speaker);
                });
                registrationService.deleteSession(session).then(function () {
                    // Remove session from local session list
                    speaker.sessions(_.filter(speaker.sessions(), function (s) {
                        return s.id !== session.id;
                    }));
                });
            }
        });
    };

    //-- helpers, todo: remove unused
    self.editSession = function (session) {
        self.editSessionId = session.id;
        return;
    };

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
            registrationService.getCurrentSpeakerNameAsync().then(function (name) {
                self.speaker(name || '');
            });
            registrationService.getSessionsAsync().then(function (sessions) {
                self.sessions(sessions);
            });
        }
    };

    return self;


    /* not in use
     self.initializeSessionUpdate = function() {
     return {
     title: ko.observable(''),
     description: ko.observable(''),
     level: ko.observable(self.defaultLevel),
     };
     };
     self.registrationUpdateSession = ko.observable(self.initializeSessionUpdate());
     */
});