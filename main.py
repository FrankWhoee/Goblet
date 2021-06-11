from flask import Flask, render_template, Response, send_from_directory, session, request
from flask_socketio import SocketIO, emit
import json

app = Flask(__name__)
app.secret_key = 'jeV43V1KTG0ywgO1VGOdUfWzIiU51KoLYcrAIqdtpd7ukQC8LOKSgSjC2fvT'.encode('utf8')
socketio = SocketIO(app, async_mode=None)


@app.route('/assets/<path>')
def send_assets(path):
    return send_from_directory('assets', path)


@app.route('/css/<path>')
def send_style(path):
    return send_from_directory('css', path)


@app.route('/js/<path>')
def send_js(path):
    return send_from_directory('js', path)


@app.route('/videos/<path>')
def send_videos(path):
    return send_from_directory('videos', path)


@app.route('/sync')
def sync():
    mode = request.args.get("mode")
    id = request.args.get("id")
    if mode == "pause":
        broadcast("pause",id)
    elif mode == "play":
        broadcast("play",id)
    elif mode == "seek":
        try:
            time = request.args.get("time")
        except:
            return "Requires time and ID for seeking."
        broadcast("seek",time + "-" + id)
    return Response(status=200)


@app.route('/')
def index():
    return render_template('index.html',
                           sync_mode=socketio.async_mode)


@socketio.on("connect")
def connection():
    print("Connected a user.")


@socketio.on('disconnect')
def disconnect():
    print('A user disconnected')


def broadcast(type, data):
    socketio.emit(type, data, broadcast=True)


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", debug=True)
