define(['durandal/app', 'services/programService', 'knockout'], function(app, programService, ko) {
    var self = this;
    self.displayName = 'Program';
    self.test = ko.observable('test');
    self.timerows = ko.observableArray([]);
    self.rooms = ko.observableArray([]);
    self.columnClass = ko.computed(function() {
        return "col-md-2";
    });
    self.prev_grid_position = 0;
    
    self.activate = function() {
        //todo: theres no support for multiple event-days
                  /*
        //get program
        registrationService.getProgram().then(function (timerows) {
            self.timerows(_.map(timerows, function (timerow) {
                var start = new Date(timerow.startTime);
                var end = new Date(timerow.endTime);
                
                return {
                    id: timerow.id,
                    startTime: _formatTime(start),
                    endTime: _formatTime(end),
                    slots: timerow.slots
                };
            }));
        });
                               */
        programService.getDayWithTimeSlots(0).then(function (day) {
            programService.fillBookingsForDay(day);
            self.timerows(day.timerows);
        });
        //get rooms for given day
        programService.getRoomsAsync(1).then(function(rooms) {
            self.rooms(_.sortBy(rooms, function (room) { return room.slotIndex}));
        });
    };

    //helper function to figure out grid-offset
    self.gridOffset = function (slots, index) {
        if (index() == 0) {
            self.prev_grid_position = slots[index()].slotIndex;
            return "col-md-offset-" + self.prev_grid_position * 2;
        }
        else {
            var slotIndex = slots[index()].slotIndex;
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