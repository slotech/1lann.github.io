var usernameError = function(error) {
    $("#username-field button").attr("disabled", false);
    $("#username-field button").text("Connect");
    $("#username-field input").attr("title", error);
    $("#username-field input").tooltip("show");
}

fatalError = usernameError;

$("#username-field button").click(function(e) {
    var usernameField = $("#username-field input");
    connect(usernameField.val(),function() {
        // Succesfully connected!
    });
    $(this).attr("disabled", true);
    $(this).text("Connecting...")
});

$("#username-field input").on("keyup", function(e) {
    if ($(this).val().length > 4 && $(this).val().length < 21) {
        $("#username-field button").attr("disabled", false);
        if (e.which == 13) {
            $("#username-field button").click();
        }
    } else {
        $("#username-field button").attr("disabled", true);
    }
});