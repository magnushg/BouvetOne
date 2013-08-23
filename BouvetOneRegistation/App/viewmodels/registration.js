define(['services/registrationService', 'knockout'], function (registrationService, ko) {
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
    self.defaultLevel = 'Middels - 200';
    self.levels = ko.observableArray(['Lett - 100', self.defaultLevel, 'Ekspert - 300']);
    self.speakers = ko.observableArray([]);
    self.sessions = ko.computed(function() {
        return _.flatten(_.map(self.speakers(), function(speaker) {
            return _.map(speaker.sessions(), function(session) {
                return {
                    speaker: speaker.name,
                    title: session.title,
                    description: session.description,
                    level: session.level
                };
            });
        }));
    });

    self.intializeSessionInput = function () {
        return {
            title: ko.observable(''),
            description: ko.observable(''),
            level: ko.observable(self.defaultLevel)
        };
    };
    self.registrationInput = ko.observable(self.intializeSessionInput());

    self.registerSpeaker = function() {
        if (self.speaker() === undefined || self.speaker() === '') {
            toastr.warning('Skriv inn et brukernavn');
            return;
        }
        var existing = _.find(self.speakers(), function (speaker) {
            return speaker.name === self.speaker();
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
        registrationService.registerSession(self.speakerId(), self.registrationInput()).then(function(newID) {
            var speaker = _.find(self.speakers(), function(s) {
                return s.id === self.speakerId();
            });
            if (speaker !== undefined) {
                speaker.sessions.push({ speaker: speaker.name, title: registrationInput().title(), description: self.registrationInput().description(), level: self.registrationInput().level() });
                self.clearInput();
            }
            
        });
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
    
    return {
        displayName: self.displayName,
        speakerId: self.speakerId,
        speaker: self.speaker,
        sessions: self.sessions,
        levels: self.levels,
        speakerRegistered: self.speakerRegistered,
        registerSession: self.registerSession,
        registerSpeaker: self.registerSpeaker,
        activate: self.activate
    };
});