var app = new Vue({
    el: '#app',
    data: {
        loggedin:false,
        email:'',
        password:'',
        errMessage:'',
        token:'',
        message:'',
        iceServers:[],
        call: {
            incoming:false,
            inprogress:false,
            telestration:false,
            reset: function() {
                app.call.incoming = false;
                app.call.inprogress = false;
                app.call.telestration = false;
            }
        }
    },
    methods: {
        login : function() {
            console.log("login")
            app.errMessage = ''
            axios.post('/api/user/login',{
                email:app.email,
                password:app.password
            }).then(function(res) {
                app.password=''
                if(res.data.authorized) {
                    app.loggedin = true
                    app.token = res.data.token
                    let url = '/api/iceServers'                    
                    axios.get(url, {
                        headers: {Authorization:  'Bearer '+ app.token}
                    }).then(iceRes => {
                       app.loggedin = true
                        app.iceServers = iceRes.data.ice_servers
                        connectSocket()
                    }).catch(err => {
                        console.log(err)
                        app.errMessage = err.message
                    })
                } else {
                    app.errMessage = 'Login failed'
                }
            }).catch(function(err) {
                app.password=''
                console.log(err)
                app.errMessage = 'Login failed'
            })
        },

        acceptCall:function() {
            acceptCallAndStartStream()
        },
        takePicture:function() {
            takePicture()
        },
        endCall:function() {
            endCallNow()
        },
        declineCall: function(caller) {
            sendPrivateMessage('calldeclined',caller,{reason:'expert busy'})
        },
        clearCanvas : function() {
            clearCanvas()
        }
    }
    
})


function endCallNow(endCallRequestCaller) {
    console.log('call closed by peer')
    stopStreamsAndClear()
    sendPrivateMessage('callended',otherPartySocketId,{reason:'expert ended call'})
    app.call.reset()
    app.message =''
    otherPartySocketId = ''
}

/**
 * Socket functions
 */

var incall = false
var socket, otherPartySocketId
function connectSocket() {
    let token = app.token
    socket = io({query:{token:token, webclient:true}})
    socket.on('connect', () => {
        console.log('Connected to socket')
    })
    socket.on('expertsonline', (data) => {
        console.log(data)
    })
    socket.on('disconnect',function() {
        console.log('socket disconnected')
    })

    socket.on('connectionrequest', (data) => {
        //Received offer from other end
        //show accept/decline buttons
        //check whether we are in a call and then proceed
        if(app.call.inprogress) {
            var caller = data.sender
            //reply back to caller
            app.declineCall(caller)
        } else {
            app.call.incoming = true
            var sender = data.sender
            var payload = data.payload
            app.message = 'Incoming call from ' + payload
            otherPartySocketId = sender
        }
        
    })

    socket.on('endcall', (data)=> {
       //call closed by peer
       var endCallRequestCaller = data.sender
       if(endCallRequestCaller == otherPartySocketId) {
       endCallNow(endCallRequestCaller)
       } else {
        console.log('End request by waiting call user')
        }
    })

    socket.on('chatanswer', (data) => {
        console.log('Received answer...');
        console.log('Setting remote session description...');
        peerConn.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.payload.sdp }));
        app.call.incoming = false
        app.call.inprogress = true
        app.message = ''
    })

    socket.on('candidate', (data) => {
        console.log('Received ICE candidate...');
        var sdpCandidate = data.payload.sdp.split(":")[1];
        var candidate = new RTCIceCandidate({ 
            sdpMLineIndex: data.payload.sdpMLineIndex, 
            sdpMid: data.payload.sdpMid, 
            candidate: data.payload.sdp });
        console.log(candidate);
        peerConn.addIceCandidate(candidate);
    })

    socket.on('message',(data) => {
        //TODO:
    })
    
}

function acceptCallAndStartStream() {
        
        //TODO: whether to accept the request
        //if yes, create peer connection
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia || navigator.msGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        navigator.getUserMedia({ video: false, audio: true }, (stream) => {
            //success
            localStream = stream
            createPeerConnectionAndOffer(otherPartySocketId)
        }, 
        (error) => {
                //error
                console.error('An error occurred: [CODE ' + error.code + ']');
        });
}

function sendPrivateMessage(event, to, payload) {
    socket.emit('privatemessage',{
        to:to,
        event:event,
        payload:payload
    })
}


//global vars
/** browser dependent definition are aligned to one and the same standard name **/
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition
    || window.msSpeechRecognition || window.oSpeechRecognition;

    //TODO: change to accomodate vue
var localStream = null;
var peerConn = null;
const mediaConstraints = {
    'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
    }
};


// stop local video
function stopStreamsAndClear() {
    document.getElementById('webrtc-remotevid').src = ''
    //localStream.stop()
    localStream = null
    if(peerConn) {
        peerConn.close()
        peerConn = null
    }
    
    clearCanvas()
}

function createPeerConnectionAndOffer(otherSocketId) {
    console.log("Creating peer connection");
   // var pc_config = { "iceServers": [{ "url": "stun:stun.l.google.com:19302?transport=tcp" }] };
   
   var pc_config = { "iceServers":  app.iceServers } ;
    try {
        peerConn = new RTCPeerConnection(pc_config);
    } catch (e) {
        console.log("Failed to create PeerConnection, exception: " + e.message);
    }
    // send any ice candidates to the other peer
    peerConn.onicecandidate = function (evt) {
        if (event.candidate) {
            console.log('Sending ICE candidate...');
            console.log(evt.candidate);
            sendPrivateMessage('candidate',otherSocketId,{
                type: "candidate",
                sdpMLineIndex: evt.candidate.sdpMLineIndex,
                sdpMid: evt.candidate.sdpMid,
                sdp: evt.candidate.candidate
            })
            
        } else {
            console.log("End of candidates.");
        }
    };
    console.log('Adding local stream...');
    peerConn.addStream(localStream);

    peerConn.addEventListener("addstream", onRemoteStreamAdded, false);
    peerConn.addEventListener("removestream", onRemoteStreamRemoved, false)

    peerConn.oniceconnectionstatechange = function () {
        if (peerConn && peerConn.iceConnectionState == 'disconnected') {
            console.log('Disconnected');        
        }
    }

    // when remote adds a stream, hand it on to the local video element
    function onRemoteStreamAdded(event) {
        console.log("Added remote stream");
        //document.getElementById('webrtc-remotevid').src = window.URL.createObjectURL(event.stream)
        document.getElementById('webrtc-remotevid').srcObject = event.stream

    }

    // when remote removes a stream, remove it from the local video element
    function onRemoteStreamRemoved(event) {
        console.log("Remove remote stream");
        document.getElementById('webrtc-remotevid').src = ''
    }

    //create offer
    peerConn.createOffer((sessionDescription) => {
        peerConn.setLocalDescription(sessionDescription)
        //send the offer to the other end
        sendPrivateMessage('chatoffer',otherSocketId,sessionDescription)
    }, () => {
        console.log('create offer failed')
    }, mediaConstraints)
}
