define(['durandal/app', 'services/programService', 'knockout', 'moment', 'utils/gridster-utils'], function (app, programService, ko, moment, utils) {

    var pub = {},
        priv = {};

    pub.program = ko.observableArray([]);
    pub.rooms = ko.observableArray([]);
    pub.displayName = 'Program';

    priv.gridster = null;
    priv.gridster_margins = [5, 5];
    priv.prev_grid_position = 0;

    pub.activate = function () {
        //get rooms for given day
        programService.getRoomsAsync(1).then(function (rooms) {

            pub.rooms(_.sortBy(rooms, function (room) { return room.slotIndex; }));

            //get bookings and embedded data
            programService.getDayWithTimeSlots(1).then(function (day) {
                programService.fillBookingsForDay(day).done(function () {
                    programService.fillEmbeddedInfo(day).done(function () {

                        pub.program(_.map(day.timeslots, function (timeslot) {
                            return {
                                id: timeslot.id,
                                displayTime: moment(timeslot.startTime).format('HH:mm') + '-' + moment(timeslot.endTime).format('HH:mm'),
                                bookings: _.sortBy(timeslot.bookings, function(b) { return b.room.slotIndex; })
                                };
                        }));

                    });
                });
            });
        });

    };
    
    //custom serialize function for gridster
    priv.gridSerialize = function ($w, wgd) {

        if (wgd.col <= pub.rooms().length + 1 && wgd.col > 1
            && wgd.row <= pub.program().length + 1 && wgd.row > 1) {

            return {
                bookingId: parseInt($w.attr('data-booking-id')),
                sessionId: parseInt($w.attr('data-session-id')),
                timeslotId: priv.gridster.gridmap[1][wgd.row].attr('data-timeslot-id'),
                roomId: _.first(_.where(pub.rooms(), { slotIndex: wgd.col - 2 })).id,
                dayId: 1,
                el: $w[0] //for testing
            };
        }

        return null;
    };

    //helper function to figure out grid-offset
    pub.gridOffset = function (slots, index) {
        if (index() == 0) {
            priv.prev_grid_position = slots[index()].room.slotIndex;
            return "col-md-offset-" + priv.prev_grid_position;
        }
        else {
            var slotIndex = slots[index()].room.slotIndex;
            var css = "col-md-offset-" + (slotIndex - (self.prev_grid_position + 1));
            priv.prev_grid_position = slotIndex;

            return css;
        }
    };

    pub.showFullInformation = function (obj) {
        var content = obj.session.description;
        if (obj.session.tags !== '') content += "\n\n" + obj.session.tags;
        
        return app.showMessage(content, obj.session.title, ['Ok']);
    };

    return pub;
});