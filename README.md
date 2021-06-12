![](https://raw.githubusercontent.com/FrankWhoee/Goblet/master/assets/logo-words.svg)
Don't trust random video watch party websites online? Host your own watch party platform 
with open source software you can trust. All you need is Python3 (and Linux, unless you know
what you're doing).

## Installation
1. Download and install Python3, as well as pip for Python3
2. Clone this repository
3. Run `./install`
4. Run `./run`
5. Your website should be up! Just go to https://0.0.0.0:5000 to see your own website. 
To share your website with friends, you can use port-forwarding, and if you don't
want to do that, you can use ngrok.

### Ngrok Installation
Because I know how lazy you are, I've included two free scripts with this steal of a deal.
To set up ngrok to share your server with your friends, all you have to do is:
1. `./ngrokinstall`
2. `./ngrokrun`

And you should now be able to see a temporary URL that you can share with your friends to 
use Goblet with. Keep in mind this URL will change the next time you run `./ngrokrun`, so
make sure your friends go to the latest ngrok link.  

## How does it work?
#### Front End (HTML/JS)
* [VideoJS](https://videojs.com/) to play the video
* [SweetAlert2](https://sweetalert2.github.io/#usage) for notifications
#### Back End (Python)
* [Flask-SocketIO](https://flask-socketio.readthedocs.io/en/latest/#) instead of plain old Flask because I needed Socket
to send data clientside, unprompted.
* [threading](https://docs.python.org/3/library/threading.html) to periodically reassign hosts
* [uuid](https://docs.python.org/3/library/uuid.html) to assign clients unique IDs for hosting and recursion prevention purposes

### Core Mechanism
Whenever a user pauses/plays/seeks the video, a GET request is sent to the server, which
informs it of the details of the action, and the server then broadcasts via the socket connection
to all clients to perform the same action on their video players.

### Fantastic Problems and How to Solve Them 🦁

#### Action Recursion 🔁

The main problem to solve is action recursion. Because every pause/play/seek action unavoidably triggers
a pause/play/seek action on another client, the same action will be sent back to the server, and then broadcasted again,
which creates an endless recursion of play/pause/seek. This problem can be solved if
the client can tell the difference between an action broadcasted by the server and 
an action triggered by the user themselves. However, since this was a two day project
and I can't be bothered to spend any more effort on it because it already works flawlessly,
I didn't spend any more than 1 hour searching to see if this is possible, so instead when a client
receives an action from the server, it will ignore the next action because it will have been
from itself playing/pausing/seeking. After solving this problem, the other ones are mostly QOL.

####  Host Syncing ↕️
Before making Goblet, my friends and I were using twoseven to host videos. This platform's
most annoying problem was the fact that whenever someone joined, it restarted the video.
This happened because to begin peforming play/pause/seek actions on VideoJS, you have to first
click the play button to start syncing with everyone else, but since when a new user plays a video,
the client broadcasts the video time and play action, everyone else is reset to the start of the video,
since that's where the new user is. To resolve this, a host must be picked so that whenever this new user joins,
they instead sync to the chosen host instead of syncing everyone else to them. To do this, we first
must assign IDs to all clients. My first solution involved the client generating an ID themselves, then
sending their ID to the server. This is a bad solution. Not only does the client lose its ID on refresh,
it's also probably exploitable. The better solution is to instead have the server 
generate, assign, and store IDs in Flask Session/cookies. Now the client just has to ask
the server for an ID everytime it loads up, and the ID will stay the same until cookies are cleared.
Since having a host is critical to preserving the video time, the first client that asks
for an ID since server start is assigned as host. If the hosts leaves, a role call will 
be broadcasted through the socket connection, and all clients must re-register their IDs,
and the first client to register will become the host. Because I'm too lazy to figure out
async, every three seconds the server will check if the host is still connected, and will
assign a new one. It would be possible to remove polling if there was some way to know if all 
connected clients have re-registered during role call, but since it works fine, I am not
changing it. Users can also choose to be host instead, if the party of friends has a preference
to who they want to sync to. Funnily enough, Goblet not only syncs new users when they click play
but all users. This is to hopefully prevent any desynchronization that happens, but it works fantastic
because non-hosts are still able to pause and play the video, as well as seek to where they want
if they want to show the party a particular moment, or if the host isn't there.

#### Upload Cache Problems 🔼
This was an unexpected problem to run into, but VideoJS or the browser likes to 
cache absolutely everything, so as long as you play a video with the same name, even if you 
changed the source, it will still play the old video. This incredibly frustrating issue was resolved
by just changing the name of the source everytime. The server keeps track of a number and everytime
a video is uploaded, the name of the video file is set to that number, and the number is incremented.
This way, VideoJS doesn't show the same video over and over again. If you're wondering
where the videos go, they go to the .video folder, but I would prefer if you don't touch it,
it's well automated and everytime you upload a video it deletes the previous, so it won't build up
in size.

### Additional Features - Lightning Round ⚡

#### Viewer Count 🔴
Remember the role call and ID stuff we added to solve the host syncing problem? Well turns out
you can use that to display how many current viewers there are. Every few seconds the client will
ping the server to check the viewer count and display it on the top right.

#### Spot Saving 🔖
We were using cookies to save IDs, but turns out it's easy to use that same feature to
save where you left off on a video as well. When the user saves a time, a GET request is
sent to the server to save the current video time, and everytime the page is loaded,
a GET request is made to get the saved video time, and another click will seek the player
to that time.

#### Refreshing 🔄
If the server admin wants to manually replace a file in the `.video` folder (smh,
touching the .video folder after I told you not to), because the file in question
is really big and it's easier to transfer it in the folder locally rather than 
through the server, all users can simply click the refresh button on the bottom left
to display the newly replaced video instead of having to refresh the entire page
themselves. 
