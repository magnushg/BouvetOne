define(['plugins/http', 'MobileServiceClient'], function(http, client) {
    var self = {};

    self.getCurrentSpeakerNameAsync = function () {
        return client.getTable('Speaker')
            .where({ userId: client.currentUser.userId })
            .read().then(function (response) {
                if (response.length > 0) return _.first(response).name;
                else return null;
            }, function(error) {
                console.log(error);
            });
    };
    
    self.registerSpeakerNameAsync = function (speakerName) {
        return client.getTable('Speaker').insert({ name: speakerName }).then(function(response) {
            return response;
        }, function(error) {
            toastr.error('En feil oppstod');
            console.log(error);
        });
    };

    self.registerSession = function(sessionDetails) {
        var data = { speakerId: speakerId, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
        client.getTable('Session').insert(data).then(function(response) {
            toastr.success('Foredraget "' + sessionDetails.title() + '" ble lagt til');
        }, function(error) {
            toastr.error(error);
        });
    };

    self.updateSession = function(sessionDetails) {
        var data = { speakerId: speakerId, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
        client.getTable('Session').update(data).then(function(response) {
            toastr.success('Foredraget ble oppdatert');
        }, function(error) {
            if (error.message == 'Forbidden') {
                toastr.error('Foredraget tilhører ikke deg');
            } else {
                toastr.error('En ukjent feil oppstod');
                console.log(error);
            }
        });
    };
    

    self.getAllSpeakers = function() {
        toastr.error('not yet ported to web services');
    };


    self.getProgram = function(dayId) {
        toastr.error('not yet ported to web services');
    };

    self.getRooms = function(dayId) {
        toastr.error('not yet ported to web services');
    };
    self.deleteSession = function(session) {
        toastr.error('not yet ported to web services');
    };

    return self;
});