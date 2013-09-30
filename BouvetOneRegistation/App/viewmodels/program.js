define(['durandal/app', 'services/programService', 'knockout','moment'], function(app, programService, ko, moment) {
    var self = this;
    self.displayName = 'Program';
    self.test = ko.observable('test');
    self.timeslots = ko.observableArray([]);
    self.rooms = ko.observableArray([]);
    self.columnClass = ko.computed(function() {
        return "col-md-2";
    });
    self.prev_grid_position = 0;
    
    self.activate = function() {
        //todo: theres no support for multiple event-days
        programService.getDayWithTimeSlots(0).then(function (day) {
            programService.fillBookingsForDay(day).done(function () {
                programService.fillEmbeddedInfo(day).done(function () {

                    self.timeslots(_.map(day.timeslots, function (timeslot) {
                        return {
                            id: timeslot.id,
                            startTime: moment(timeslot.startTime).format('HH:mm'),
                            endTime: moment(timeslot.endTime).format('HH:mm'),
                            bookings: timeslot.bookings
                        }
                    }));
                });
            });
        });

        //get rooms for given day
        programService.getRoomsAsync(1).then(function(rooms) {
            self.rooms(_.sortBy(rooms, function (room) { return room.slotIndex}));
        });
    };

    //helper function to figure out grid-offset
    self.gridOffset = function (slots, index) {
        if (index() == 0) {
            self.prev_grid_position = slots[index()].room.slotIndex;
            return "col-md-offset-" + self.prev_grid_position * 2;
        }
        else {
            var slotIndex = slots[index()].room.slotIndex;
            var css = "col-md-offset-" + (slotIndex - (self.prev_grid_position + 1)) * 2;
            self.prev_grid_position = slotIndex;

            return css;
        }
    };

    var _formatTime = function(date) {
        var hr = date.getHours(),
            min = date.getMinutes();
        hr = hr < 10 ? "0" + hr : hr;
        min = min < 10 ? "0" + min : min;
        return hr + ":" + min;
    };

    return self;
});