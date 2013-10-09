﻿define(['durandal/app', 'services/programService', 'knockout','moment'], function(app, programService, ko, moment) {
    
    var program = ko.observableArray([]),
        rooms = ko.observableArray([]),
        col_width = 200,
        row_height = 45,
        prev_grid_position = 0;
        
    var columnClass = ko.computed(function() {
        return "col-md-2";
    });
    
    //helper for adding a booking as a gridster widget
    var addWidget = function (session, booking, timeslotIndex) {
        var el = $("<li></li>").text(session.title)
            .addClass('widget-not-draggable')
            .attr('data-session-id', session.id);

        if (booking != null) {
            el.attr('data-booking-id', booking.id);
            gridster.add_widget(el, null, null, booking.room.slotIndex + 2, timeslotIndex + 2);
        } else {
            gridster.add_widget(el, null, null, rooms().length + 2, 2);
        }

        return el;
    };
    
    var activate = function() {
        programService.getDayWithTimeSlots(1).then(function (day) {
            programService.fillBookingsForDay(day).done(function () {
                programService.fillEmbeddedInfo(day).done(function () {

                    program(_.map(day.timeslots, function (timeslot) {
                        return {
                            id: timeslot.id,
                            displayTime: moment(timeslot.startTime).format('HH:mm') + '-' + moment(timeslot.endTime).format('HH:mm'),
                            bookings: timeslot.bookings
                        };
                    }));
                    
                    //initialize gridster
                    gridster = $('.gridster ul').gridster({
                        widget_margins: [5, 5],
                        widget_base_dimensions: [col_width, row_height],
                        avoid_overlapped_widgets: true,
                        max_cols: rooms().length + 1,
                        max_rows: rooms().length + 1,
                        static_class: 'widget-not-draggable',
                        draggable: {
                            items: ".gs_w:not(.widget-not-draggable)"
                        }
                    }).data('gridster');
                    
                    //add booked sessions to gridster
                    _.each(program(), function (timeslot, timeslotIndex) {
                        _.each(timeslot.bookings, function (booking) {
                            addWidget(booking.session, booking, timeslotIndex);
                        });
                    });
                });
            });
        });

        //get rooms for given day
        programService.getRoomsAsync(1).then(function(rooms) {
            rooms(_.sortBy(rooms, function (room) { return room.slotIndex; }));
        });
    };

    //helper function to figure out grid-offset
    var gridOffset = function (slots, index) {
        if (index() == 0) {
            prev_grid_position = slots[index()].room.slotIndex;
            return "col-md-offset-" + prev_grid_position * 2;
        }
        else {
            var slotIndex = slots[index()].room.slotIndex;
            var css = "col-md-offset-" + (slotIndex - (prev_grid_position + 1)) * 2;
            prev_grid_position = slotIndex;

            return css;
        }
    };

    return {
        activate: activate,
        displayName: 'Program',
        program: program,
        rooms: rooms
    };
});