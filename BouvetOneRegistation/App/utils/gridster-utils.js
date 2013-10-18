define([], function () {
    return {

        findObjectByElement: function (serializedGridster, element) {
            serializedGridster = _.filter(serializedGridster, function (val) {
                return val !== null
            });

            return _.first(_.where(serializedGridster, { el: element }));
        },

        serialize_without_draggable: function ($w, wgd) {
            if ($w.hasClass('widget-not-draggable') === false) {
                return serialize($w, wgd);
            }
            return null;
        },

        //custom serialize function for gridster
        serialize_with_draggable: function ($w, wgd, gridster, rooms, timeslots) {
            if (wgd.col <= rooms.length + 1
                && wgd.row <= timeslots.length + 1 && gridster.gridmap[1][wgd.row]) {

                return {
                    bookingId: parseInt($w.attr('data-booking-id')),
                    sessionId: parseInt($w.attr('data-session-id')),
                    timeslotId: gridster.gridmap[1][wgd.row].attr('data-timeslot-id'),
                    roomId: _.first(_.where(rooms, { slotIndex: wgd.col - 2 })).id,
                    dayId: 1,
                    el: $w[0] //for testing
                };
            }

            return null;
        }
    }
    
});