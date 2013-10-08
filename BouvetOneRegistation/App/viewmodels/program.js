define(['durandal/app', 'services/programService', 'knockout','moment'], function(app, programService, ko, moment) {
    var self = this;
    self.displayName = 'Program';
    self.test = ko.observable('test');
    self.program = ko.observableArray([]);
    self.rooms = ko.observableArray([]);
    self.col_width = 200;
    self.row_height = 45;
    self.columnClass = ko.computed(function() {
        return "col-md-2";
    });
    self.prev_grid_position = 0;
    
    //helper for adding a booking as a gridster widget
    self.addWidget = function (session, booking, timeslotIndex) {
        var el = $("<li></li>").text(session.title)
            .addClass('widget-not-draggable')
            .attr('data-session-id', session.id);

        if (booking != null) {
            el.attr('data-booking-id', booking.id);
            self.gridster.add_widget(el, null, null, booking.room.slotIndex + 2, timeslotIndex + 2);
        } else {
            self.gridster.add_widget(el, null, null, self.rooms().length + 2, 2);
        }

        return el;
    };
    
    self.activate = function() {
        programService.getDayWithTimeSlots(1).then(function (day) {
            programService.fillBookingsForDay(day).done(function () {
                programService.fillEmbeddedInfo(day).done(function () {

                    self.program(_.map(day.timeslots, function (timeslot) {
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
                        max_cols: self.rooms().length + 1,
                        max_rows: self.rooms().length + 1,
                        static_class: 'widget-not-draggable',
                        draggable: {
                            items: ".gs_w:not(.widget-not-draggable)"
                        },
                        serialize_params: self.gridSerialize,
                    }).data('gridster');
                    
                    //add booked sessions to gridster
                    _.each(self.program(), function (timeslot, timeslotIndex) {
                        _.each(timeslot.bookings, function (booking) {
                            self.addWidget(booking.session, booking, timeslotIndex);
                        });
                    });
                });
            });
        });

        //get rooms for given day
        programService.getRoomsAsync(1).then(function(rooms) {
            self.rooms(_.sortBy(rooms, function (room) { return room.slotIndex; }));
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

    return {
        activate: self.activate,
        displayName: 'Program'
    };
});