define(['knockout'],function(ko) {
    var EditRegistration = function (session, levels) {

        $.extend(this, {
            title: ko.unwrap(session.title),
            description: ko.unwrap(session.description),
            level: ko.unwrap(session.level)
        });

        this.levels = levels;

        this.options = ['Lagre', 'Avbryt'] || MessageBox.defaultOptions;
    };

    EditRegistration.prototype.selectOption = function(dialogResult) {
        this.__dialog__.close(this, dialogResult === "Lagre");
    };

    return EditRegistration;
});