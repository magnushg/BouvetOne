define(['plugins/http'], function(http) {

    var registerSpeaker = function(speakerName) {
        return http.post('registration/speaker', speakerName).then(function(data) {
            toastr.success('Bruker ' + speakerName + ' ble lagt til');
            return data;
        }).fail(function(error) {
            toastr.error('Det skjedde en feil ved registrering ' + error.message);
        });
    };
    var registerSession = function(speakerId, sessionDetails) {
        var data = { speakerId: speakerId, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
        return http.post('registration/session', data).then(function(response) {
            toastr.success('Foredraget "' + sessionDetails.title() + '" ble lagt til');
            return response;
        }).fail(function(error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved registrering ' + message);
        });
    };
    var updateSession = function(sessionId, sessionDetails) {
        var data = { speakerId: speakerId, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
        return http.post('registration/session/update', data).then(function (response) {
            toastr.success('Foredraget "' + sessionDetails.title() + '" ble oppdatert');
            return response;
        }).fail(function (error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved oppdatering ' + message);
        });
    };
    var getAllSpeakers = function() {
        return http.get('api/registration').then(function(response) {
            return response;
        }).fail(function(error, message) {
            console.log(error);
            toastr.error('Det skjedde en feil ved henting av foredragsholdere ' + message);
        });
    };
    var deleteSession = function(session) {
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

    return {
        registerSpeaker: registerSpeaker,
        registerSession: registerSession,
        getAllSpeakers: getAllSpeakers,
        deleteSession: deleteSession
    };
})