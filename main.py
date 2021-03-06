import os
import re
from flask import Flask, render_template, Response, send_from_directory, session, request, flash, redirect, url_for
from flask_socketio import SocketIO, emit
import json
import time
from werkzeug.utils import secure_filename
import threading
import uuid

if os.path.exists("secrets.json"):
    print("Found secrets.json")
    secrets = json.load(open("secrets.json"))
else:
    print("secrets.json not found. Creating secrets.json.")
    secrets = {
        "app_secret": str(uuid.uuid4())
    }
    json.dump(secrets, open("secrets.json","w"))

if not os.path.exists(".videos"):
    print(".videos directory not found. Creating .videos.")
    os.mkdir(".videos")

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '.videos'
app.secret_key = secrets["app_secret"]
socketio = SocketIO(app, async_mode=None)

ALLOWED_EXTENSIONS = {'mp4'}
connected_list = []
host_id = ""
time_ask_complete = True
current_time = 0
current_link = ""
current_src_type = "file"

current_video_id = -1

if len(os.listdir(".videos")) > 1:
    for f in os.listdir(".videos"):
        if re.fullmatch("\d*\.mp4", f) is not None and current_video_id == -1:
            current_video_id = int(f.split(".")[0])
        else:
            os.remove(".videos/" + f)
elif len(os.listdir(".videos")) == 0:
    current_video_id = 0
elif len(os.listdir(".videos")) == 1:
    try:
        current_video_id = int(os.listdir(".videos")[0].split(".")[0])
    except:
        current_video_id = 0


@app.route('/assets/<path>')
def send_assets(path):
    return send_from_directory('assets', path)


@app.route('/css/<path>')
def send_style(path):
    return send_from_directory('css', path)


@app.route('/js/<path>')
def send_js(path):
    return send_from_directory('js', path)


@app.route('/.videos/<path>')
def send_videos(path):
    return send_from_directory('.videos', path)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/sync')
def sync():
    mode = request.args.get("mode")
    id = request.args.get("id")
    if mode == "pause":
        broadcast("pause", id)
    elif mode == "play":
        broadcast("play", id)
    elif mode == "seek":
        try:
            time = request.args.get("time")
        except:
            return "Requires time and ID for seeking."
        broadcast("seek", time + "-" + id)
    return Response(status=200)


@app.route('/timesync')
def time_sync():
    global host_id
    global current_time
    global time_ask_complete
    if "value" in request.args and request.args.get("id") == host_id:
        current_time = float(request.args.get("value"))
        time_ask_complete = True
    elif host_id == "":
        return "0"
    elif host_id != request.args.get("id"):
        broadcast("ask_time", host_id)
        time_waited = 0
        time_ask_complete = False
        while not time_ask_complete or time_waited > 0.5:
            time.sleep(0.1)
            time_waited += 0.1
        if time_waited > 0.5:
            host_id = ""
            return "0"
        return str(current_time)
    else:
        return "0"
    return Response(status=200)

@app.route('/time')
def saveload_time():
    if "value" in request.args:
        session["time"] = request.args.get("value")
        return Response(status=200)
    if "time" in session:
        return session["time"]
    else:
        return "0"

@app.route('/register')
def register_user():
    global host_id
    id = request.args.get("id")
    if id not in connected_list:
        connected_list.append(id)
        print("Registered " + id)
    else:
        print(id + " is already registered.")
    if host_id == "" or ("host" in request.args and request.args.get("host") == "true"):
        assign_host(id)
    return Response(status=200)


def assign_host(id):
    global host_id
    host_id = id
    print("Registered " + id + " as host.")
    broadcast("host_declaration", host_id)


@app.route('/count')
def count_connected():
    return str(len(connected_list))


@app.route('/src')
def getsrc():
    if current_src_type == "file":
        files = os.listdir(".videos")
        for f in files:
            if f == str(current_video_id) + ".mp4":
                return json.dumps({"src": f, "type": "file"})
        return json.dumps({"src": files[0], "type":"file"})
    elif current_src_type == "link":
        return json.dumps({"src": current_link, "type":"link"})

@app.route('/link')
def setlink():
    global current_src_type
    global current_link
    if "v" in request.args:
        current_link = request.args.get("v")
        current_src_type = "link"
        broadcast("refresh_video", current_link)
        return Response(status=200)
    return Response(status=422)


@app.route('/id')
def giveid():
    if "id" not in session:
        session["id"] = str(uuid.uuid4())
    return session["id"]


def role_call():
    connected_list.clear()
    broadcast("role_call", "")


@app.route('/', methods=['GET', 'POST'])
def index():
    global current_video_id
    global current_src_type
    global current_link
    if request.method == 'POST':
        print("Uploading file...")
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        print(file.filename)
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            print("File verified. Saving.")
            filename = secure_filename(file.filename)
            if os.path.exists(".videos/" + str(current_video_id) + ".mp4"):
                os.remove(".videos/" + str(current_video_id) + ".mp4")
            current_video_id += 1
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], str(current_video_id) + ".mp4"))
            current_src_type = "file"
            broadcast("refresh_video", str(current_video_id) + ".mp4")
            return render_template('index.html', sync_mode=socketio.async_mode)
    else:
        return render_template('index.html', sync_mode=socketio.async_mode)


@socketio.on("connect")
def connection():
    role_call()
    broadcast("host_declaration", host_id)
    print("Connected a user.")


@socketio.on('disconnect')
def disconnect():
    role_call()
    broadcast("host_declaration", host_id)
    print('A user disconnected')


def broadcast(type, data):
    socketio.emit(type, data, broadcast=True)


def check_host_timer():
    if host_id not in connected_list and len(connected_list) > 0:
        assign_host(connected_list[0])
    threading.Timer(3, check_host_timer).start()


if __name__ == '__main__':
    threading.Timer(3, check_host_timer).start()
    socketio.run(app, host="0.0.0.0", debug=True)
