define(['services/registrationService', 'knockout'], function (registrationService, ko) {
    //Note: This module exports an object.
    //That means that every module that "requires" it will get the same object instance.
    //If you wish to be able to create multiple instances, instead export a function.
    //See the "welcome" module for an example of function export.
    var self = this;
    self.displayName = 'Registration';
    self.speaker = ko.observable();
    self.speakerId = ko.observable('');
    self.speakerRegistered = ko.computed(function() {
        return self.speakerId() != '';
    });

    self.intializeSessionInput = function () {
        return {
            title: '',
            description: '',
            level: ''
        };
    };
    self.registrationInput = ko.observable(self.intializeSessionInput());

    self.registerSpeaker = function() {
        return registrationService.registerSpeaker(self.speaker()).then(function(data) {
            self.speakerId(data);
        });
    };

    self.registerSession = function () {
        if (!self.speakerId()) {
            toastr.error('No speaker has been chosen for this session');
            return;
        }
        registrationService.registerSession(self.speakerId(), self.registrationInput());
    };

    self.activate = function() {
        //the router's activator calls this function and waits for it to complete before proceding
        //if (this.images().length > 0) {
        //    return;
        //}
        return registrationService.getAllSpeakers().then(function(data) {
            var a = data;
        });
    };
    


    return {
        displayName: self.displayName,
        speakerId: self.speakerId,
        speaker: self.speaker,
        speakerRegistered: self.speakerRegistered,
        registerSession: self.registerSession,
        registerSpeaker: self.registerSpeaker,
        activate: self.activate
    };
});