$('[data-toggle="tooltip"]').tooltip();

var socket = null
var id = ""
var ignoreNextSeek = false
var ignoreNextPlay = false
var ignoreNextPause = false
$(document).ready(function () {
    for (i = 0; i < 50; i++) {
        id += String.fromCharCode(96 + Math.round(Math.random(26) * 26))
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
    socket.on('role_call', function (message) {
        $.ajax({
            type: "GET",
            url: '/register?id=' + id,
            success: function (response) {

            },
            error: function (response) {

            }
        });
    })
    socket.on('ask_time', function (message) {
        if (message === id) {
            $.ajax({
                type: "GET",
                url: '/time?id=' + id + '&value=' + player.currentTime().toString(),
                success: function (response) {

                },
                error: function (response) {

                }
            });
        }
    })
    socket.on('host_declaration', function (message) {
        if (message === id) {
            document.getElementById("host_button").innerText = "YOU ARE HOST"
            document.getElementById("host_button").classList.add("off")
        } else {
            document.getElementById("host_button").innerText = "REGISTER AS HOST"
            document.getElementById("host_button").classList.remove("off")
        }
    })
    socket.on('refresh_video', function (message) {
        player.src({src: '../videos/current.mp4', type: 'video/mp4'});
        player.load()
        console.log("Refreshed video.")
    })
    $.ajax({
        type: "GET",
        url: '/time?id=' + id,
        success: function (response) {
            ignoreNextSeek = true
            player.currentTime(parseInt(response))
        },
        error: function (response) {

        }
    });
    updateViewerCount()
    player.src({src: '../videos/current.mp4', type: 'video/mp4'});
    player.load()
    console.log("Refreshed video.")
})

function setViewerCount(count) {
    document.getElementById("viewers").innerText = count
    if (parseInt(count) !== 1) {
        document.getElementById("stupid").innerText = "VIEWERS"
    } else {
        document.getElementById("stupid").innerText = "VIEWER"
    }
}

function registerAsHost() {
    $.ajax({
        type: "GET",
        url: '/register?id=' + id + "&host=true",
        success: function (response) {
            Swal.fire({
                position: 'top',
                icon: 'success',
                title: 'Registration as host successful',
                showConfirmButton: false,
                timer: 2000,
                toast: true,
                customClass: {
                    border: '5px solid black'
                }
            })
            document.getElementById("host_button").innerText = "YOU ARE HOST"
            document.getElementById("host_button").classList.add("off")
        },
        error: function (response) {

        }
    });
}

function updateViewerCount() {
    $.ajax({
        type: "GET",
        url: '/count',
        success: function (response) {
            setViewerCount(response)
            setTimeout(updateViewerCount, 2500)
        },
        error: function (response) {

        }
    });
}

var player = videojs("main")

player.on('pause', function (event) {
    if (!ignoreNextPause) {
        $.ajax({
            type: "GET",
            url: '/sync?mode=pause&id=' + id,
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
    } else {
        ignoreNextPause = false
    }
})

player.on('play', function (event) {
    if (!ignoreNextPlay) {
        $.ajax({
            type: "GET",
            url: '/sync?mode=play&id=' + id,
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
    } else {
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
    } else {
        ignoreNextSeek = false
    }
})

function resetPlayPauseFlags() {
    ignoreNextPause = false
    ignoreNextPlay = false
}

function seek(time) {
    player.currentTime(time);
    ignoreNextSeek = true
}

function pause() {
    player.pause()
    ignoreNextPause = true
    setTimeout(resetPlayPauseFlags, 100)
}

function play() {
    player.play()
    ignoreNextPlay = true
    setTimeout(resetPlayPauseFlags, 100)
}