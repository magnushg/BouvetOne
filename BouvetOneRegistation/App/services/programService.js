define(['plugins/http', 'MobileServiceClient', 'jquery'], function(http, client, $) {
    var self = {};
    
    self.getDayWithTimeSlots = function (dayIndex) {
        return client.getTable('EventDay')
            .where({id: dayIndex})
            .read().then(function (day) {
                day = _.first(day);
                var dayItem = {name: day.name};

                return client.getTable('TimeSlot')
                    .where({ eventdayId: day.id })
                    .read().then(function(timeslots) {
                        dayItem.timeslots = timeslots;

                        dayItem.timeslots = _.map(timeslots, function(timeslot) {
                            return {
                                id: timeslot.id,
                                startTime: timeslot.endTime,
                                endTime: timeslot.endTime
                            };
                        });

                        return dayItem;
                    });
            });
    };

    self.fillBookingsForDay = function(day) {
        var bookingPromises = [],
            deferred = Q.defer();

        _.each(day.timeslots, function(timeslot, index) {

            var bookingPromise = client.getTable('Booking').where({ timeslotId: timeslot.id }).read();
            bookingPromises.push(bookingPromise);

            bookingPromise.then(function(bookings) {
                timeslot.bookings = bookings;
            });
        });

        Q.all(bookingPromises).then(function() {
            deferred.resolve(day);
        });

        return deferred.promise;
    };

    self.fillEmbeddedInfo = function(day) {
        var promises = [],
            deferred = Q.defer();

        _.each(day.timeslots, function(timeslot) {
            _.each(timeslot.bookings, function(booking) {

                promises.push(client.getTable('Session').where({ id: booking.sessionId }).read().then(function(session) {
                    booking.session = _.first(session);
                }));
                promises.push(client.getTable('Room').where({ id: booking.roomId }).read().then(function(room) {
                    booking.room = _.first(room);
                }));
            });
        });

        Q.all(promises).then(function() {
            deferred.resolve(day);
        });

        return deferred.promise;
    };

    self.getSession = function (id) {
        return client.getTable('Session')
            .where({id: id})
            .read().then(function (session) {
                return _.first(session);
            });
    };

    self.getRoom = function(id) {
        return client.getTable('Room')
            .where({ id: id })
            .read().then(function(room) {
                return _.first(room);
            });
    };

    self.getRoomsAsync = function(dayId) {
        return client.getTable('Room').where({ eventdayId: dayId }).read();
    };

    return self;
});