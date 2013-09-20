define(['plugins/http', 'MobileServiceClient'], function(http, client) {
    var self = {};

    /*
    -  program structure
      {
        name: day name,
        timeslots:
        [
            {
                startTime,
                endTime,
                id,
                booking:
                {
                    room,
                    roomIndex,
                    session
                }
            }
        ]
      }
     */
    self.getDayWithTimeSlots = function (dayIndex) {
        return client.getTable('EventDay')
            .where({index: dayIndex})
            .read().then(function (day) {
                day = _.first(day);
                var dayItem = {name: day.name};

                return client.getTable('TimeSlot')
                    .where({eventdayId: day.id})
                    .read().then(function (timeslots) {
                        dayItem.timeslots = timeslots;

                        dayItem.timeslots = _.map(timeslots, function (timeslot) {
                            return {
                                id: timeslot.id,
                                startTime: timeslot.endTime,
                                endTime: timeslot.endTime
                            }
                        });

                        return dayItem;
                    })
            });
    };

    self.fillBookingsForDay = function (day) {
        _.each(day.timeslots, function (timeslot) {
            client.getTable('Booking')
                .where({timeslotId: timeslot.id})
                .read().then(function (booking) {
                    timeslot.booking = _.first(booking);

                    client.getTable('Session')
                        .where({id: timeslot.booking.sessionId})
                        .read().then(function (session) {
                            timeslot.booking.session = _.first(session);
                        }).then(client.getTable('Room')
                            .where({id: timeslot.booking.roomId})
                            .read().then(function (room) {
                                timeslot.booking.room = _.first(room);
                            })
                        );
                });
      });
    }

    self.getRoomsAsync = function (dayId) {
        return client.getTable('Room').where({eventdayId: dayId}).read();
    }

    return self;
});