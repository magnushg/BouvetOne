define(['durandal/app', 'services/registrationService', 'knockout'], function(app, registrationService, ko) {
    var self = this;
    self.displayName = 'Program';
    self.test = ko.observable('test');
    self.timerows = ko.observableArray([]);
    self.rooms = ko.observableArray([]);

    self.activate = function() {
        //todo: theres no support for multiple event-days

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
        
        //get rooms for given day
        registrationService.getRooms().then(function(rooms) {
            self.rooms(rooms);
        });
    };
    
    //helper function to figure out grid-offset
    self.gridOffset = function (index, slotIndex) {
        var css = "col-lg-offset-" + (ko.utils.unwrapObservable(slotIndex) - ko.utils.unwrapObservable(index));
        return css;
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