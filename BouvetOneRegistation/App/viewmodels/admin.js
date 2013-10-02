define(['durandal/app', 'services/programService', 'services/registrationService'], function (app, programService, registrationService) {
    var self = this;
    self.displayName = 'Administrator';
    self.timeslots = ko.observableArray([]);
    self.rooms = ko.observable();
    self.sessions = ko.observable();
    self.gridster = null;
    self.col_width = 140;
    self.row_height = 45;
    self.sessions = ko.observableArray([]);
    self.unassignedSessions = ko.observableArray([]);
    
    self.timeslotsLength = ko.computed(function() {
        return self.timeslots().length;
    });

    //custom serialize function for gridster
    self.gridSerialize = function($w, wgd) {
        if ($w.hasClass('widget-not-draggable') === false) {
            return {
                bookingId: parseInt($w.attr('data-booking-id')),
                sessionId: parseInt($w.attr('data-session-id')),
                timeslotId: self.gridster.gridmap[1][wgd.row].attr('data-timeslot-id'),
                roomId: _.first(_.where(self.rooms(), { slotIndex: wgd.col - 2 })).id,
                dayId: 1
            };
        }
        return null;
    };

    self.addWidget = function(session, booking, timeslotIndex) {
        var el = $("<li></li>").text(session.title)
            .addClass('widget-booking')
            .attr('data-session-id', session.id);

        if (booking != null) {
            el.attr('data-booking-id', booking.id);
            self.gridster.add_widget(el, null, null, booking.room.slotIndex + 2, timeslotIndex + 2);
        } else {
            self.gridster.add_widget(el, null, null, self.rooms().length + 2, 2);
        }

        return el;
    };

    return {
        activate: function() {
            /*
            registrationService.getCurrentUserAsync().then(function (user) {
                if (!user.admin) {
                    router.navigateBack();
                }
            });*/

            programService.getDayWithTimeSlots(1).then(function(day) {
                programService.fillBookingsForDay(day).done(function() {
                    programService.fillEmbeddedInfo(day).done(function() {

                        //fill schedule
                        self.timeslots(_.map(day.timeslots, function(timeslot) {
                            return {
                                id: timeslot.id,
                                displayTime: moment(timeslot.startTime).format('HH:mm') + '-' + moment(timeslot.endTime).format('HH:mm'),
                                bookings: timeslot.bookings
                            };
                        }));

                        //initialize gridster
                        self.gridster = $('.gridster ul').gridster({
                            widget_margins: [5, 5],
                            widget_base_dimensions: [col_width, row_height],
                            avoid_overlapped_widgets: true,
                            max_cols: self.rooms().length + 2,
                            max_rows: self.rooms().length + 1,
                            static_class: 'widget-not-draggable',
                            draggable: {
                                items: ".gs_w:not(.widget-not-draggable)"
                            },
                            serialize_params: self.gridSerialize,
                        }).data('gridster');


                        //add widgets to gridster
                        _.each(self.timeslots(), function(timeslot, timeslotIndex) {
                            _.each(timeslot.bookings, function(booking) {
                                self.addWidget(booking.session, booking, timeslotIndex);
                            });
                        });

                        //add 'bucket' for unassigned sessions
                        self.gridster.add_widget(
                            "<li class='widget-not-draggable'>Unassigned</li>",
                            2,
                            null,
                            self.rooms().length + 2,
                            1
                        );
                    });
                });
            });

            //get rooms for given day
            programService.getRoomsAsync(1).then(function(rooms) {
                self.rooms(_.sortBy(rooms, function(room) { return room.slotIndex; }));
            });

            //get all sessions
            registrationService.getSessionsAsync().then(function(sessions) {
                self.sessions(_.map(sessions, function(session) {
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
        },

        activateSession: function(session) {
            if (!session.isPublic()) {
                session.isPublic(true);

                programService.setSessionPublic(session.id, true).then(function(response) {

                    self.addWidget(session, null, null);
                }, function(error) {
                    session.isPublic(false);
                    toastr.error(error);
                });
            }
        },

        deactivateSession: function(session) {
            if (session.isPublic()) {
                session.isPublic(false);

                programService.setSessionPublic(session.id, false).then(function(response) {
                    //find widget, 
                    //calling _.each just in case there are duplicates on the grid
                    var el = self.gridster.$widgets.filter(function() {
                        return $(this).attr('data-session-id') == session.id;
                    });
                    _.each(el, function(e) { self.gridster.remove_widget(e); });

                }, function(error) {
                    session.isPublic(true);
                    toastr.error(error);
                });
            }
        },

        saveProgram: function() {
            var list = _.filter(self.gridster.serialize(), function(w) {
                return w !== null;
            });
            
            //todo: multiple days support
            programService.saveProgram(list, 1)
                .then(function() {
                    toastr.success('Programmet ble lagret');
                }); 
        }
    };
});