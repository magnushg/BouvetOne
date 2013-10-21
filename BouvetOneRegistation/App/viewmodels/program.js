define(['durandal/app', 'services/programService', 'knockout', 'moment', 'utils/gridster-utils'], function (app, programService, ko, moment, utils) {

    var pub = {},
        priv = {};

    pub.program = ko.observableArray([]);
    pub.rooms = ko.observableArray([]);
    pub.displayName = 'Program';

    priv.gridster = null;
    priv.gridster_margins = [5, 5];

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
                                bookings: timeslot.bookings
                            };
                        }));

                        var g_el = $('.gridster ul');
                        var w_width = (g_el.width() / (pub.rooms().length + 1)) - priv.gridster_margins[0] * 2,
                            w_height = 45;

                        //initialize gridster
                        priv.gridster = g_el.gridster({
                            widget_margins: [5, 5],
                            widget_base_dimensions: [w_width, 45],
                            avoid_overlapped_widgets: true,
                            max_cols: pub.rooms().length + 1,
                            max_rows: pub.rooms().length + 1,
                            static_class: 'widget-not-draggable',
                            draggable: {
                                items: ".gs_w:not(.widget-not-draggable)"
                            },
                            serialize_params: priv.gridSerialize
                        }).data('gridster');

                        //add booked sessions to gridster
                        _.each(pub.program(), function (timeslot, timeslotIndex) {
                            _.each(timeslot.bookings, function (booking) {
                                priv.addWidget(booking.session, booking, timeslotIndex);
                            });
                        });
                    });
                });
            });
        });

    };

    //helper for adding a booking as a gridster widget
    priv.addWidget = function (session, booking, timeslotIndex) {
        var el = $("<li></li>").text(session.title)
            .addClass('widget-not-draggable')
            .addClass('widget-program-item')
            .attr('data-sizex', 1)
            .attr('data-sizey', 1)
            .attr('data-session-id', session.id);
        el.click(priv.showFullInformation);


        if (booking != null) {
            el.attr('data-booking-id', booking.id);
            priv.gridster.add_widget(el, null, null, booking.room.slotIndex + 2, timeslotIndex + 2);
        } else {
            priv.gridster.add_widget(el, null, null, rooms().length + 2, 2);
        }

        return el;
    };

    priv.showFullInformation = function (event) {
        var obj = utils.findObjectByElement(priv.gridster.serialize(), event.target);

        _.each(pub.program(), function (p) {
            var booking = _.first(_.where(p.bookings, { sessionId: obj.sessionId }));
            if (!_.isUndefined(booking)) {

                var content = booking.session.description;
                if (booking.session.tags !== void 0) {
                    content += "<br />" + booking.session.tags.toString();
                }

                return app.showMessage(content, booking.session.title, ['Ok']);
            }
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

    return pub;
});