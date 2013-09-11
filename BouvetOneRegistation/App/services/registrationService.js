define(['plugins/http'], function(http) {
    var self = {};
    
    self.registerSpeaker = function(speakerName) {
        return http.post('registration/speaker', speakerName).then(function(data) {
            toastr.success('Bruker ' + speakerName + ' ble lagt til');
            return data;
        }).fail(function(error) {
            toastr.error('Det skjedde en feil ved registrering ' + error.message);
        });
    };
    self.registerSession = function(speakerId, sessionDetails) {
        var data = { speakerId: speakerId, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
        return http.post('registration/session', data).then(function(response) {
            toastr.success('Foredraget "' + sessionDetails.title() + '" ble lagt til');
            return response;
        }).fail(function(error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved registrering ' + message);
        });
    };
    self.updateSession = function(sessionId, sessionDetails) {
        var data = { sessionId: sessionId, speakerId: speakerId, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
        return http.post('registration/session/update', data).then(function (response) {
            toastr.success('Foredraget "' + sessionDetails.title() + '" ble oppdatert');
            return response;
        }).fail(function (error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved oppdatering ' + message);
        });
    };
    self.getAllSpeakers = function() {
        return http.get('api/registration').then(function(response) {
            return response;
        }).fail(function(error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved henting av foredragsholdere ' + message);
        });
    };
    self.getProgram = function(dayId) {
        return http.get('registration/program').then(function(response) {
            return response;
        }).fail(function(error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved henting av foredragsholdere ' + message);
        });
    };
    self.getRooms = function(dayId) {
        return http.get('registration/rooms').then(function(response) {
            return response;
        }).fail(function(error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved henting av foredragsholdere ' + message);
        });
    };
    self.deleteSession = function(session) {
        return $.ajax({
            url: 'api/registration?sessionId=' + session.id,
            type: 'DELETE'
        }).then(function() {
            toastr.success('Foredraget "' + session.title + '" ble slettet');
        }).fail(function(error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved sletting av foredrag ' + message);
        });
    };
    return self;
    
})