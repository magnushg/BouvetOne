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
    
    self.timeslotsLength = ko.computed(function() {
        return self.timeslots().length;
    });
    
    return {
        activate: function () {
            /*
            registrationService.getCurrentUserAsync().then(function (user) {
                if (!user.admin) {
                    router.navigateBack();
                }
            });*/
            
            programService.getDayWithTimeSlots(1).then(function (day) {
                programService.fillBookingsForDay(day).done(function () {
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
                            widget_margins: [5,5],
                            widget_base_dimensions: [col_width, row_height],
                            avoid_overlapped_widgets: true,
                            max_cols: self.timeslots().length + 1,
                            max_rows: self.rooms().length + 1,
                            static_class: 'widget-not-draggable',
                            draggable: {
                                items: ".gs_w:not(.widget-not-draggable)"
                            }
                        }).data('gridster');

                        
                        //add widgets to gridster
                        _.each(self.timeslots(), function(timeslot, timeslotIndex) {
                            _.each(timeslot.bookings, function(booking) {

                                self.gridster.add_widget(
                                    "<li class='widget-booking'>" + booking.session.title + '</li>',
                                    null, //sizex
                                    null, //sizey
                                    booking.room.slotIndex + 2,
                                    timeslotIndex + 2
                                );
                            });
                        });
                    });
                });
            });
            
            //get rooms for given day
            programService.getRoomsAsync(1).then(function (rooms) {
                self.rooms(_.sortBy(rooms, function (room) { return room.slotIndex; }));
            });
            
            //get all sessions
            registrationService.getSessionsAsync().then(function(sessions) {
                self.sessions(_.map(sessions, function (session) {
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
            programService.setSessionPublic(session.id, true).then(function(response) {
                session.isPublic(true);
            });
        },
        deactivateSession: function(session) {
            programService.setSessionPublic(session.id, false).then(function(response) {
                session.isPublic(false);
            });
        }

    };
});