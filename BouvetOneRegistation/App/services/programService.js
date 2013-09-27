define(['plugins/http', 'MobileServiceClient', 'jquery'], function(http, client, $) {
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
    self.getDayWithTimeSlots = function (dayIndex, callback) {
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
        var requests = [],
            deferred = $.Deferred();

        _.each(day.timeslots, function (timeslot, index) {

            requests.push(client.getTable('Booking')
                .where({timeslotId: timeslot.id})
                .read()
                .then(function (bookings) {
                    console.log('got booking');
                    timeslot.bookings = bookings;

                    _.each(timeslot.bookings, function(booking) {
                        self.getSession(booking.sessionId).then(function (session) {
                            booking.session = session;
                        });
                        self.getRoom(booking.roomId).then(function (room) {
                            booking.room = room;
                        });
                    });
                }));
        });

        $.when.apply( $, requests ).then(function() {
            console.log('resolving');
            deferred.resolve();
        });

        return deferred.promise();
    }

    self.getSession = function (id) {
        return client.getTable('Session')
            .where({id: id})
            .read().then(function (session) {
                return _.first(session);
            });
    };

    self.getRoom = function (id) {
        return client.getTable('Room')
            .where({id: id})
            .read().then(function (room) {
                return _.first(room);
            });
    }

    self.getRoomsAsync = function (dayId) {
        return client.getTable('Room').where({eventdayId: dayId}).read();
    }

    return self;
});