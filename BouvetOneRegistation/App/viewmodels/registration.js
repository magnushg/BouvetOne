define(['durandal/app', 'services/registrationService', 'knockout', 'MobileServiceClient', 'viewmodels/editRegistration', 'services/appsecurity'],
    function (app, registrationService, ko, webservice, editModal, appsecurity) {

    var self = this;
    self.displayName = 'Registrering';

    //-- observables and variables
    self.speaker = ko.observable(appsecurity.user().name);
    //self.speakerId = ko.observable(webservice.currentUser ? webservice.currentUser.userId : '');
    self.speakerNameInput = ko.observable('');
    self.sessions = ko.observableArray([]);
    self.defaultLevel = 'Middels - 200';
    self.levels = ko.observableArray(['Lett - 100', self.defaultLevel, 'Ekspert - 300']);
    self.editSessionId = ko.observable('');

    //-- computed variables
    self.speakerRegistered = ko.observable(false);
    
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
            appsecurity.getAuthInfo();
            self.fetchSessions();
            self.speakerRegistered(true);
        });
    };

    self.registerSession = function (session) {
        registrationService.registerSessionAsync(session).then(function(newSession) {
            self.sessions.push(newSession);
            self.clearInput();
        });
    };
    
    self.removeSession = function(session) {
        app.showMessage('Er du sikker på at du vil slette foredraget "' + session.title() +'"?', 'Slette foredrag', ['Ja', 'Nei']).then(function(dialogResult) {
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
    
    self.clearInput = function() {
        self.registrationInput().title('');
        self.registrationInput().description('');
        self.registrationInput().level(self.defaultLevel);
    };

    //-- activate
    self.activate = function () {
        self.speakerRegistered(appsecurity.isRegistered());
        
        if (self.speakerRegistered()) {
            self.fetchSessions();
        }
    };

    self.fetchSessions = function() {
        registrationService.getSessionsAsync().then(function (sessions) {
            self.sessions(_.map(sessions, function (session) {
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