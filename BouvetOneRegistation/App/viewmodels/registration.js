define(['durandal/app', 'services/registrationService', 'knockout'], function (app, registrationService, ko) {
    //Note: This module exports an object.
    //That means that every module that "requires" it will get the same object instance.
    //If you wish to be able to create multiple instances, instead export a function.
    //See the "welcome" module for an example of function export.
    var self = this;
    self.displayName = 'Registrering';

    self.speaker = ko.observable();
    self.speakerId = ko.observable('');
    self.speakerRegistered = ko.computed(function() {
        return self.speakerId() != '';
    });
    
    self.editSessionId = ko.observable('');
    self.isEditingSession = function (session) {
        console.log(editSessionId === session.id);
        return editSessionId === session.id;
    };

    self.defaultLevel = 'Middels - 200';
    self.levels = ko.observableArray(['Lett - 100', self.defaultLevel, 'Ekspert - 300']);
    self.speakers = ko.observableArray([]);
    self.sessions = ko.computed(function() {
        var a = _.flatten(_.map(self.speakers(), function (speaker) {
            return _.map(speaker.sessions(), function(session) {
                var b = {
                    speaker: speaker.name,
                    id: session.id,
                    title: session.title,
                    description: session.description,
                    level: session.level
                };
                return b;
            });
        }));
        return a;
    });

    self.intializeSessionInput = function () {
        return {
            title: ko.observable(''),
            description: ko.observable(''),
            level: ko.observable(self.defaultLevel)
        };
    };
    self.registrationInput = ko.observable(self.intializeSessionInput());

    self.initializeSessionUpdate = function() {
        return {
            title: ko.observable(''),
            description: ko.observable(''),
            level: ko.observable(self.defaultLevel),
        };
    };

    self.registrationUpdateSession = ko.observable(self.initializeSessionUpdate());

    self.registerSpeaker = function() {
        if (self.speaker() === undefined || self.speaker() === '') {
            toastr.warning('Skriv inn et brukernavn');
            return;
        }
        var existing = _.find(self.speakers(), function (speaker) {
            return self.speakersAreEqual(speaker.name, self.speaker());
        });
        if (existing !== undefined) {
            toastr.success('Du kan legge til flere foredrag', 'Du er allerede registrert');
            self.speakerId(existing.id);
            return;
        }
        registrationService.registerSpeaker(self.speaker()).then(function (newId) {
            self.speakerId(newId);
            self.speakers.push({ id: newId, name: speaker(), sessions: ko.observableArray([]) });
        });
    };

    self.registerSession = function () {
        if (!self.speakerId()) {
            toastr.error('Du må legge til en foredragsholder');
            return;
        }
        registrationService.registerSession(self.speakerId(), self.registrationInput()).then(function(newId) {
            var speaker = _.find(self.speakers(), function(s) {
                return s.id === self.speakerId();
            });
            if (speaker !== undefined) {
                speaker.sessions.push({ id: newId, speaker: speaker.name, title: registrationInput().title(), description: self.registrationInput().description(), level: self.registrationInput().level() });
                self.clearInput();
            }
        });
    };
    
    self.updateSession = function () {
        console.log(self.registrationUpdateSession);
//        registrationService.updateSession()
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

    self.activate = function() {
        return registrationService.getAllSpeakers().then(function(speakers) {
            self.speakers(_.map(speakers, function(speaker) {
                return {
                    id: speaker.id,
                    name: speaker.name,
                    sessions: ko.observableArray(speaker.sessions)
                };
            }));
        });
    };

    return self;
});