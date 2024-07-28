const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const notifications = document.getElementById('notifications');
const callerIdElement = document.getElementById('callerId');
const acceptCallButton = document.getElementById('acceptCallButton');

let localStream;
let remoteStream;
let peerConnection;
const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

startButton.addEventListener('click', startCall);
hangupButton.addEventListener('click', hangUp);
acceptCallButton.addEventListener('click', acceptCall);

let socket = new WebSocket('ws://localhost:8080');

socket.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.offer) {
        callerIdElement.textContent = `${data.callerId} is calling...`;
        notifications.classList.remove('hidden');
        
        peerConnection = new RTCPeerConnection(servers);
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.send(JSON.stringify({ candidate: event.candidate }));
            }
        };
        peerConnection.onaddstream = event => {
            remoteStream = event.stream;
            remoteVideo.srcObject = remoteStream;
        };
        await peerConnection.setRemoteDescription(data.offer);

    } else if (data.answer) {
        await peerConnection.setRemoteDescription(data.answer);
    } else if (data.candidate) {
        try {
            await peerConnection.addIceCandidate(data.candidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    } else if (data.hangup) {
        endCall();
    }
};

async function startCall() {
    startButton.disabled = true;
    hangupButton.disabled = false;

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(servers);
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.send(JSON.stringify({ candidate: event.candidate }));
            }
        };
        peerConnection.onaddstream = event => {
            remoteStream = event.stream;
            remoteVideo.srcObject = remoteStream;
        };

        peerConnection.addStream(localStream);

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.send(JSON.stringify({ offer, callerId: 'Your ID' })); // Replace 'Your ID' with actual caller ID
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

async function acceptCall() {
    notifications.classList.add('hidden');
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection.addStream(localStream);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(JSON.stringify({ answer }));
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

function hangUp() {
    socket.send(JSON.stringify({ hangup: true }));
    endCall();
}

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    hangupButton.disabled = true;
    startButton.disabled = false;
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
    }
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}






