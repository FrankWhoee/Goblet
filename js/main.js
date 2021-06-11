$('[data-toggle="tooltip"]').tooltip();

var socket = null
var id = ""
var ignoreNextSeek = false
var ignoreNextPlay = false
var ignoreNextPause = false
$(document).ready(function () {
    for (i = 0; i < 50; i++) {
        id += String.fromCharCode(96 + Math.round(Math.random(25) * 25))
    }
    console.log(id)
    socket = io()
    socket.on('pause', function (message) {
        retrieved_id = message
        if (id !== retrieved_id) {
            pause()
        }
    })
    socket.on('play', function (message) {
        retrieved_id = message
        if (id !== retrieved_id) {
            play()
        }
    })
    socket.on('seek', function (message) {
        time = message.split("-")[0]
        retrieved_id = message.split("-")[1]
        if (id !== retrieved_id) {
            seek(parseInt(time))
        }
    })

})

var player = videojs("main")

player.on('pause', function (event) {

    if (!ignoreNextPause) {
        $.ajax({
            type: "GET",
            url: '/sync?mode=pause',
            success: function (response) {
                Swal.fire({
                    position: 'top',
                    icon: 'success',
                    title: 'Sync successful',
                    showConfirmButton: false,
                    timer: 2000,
                    toast: true,
                    customClass: {
                        border: '5px solid black'
                    }
                })
            },
            error: function (response) {

            }
        });
    }else{
        ignoreNextPause = false
    }
})

player.on('play', function (event) {

    if (!ignoreNextPlay) {
        $.ajax({
            type: "GET",
            url: '/sync?mode=play',
            success: function (response) {
                Swal.fire({
                    position: 'top',
                    icon: 'success',
                    title: 'Sync successful',
                    showConfirmButton: false,
                    timer: 2000,
                    toast: true,
                    customClass: {
                        border: '5px solid black'
                    }
                })
            },
            error: function (response) {

            }
        });
        player.currentTime(player.currentTime());
    }else{
        ignoreNextPlay = false
    }
})

player.on('seeked', function (event) {
    if (!ignoreNextSeek) {
        $.ajax({
            type: "GET",
            url: '/sync?mode=seek&time=' + player.currentTime().toString() + "&id=" + id,
            success: function (response) {
                Swal.fire({
                    position: 'top',
                    icon: 'success',
                    title: 'Sync successful',
                    showConfirmButton: false,
                    timer: 2000,

                    toast: true,
                    customClass: {
                        border: '5px solid black'
                    }
                })
            },
            error: function (response) {

            }
        });
    }else{
        ignoreNextSeek = false
    }
})

function seek(time) {
    player.currentTime(time);
    ignoreNextSeek = true
}

function pause() {
    player.pause()
    ignoreNextPause = true
}

function play() {
    player.play()
    ignoreNextPlay = true
}