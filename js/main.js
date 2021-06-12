$('[data-toggle="tooltip"]').tooltip();

var socket = null
var id = ""
var ignoreNextSeek = false
var ignoreNextPlay = false
var ignoreNextPause = false
var saveTime = 0
var isHost = false
var isMobile = /Mobi/i.test(window.navigator.userAgent)
var isBackground = false
$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: '/id',
        success: function (response) {
            id = response
            console.log(id)
        },
        error: function (response) {

        }
    });
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
                url: '/timesync?id=' + id + '&value=' + player.currentTime().toString(),
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
            isHost = true
        } else {
            document.getElementById("host_button").innerText = "REGISTER AS HOST"
            document.getElementById("host_button").classList.remove("off")
            isHost = false
        }
    })
    socket.on('refresh_video', function (message) {
        refreshplayer()
        console.log("Refreshed video.")
    })
    syncToHost()
    updateViewerCount()
    refreshplayer()
    displaysavetime()
})

function syncToHost() {
    if (!isHost) {
        $.ajax({
            type: "GET",
            url: '/timesync?id=' + id,
            success: function (response) {
                ignoreNextSeek = true
                player.currentTime(parseFloat(response))
            },
            error: function (response) {

            }
        });
    }
}

if (isMobile) {
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === 'visible') {
            isBackground = false
        } else {
            isBackground = true
        }
    })
}


function savetime() {
    $.ajax({
        type: "GET",
        url: '/time?value=' + player.currentTime().toString(),
        success: function (response) {
            Swal.fire({
                position: 'top',
                icon: 'success',
                title: 'Time saved successfully',
                showConfirmButton: false,
                timer: 2000,
                toast: true,
                customClass: {
                    border: '5px solid black'
                }
            })
            displaysavetime()
        },
        error: function (response) {

        }
    });
}

function seeksavetime() {
    seek(saveTime)
}

function displaysavetime() {
    $.ajax({
        type: "GET",
        url: '/time',
        success: function (response) {
            saveTime = parseFloat(response)
            document.getElementById("goto").innerText = new Date(parseFloat(response) * 1000).toISOString().substr(11, 8)
        },
        error: function (response) {

        }
    });
}

function refreshplayer() {
    $.ajax({
        type: "GET",
        url: '/file',
        success: function (response) {
            player.src({src: '../.videos/' + response, type: 'video/mp4'});
            player.load()
            console.log("Refreshed video.")
        },
        error: function (response) {

        }
    });

}

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
    if (!ignoreNextPause && (!isMobile || !isBackground)) {
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
    if (!ignoreNextPlay && (!isMobile || !isBackground)) {
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
        syncToHost()
    } else {
        ignoreNextPlay = false
    }
})

player.on('seeked', function (event) {
    if (!ignoreNextSeek && (!isMobile || !isBackground)) {
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