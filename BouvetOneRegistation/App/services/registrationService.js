define(['plugins/http'], function(http) {
    return {
        registerSpeaker: function(speakerName) {
            return http.post('registration/speaker', speakerName).then(function(data) {
                toastr.success('User ' + speakerName + ' registered');
                return data;
            }).fail(function(error) {
                toastr.error('Registration failed with error ' + error.message);
            });
        },
        registerSession: function(speakerId, sessionDetails) {
            var data = { id: speakerId, title: sessionDetails.title, description: sessionDetails.description, level: sessionDetails.level };
            return http.post('registration/session', data).then(function (response) {
                toastr.success('Session ' + sessionDetails.title + ' registered');
                return response;
            }).fail(function (error, message) {
                console.log(error);
                toastr.error('Registration failed with error ' + message);
            });
        },
        getAllSpeakers: function() {
            return http.get('api/registration').then(function(response) {
                return response;
            }).fail(function(error, message) {
                console.log(error);
                toastr.error('Speaker retrieval failed with error ' + message);
            });
        }
    };
})