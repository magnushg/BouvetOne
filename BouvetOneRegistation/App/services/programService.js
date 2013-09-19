define(['plugins/http', 'MobileServiceClient'], function(http, client) {
    var self = {};
    self.getProgram = function (dayIndex) {
        return client.getTable('EventDay')
            .where({index: dayIndex})
            .read().then(function (day) {
                day = _.first(day);
                var dayItem = {name: day.name};

                client.getTable('TimeSlot')
                    .where({eventdayId: day.id})
                    .read().then(function (timeslots) {

                        _.each(timeslots, function (timeslot, index) {
                            var timeslotItem = {};
                            dayItem.push(timeslotItem);

                            timeslotItem.id = timeslot.id;
                            timeslotItem.startTime =timeslot.endTime;
                            timeslotItem.endTime = timeslot.endTime;
                            timeslotItem.slots = [];

                            /*
                            client.getTable('Booking')
                                .where({timeslotId: timeslot.id})
                                .read().then(function (bookings) {

                                    _.each(bookings, function (booking, index) {
                                        client.getTable('Room')
                                            .lookup(booking.roomId)
                                            .read().then(function (room) {

                                                var booking = {};
                                                booking.locationName = room.name;
                                                booking.slotIndex = room.slotIndex;

                                                return client.getTable('Session')
                                                    .lookup(booking.sessionId)
                                                    .read().then(function (session) {
                                                        booking.session = session;
                                                        timeslotItem.slots.push(booking);
                                                    });
                                            });
                                    });
                                });

                            if (index === timeslots.length - 1) {
                                return dayItem;
                            }     */
                        });
                    })
            })
    };

    self.getRoomsAsync = function (dayId) {
        return client.getTable('Room').where({eventdayId: dayId}).read();
    }

    return self;
});