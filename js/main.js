 $('[data-toggle="tooltip"]').tooltip();

$(document).ready(function() {
            socket = io()
})

function switchMode() {
    $.ajax({
        type: "GET",
        url: '/switchmode',
        success: function (response) {
            location.reload();
            Swal.fire({
                position: 'top',
                icon: 'success',
                title: 'Switching mode',
                showConfirmButton: false,
                timer: 5000,
                backdrop: false,
                toast: true,
                customClass: {
                    border: '5px solid black'
                }
            })
        },
        error: function (response) {
            Swal.fire({
                position: 'top',
                icon: 'error',
                title: 'Something went wrong!',
                showConfirmButton: false,
                timer: 5000,
                backdrop: false,
                toast: true,
                customClass: {
                    border: '5px solid black'
                }
            })
        }
    });
}

var player = videojs("main")

function seek(time){
    player.currentTime(time);
}

function pause(){
    player.pause()
}

function play(){
    player.play()

}