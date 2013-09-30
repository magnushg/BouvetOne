define(['durandal/app', 'services/programService'], function (app, programService) {
    var self = this;
    self.displayName = 'Administrator';
    self.timeslots = ko.observableArray([]);

    /*
    self.
    };
    */
    return {
        activate: function() {
            programService.getDayWithTimeSlots(1).then(function(day) {
                programService.fillBookingsForDay(day).done(function() {
                    programService.fillEmbeddedInfo(day).done(function() {

                        self.timeslots(_.map(day.timeslots, function(timeslot) {
                            return {
                                id: timeslot.id,
                                displayTime: moment(timeslot.startTime).format('HH:mm') + '-' + moment(timeslot.endTime).format('HH:mm'),
                                bookings: timeslot.bookings
                            };
                        }));
                    });
                });
            });
        }
    };
});