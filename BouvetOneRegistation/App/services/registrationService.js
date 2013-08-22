define(['plugins/http'], function(http) {
    return {
        registerSpeaker: function(speakerName) {
            return http.post('registration/speaker', speakerName).then(function(data) {
                toastr.success('Bruker ' + speakerName + ' ble lagt til');
                return data;
            }).fail(function(error) {
                toastr.error('Det skjedde en feil ved registrering ' + error.message);
            });
        },
        registerSession: function(speakerId, sessionDetails) {
            var data = { id: speakerId, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
            return http.post('registration/session', data).then(function (response) {
                toastr.success('Foredrag ' + sessionDetails.title() + ' ble lagt til');
                return response;
            }).fail(function (error, message) {
                console.log(error);
                toastr.error('Det skjedde en feil ved registrering ' + message);
            });
        },
        getAllSpeakers: function() {
            return http.get('api/registration').then(function(response) {
                return response;
            }).fail(function(error, message) {
                console.log(error);
                toastr.error('Det skjedde en feil ved henting av foredragsholdere ' + message);
            });
        }
    };
})