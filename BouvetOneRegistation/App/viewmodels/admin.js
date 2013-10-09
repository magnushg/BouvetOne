"use strict";
define(['durandal/app', 'services/programService', 'services/registrationService'], function (app, programService, registrationService) {

    var displayName = 'Administrator',
        timeslots = ko.observableArray([]),
        rooms = ko.observable(),
        gridster = null,
        col_width = 200,
        row_height = 45,
        sessions = ko.observableArray([]);
    

    //custom serialize function for gridster
    var gridSerialize = function($w, wgd) {
        if ($w.hasClass('widget-not-draggable') === false) {

            if (wgd.col <= rooms().length + 1
                && wgd.row <= timeslots().length + 1) {

                return {
                    bookingId: parseInt($w.attr('data-booking-id')),
                    sessionId: parseInt($w.attr('data-session-id')),
                    timeslotId: gridster.gridmap[1][wgd.row].attr('data-timeslot-id'),
                    roomId: _.first(_.where(rooms(), { slotIndex: wgd.col - 2 })).id,
                    dayId: 1,
                    el: $w[0] //for testing
                };
            }
        }
        return null;
    };

    //helper for adding a booking as a gridster widget
    var addWidget = function (session, booking, timeslotIndex) {
        var el = $("<li></li>").text(session.title)
            .addClass('widget-booking')
            .attr('data-session-id', session.id);

        if (booking != null) {
            el.attr('data-booking-id', booking.id);
            gridster.add_widget(el, null, null, booking.room.slotIndex + 2, timeslotIndex + 2);
        } else {
            gridster.add_widget(el, null, null, rooms().length + 2, 2);
        }

        return el;
    };

    var activate = function() {
        //get rooms for given day
        programService.getRoomsAsync(1).then(function(_rooms) {
            rooms(_.sortBy(_rooms, function (room) { return room.slotIndex; }));
        })
        .then(function() {
            //get all sessions
            return registrationService.getSessionsAsync().then(function(_sessions) {
                sessions(_.map(_sessions, function (session) {
                    return {
                        id: session.id,
                        description: session.description,
                        title: session.title,
                        level: session.level,
                        isPublic: ko.observable(session.isPublic),
                        speaker: session.speaker.name
                    };
                }));
            });
        })
        .then(function() {
            //get bookings and embedded data
            programService.getDayWithTimeSlots(1).then(function(day) {
                programService.fillBookingsForDay(day).done(function() {
                    programService.fillEmbeddedInfo(day).done(function() {

                        //fill schedule
                        timeslots(_.map(day.timeslots, function(timeslot) {
                            return {
                                id: timeslot.id,
                                displayTime: moment(timeslot.startTime).format('HH:mm') + '-' + moment(timeslot.endTime).format('HH:mm'),
                                bookings: timeslot.bookings
                            };
                        }));

                        //initialize gridster
                        gridster = $('.gridster ul').gridster({
                            widget_margins: [5, 5],
                            widget_base_dimensions: [col_width, row_height],
                            avoid_overlapped_widgets: true,
                            max_cols: rooms().length + 2,
                            max_rows: rooms().length + 1,
                            static_class: 'widget-not-draggable',
                            draggable: {
                                items: ".gs_w:not(.widget-not-draggable)"
                            },
                            serialize_params: gridSerialize,
                        }).data('gridster');

                        //add 'bucket' for unassigned sessions
                        gridster.add_widget(
                            "<li class='widget-not-draggable'>Unassigned</li>",
                            null,
                            null,
                            rooms().length + 2,
                            1
                        );
                        var assignedSessionIds = [];

                        //add booked sessions to gridster
                        _.each(timeslots(), function(timeslot, timeslotIndex) {
                            _.each(timeslot.bookings, function(booking) {
                                addWidget(booking.session, booking, timeslotIndex);
                                assignedSessionIds.push(booking.session.id);
                            });
                        });

                        //add public + non-booked sessions to the bucket
                        _.each(
                            _.filter(sessions(), function(session) {
                                return session.isPublic() && !(_.contains(assignedSessionIds, session.id));
                            }),
                            function(unassignedSession) {
                                addWidget(unassignedSession, null, null);
                            }
                        );
                    });
                });
            });
        });
    };

    var activateSession = function(session) {
        if (!session.isPublic()) {
            session.isPublic(true);

            programService.setSessionPublic(session.id, true).then(function(response) {

                addWidget(session, null, null);
            }, function(error) {
                session.isPublic(false);
                toastr.error(error);
            });
        }
    };

    var deactivateSession = function(session) {
        if (session.isPublic()) {
            session.isPublic(false);

            programService.setSessionPublic(session.id, false).then(function(response) {
                //find widget, 
                //calling _.each just in case there are duplicates on the grid
                var el = gridster.$widgets.filter(function() {
                    return $(this).attr('data-session-id') == session.id;
                });
                _.each(el, function(e) { gridster.remove_widget(e); });

            }, function(error) {
                session.isPublic(true);
                toastr.error(error);
            });
        }
    };

    var saveProgram = function() {
        var list = _.filter(gridster.serialize(), function(w) {
            return w !== null;
        });

        //todo: multiple days support
        programService.saveProgram(list, 1)
            .then(function() {
                toastr.success('Programmet ble lagret');
            });
    };

    return {        
        saveProgram: saveProgram,
        deactivateSession: deactivateSession,
        activateSession: activateSession,
        activate: activate,
        rooms: rooms,
        sessions: sessions,
        timeslots: timeslots
    };
});