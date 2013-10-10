"use strict";
define(['durandal/app', 'services/programService', 'services/registrationService'], function (app, programService, registrationService) {

    var priv = {},
        pub = {};

    pub.timeslots = ko.observableArray([]);
    pub.rooms = ko.observable();
    pub.sessions = ko.observableArray([]);

    priv.gridster = null;
    
    pub.activate = function() {
        //get rooms for given day
        programService.getRoomsAsync(1).then(function(rooms) {
            pub.rooms(_.sortBy(rooms, function (room) { return room.slotIndex; }));
        })
        .then(function() {
            //get all sessions
            return registrationService.getSessionsAsync().then(function(sessions) {
                pub.sessions(_.map(sessions, function (session) {
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
                        pub.timeslots(_.map(day.timeslots, function(timeslot) {
                            return {
                                id: timeslot.id,
                                displayTime: moment(timeslot.startTime).format('HH:mm') + '-' + moment(timeslot.endTime).format('HH:mm'),
                                bookings: timeslot.bookings
                            };
                        }));

                        var g_el = $('.gridster ul');
                        var w_width = (g_el.width() / (pub.rooms().length + 2)) - 10,
                            w_height = 45;
                        
                        //initialize gridster
                        priv.gridster = $('.gridster ul').gridster({
                            widget_margins: [5, 5],
                            widget_base_dimensions: [w_width, w_height],
                            avoid_overlapped_widgets: true,
                            max_cols: pub.rooms().length + 2,
                            max_rows: pub.rooms().length + 1,
                            static_class: 'widget-not-draggable',
                            draggable: {
                                items: ".gs_w:not(.widget-not-draggable)"
                            },
                            serialize_params: priv.gridSerialize,
                        }).data('gridster');

                        //add 'bucket' for unassigned sessions
                        priv.gridster.add_widget(
                            "<li class='widget-not-draggable'>Unassigned</li>",
                            null,
                            null,
                            pub.rooms().length + 2,
                            1
                        );
                        var assignedSessionIds = [];

                        //add booked sessions to gridster
                        _.each(pub.timeslots(), function(timeslot, timeslotIndex) {
                            _.each(timeslot.bookings, function(booking) {
                                priv.addWidget(booking.session, booking, timeslotIndex);
                                assignedSessionIds.push(booking.session.id);
                            });
                        });

                        //add public + non-booked sessions to the bucket
                        _.each(
                            _.filter(pub.sessions(), function(session) {
                                return session.isPublic() && !(_.contains(assignedSessionIds, session.id));
                            }),
                            function(unassignedSession) {
                                priv.addWidget(unassignedSession, null, null);
                            }
                        );
                    });
                });
            });
        });
    };

    pub.activateSession = function(session) {
        if (!session.isPublic()) {
            session.isPublic(true);

            programService.setSessionPublic(session.id, true).then(function(response) {

                priv.addWidget(session, null, null);
            }, function(error) {
                session.isPublic(false);
                toastr.error(error);
            });
        }
    };

    pub.deactivateSession = function(session) {
        if (session.isPublic()) {
            session.isPublic(false);

            programService.setSessionPublic(session.id, false).then(function(response) {
                //find widget, 
                //calling _.each just in case there are duplicates on the grid
                var el = priv.gridster.$widgets.filter(function() {
                    return $(this).attr('data-session-id') == session.id;
                });
                _.each(el, function(e) { priv.gridster.remove_widget(e); });

            }, function(error) {
                session.isPublic(true);
                toastr.error(error);
            });
        }
    };

    pub.saveProgram = function() {
        var list = _.filter(priv.gridster.serialize(), function(w) {
            return w !== null;
        });

        //todo: multiple days support
        programService.saveProgram(list, 1)
            .then(function() {
                toastr.success('Programmet ble lagret');
            });
    };
    
    //custom serialize function for gridster
    priv.gridSerialize = function ($w, wgd) {
        if ($w.hasClass('widget-not-draggable') === false) {

            if (wgd.col <= pub.rooms().length + 1
                && wgd.row <= pub.timeslots().length + 1) {

                return {
                    bookingId: parseInt($w.attr('data-booking-id')),
                    sessionId: parseInt($w.attr('data-session-id')),
                    timeslotId: priv.gridster.gridmap[1][wgd.row].attr('data-timeslot-id'),
                    roomId: _.first(_.where(pub.rooms(), { slotIndex: wgd.col - 2 })).id,
                    dayId: 1,
                    el: $w[0] //for testing
                };
            }
        }
        return null;
    };

    //helper for adding a booking as a gridster widget
    priv.addWidget = function (session, booking, timeslotIndex) {
        var el = $("<li></li>").text(session.title)
            .addClass('widget-booking')
            .attr('data-session-id', session.id);

        if (booking != null) {
            el.attr('data-booking-id', booking.id);
            priv.gridster.add_widget(el, null, null, booking.room.slotIndex + 2, timeslotIndex + 2);
        } else {
            priv.gridster.add_widget(el, null, null, pub.rooms().length + 2, 2);
        }

        return el;
    };

    return pub;
});