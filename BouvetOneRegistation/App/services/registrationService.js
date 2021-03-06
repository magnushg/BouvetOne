﻿define(['plugins/http', 'MobileServiceClient', 'services/appsecurity'], function(http, client, appsecurity) {
    var self = {};

    self.registerSpeakerNameAsync = function (speakerName, authId) {

        if (_.isNull(authId) || _.isUndefined(authId)) {
            authId = appsecurity.user().authId;
        }
        
        return client.getTable('Speaker').insert({ name: speakerName, authId: authId }).then(function (response) {
            return response;
        }, function(error) {
            toastr.error('En feil oppstod');
            console.log(error);
        });
    };

    self.registerSessionAsync = function(sessionDetails) {
        var data = {
            speakerId: appsecurity.user().userId,
            title: sessionDetails.title(),
            description: sessionDetails.description(),
            level: sessionDetails.level(),
        };
        return client.getTable('Session').insert(data).then(function(response) {
            toastr.success('Foredraget "' + sessionDetails.title() + '" ble lagt til');
            return response;
        }, function(error) {
            toastr.error(error);
        });
    };

    self.registerSessionForAnother = function (sessionDetails) {
        var data = {
            title: sessionDetails.title(),
            description: sessionDetails.description(),
            level: sessionDetails.level(),
            speakerId: sessionDetails.speakerId()
        };
        
        var createSpeaker = !_.isEmpty(sessionDetails.newSpeaker()),
            promise,
            name;
        
        if (createSpeaker) {
            promise = self.registerSpeakerNameAsync(sessionDetails.newSpeaker(), '').then(function (speaker) {
                name = sessionDetails.newSpeaker();
                data.speakerId = speaker.id;
                return client.getTable('Session').insert(data);
            });
        } else {
            name = sessionDetails.speakerName;
            promise = client.getTable('Session').insert(data);
        }
        
        return promise.then(function (response) {
            toastr.success('Foredraget "' + sessionDetails.title() + '" ble lagt til');
            response.speaker = { name: name };
            
            return response;
        }, function (error) {
            toastr.error(error);
        });
    };

    self.updateSession = function(sessionDetails) {
        var data = { id: sessionDetails.id, title: sessionDetails.title(), description: sessionDetails.description(), level: sessionDetails.level() };
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

    self.getSpeakers = function() {
        return client.getTable('Speaker').read();
    };

    self.deleteSession = function(session) {
        return client.getTable('Session').del({ id: session.id });
    };


    self.getAllSpeakersA = function() {
        toastr.error('not yet ported to web services');
    };


    self.getProgram = function(dayId) {
        toastr.error('not yet ported to web services');
    };

    self.getRooms = function(dayId) {
        toastr.error('not yet ported to web services');
    };

    self.getCurrentUserAsync = function() {
        return client.getTable('Speaker')
            .where({ authId: client.currentUser.userId })
            .read().then(function (response) {
                if (response.length > 0) return _.first(response);
                else return null;
            }, function (error) {
                console.log(error);
            });
    };

    self.getSessionsAsync = function () {
        var requests = [],
            deferred = Q.defer(),
            sessions = null;
        
        client.getTable('Session').read().then(function (s) {
            sessions = s;
            
            //fetch speaker for session and append to session-object
            _.each(sessions, function(session) {
                var promise = client.getTable('Speaker')
                                .where({ 'id': session.speakerId })
                                .read().then(function (user) {
                                    $.extend(session, { speaker: _.first(user) });
                                });
                requests.push(promise);
            });

            Q.all(requests).then(function() {
                deferred.resolve(sessions);
            });

        }, function (error) {
            toastr.error('En feil oppstod under lagringen.');
            console.log(error);
        });
        
        return deferred.promise;
    };


    return self;
});