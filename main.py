from flask import Flask, render_template, Response, send_from_directory, session, request
import json

app = Flask(__name__)
app.secret_key = 'jeV43V1KTG0ywgO1VGOdUfWzIiU51KoLYcrAIqdtpd7ukQC8LOKSgSjC2fvT'.encode('utf8')


@app.route('/assets/<path>')
def send_assets(path):
    return send_from_directory('assets', path)

@app.route('/assets/icons/<path>')
def send_icons(path):
    return send_from_directory('assets/icons', path)


@app.route('/css/<path>')
def send_style(path):
    return send_from_directory('css', path)


@app.route('/js/<path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route('/')
def index():
    return render_template("index.html")

if __name__ == '__main__':
    app.run(host="0.0.0.0")
