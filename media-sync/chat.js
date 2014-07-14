var colorPool = ["#ecc132", "#ed5548", "#1abc9c", "#3498db", "#ad4ede"];
var systemColor = "#555555";

$("#header-area h1").dblclick(function() {
    console.log("Double click!")
    $("#header-area h1").hide();
    $("#header-area").append("<input class='title-edit'></input>");
    var inputField =  $("#header-area input");
    inputField.val($("#header-area h1").text());
    inputField.autoGrowInput().focus().select();
    
    var saveTitle = function(e) {
        if (e.which) {
            if (!(e.which == 13)) {
                return;
            }
        }
        if (inputField.val().trim().length > 1) {
            $("#header-area h1").text(inputField.val()).show();
            inputField.remove();
        } else {
            $("#header-area h1").show()
            inputField.remove();
        }
    }
    
    inputField.blur(saveTitle);
    inputField.on("keydown", saveTitle);
});