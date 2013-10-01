define(['durandal/app', 'services/programService', 'services/registrationService'], function (app, programService, registrationService) {
    var self = this;
    self.displayName = 'Administrator';
    self.timeslots = ko.observableArray([]);
    self.rooms = ko.observable();
    self.gridster = null;
    self.col_width = 140;
    self.row_height = 45;
    self.sessions = ko.observable();

    self.timeslotsLength = ko.computed(function() {
        return self.timeslots().length;
    });
    
    return {
        activate: function () {        
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
                            max_cols: self.rooms().length,
                            max_rows: self.timeslots().length
                        }).data('gridster');


                        //add widgets to gridster
                        _.each(self.timeslots(), function(timeslot, timeslotIndex) {
                            _.each(timeslot.bookings, function(booking) {

                                self.gridster.add_widget(
                                    '<li>' + booking.session.title + '</li>',
                                    null, //sizex
                                    null, //sizey
                                    booking.room.slotIndex + 1,
                                    timeslotIndex + 1
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
        }
    };
});