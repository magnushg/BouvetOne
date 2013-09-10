define(['durandal/app', 'services/registrationService', 'knockout'], function(app, registrationService, ko) {
    var self = this;
    self.displayName = 'Program';
    self.timeslots = [];
    
    self.activate = function() {
        registrationService.getProgram().then(function(timeslots) {
            self.timeslots = timeslots;
        });
    };

    return self;
});