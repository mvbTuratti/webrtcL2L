// Code for first step, configuring video and audio.
const audioSelect = document.getElementById("audio-btn");
const videoSelect = document.getElementById("video-btn");
const audioDropdown = document.getElementById("dropdown-audio");
const videoDropdown = document.getElementById("dropdown-video");
const spinner = document.getElementById("spinner");
const videoTag = document.getElementById("video");
videoTag.crossOrigin = 'anonymous';
const defaultImg = document.getElementById("defaultImg");
const videoDiv = document.getElementById("video-div");
const cameraOn = document.getElementById("camera-on");
const cameraOff = document.getElementById("camera-off");
const audioOn = document.getElementById("mic-on");
const audioOff = document.getElementById("mic-off");
let audioId = "";
let videoId = "";

let localStream;
let remoteStreams = {};
let remoteStream;

audioSelect.onclick = () => {
    if (videoDropdown.className.includes('block')){
        videoDropdown.className = videoDropdown.className.replace('block', 'hidden');
    }
    
    if (audioDropdown.className.includes('hidden')){
        audioDropdown.className = audioDropdown.className.replace('hidden', 'block');
    } else {
        audioDropdown.className = audioDropdown.className.replace('block', 'hidden');
    }
}
videoSelect.onclick = () => {
    if (audioDropdown.className.includes('block')){
        audioDropdown.className = audioDropdown.className.replace('block', 'hidden');
    }
    
    if (videoDropdown.className.includes('hidden')){
        videoDropdown.className = videoDropdown.className.replace('hidden', 'block');
    } else {
        videoDropdown.className = videoDropdown.className.replace('block', 'hidden');
    }
}

function prepareDevices(devices) {
    let video = document.getElementById("dropdown-video-ul");
    while (video.firstChild){
        video.removeChild(video.firstChild);
    }
    let audio = document.getElementById("dropdown-audio-ul");
    while (audio.firstChild){
        audio.removeChild(audio.firstChild);
    }
    for (let i = 0; i !== devices.length; ++i) {
        const device = devices[i];
        if (device.kind === 'audioinput') {
          let label = device.label || `microfone ${audio.childNodes.length + 1}`;
          const li = liItemCreator(label, device.deviceId, 0);
          audio.appendChild(li);
        } else if (device.kind === 'videoinput') {
          let label = device.label || `camera ${video.childNodes.length + 1}`;
          const li = liItemCreator(label, device.deviceId, 1);
          video.appendChild(li);
        } else {
          //console.log('Some other kind of source/device: ', device);
        }
    }
}

function liItemCreator(content, id, type) {
    let li = document.createElement("li");
    li.className += " mt-4 mb-4 h-8 hover:bg-gray-400"
    let anchor = document.createElement("a");
    if ((type === 1 && videoId == "")){
        anchor.className += " bg-gray-100"
        videoId = id;
    }else if (type === 0 && audioId == ""){
        anchor.className += " bg-gray-100"
        audioId = id;
    }

    anchor.className += " text-sm text-gray-700 block px-4 py-2";
    anchor.text = content;
    li.id = id;
    anchor.onclick = () => {
        if (type === 1){
            videoDropdown.className = videoDropdown.className.replace('block', 'hidden');
            document.querySelectorAll("ul#dropdown-video-ul li a").forEach(a => {
                a.className = a.className.replace(/\bbg-gray-100\b/, "")
            });
            videoId = id;
        } else {
            audioDropdown.className = audioDropdown.className.replace('block', 'hidden');
            document.querySelectorAll("ul#dropdown-audio-ul li a").forEach(a => {
                a.className = a.className.replace(/\b(bg-gray-100)\b/, "")
            });
            audioId = id;
        }
        anchor.className += " bg-gray-100";
        start();
    };
    li.appendChild(anchor);

    return li;
}

function streamStart(stream) {
    window.stream = stream; 
    videoTag.srcObject = stream;
    localStream = stream;

    return navigator.mediaDevices.enumerateDevices();
}
  

function start(config) {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    const audioSource = audioId;
    const videoSource = videoId;
    const constraints = {
        audio: config.audio && {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: config.video && {deviceId: videoSource ? {exact: videoSource} : undefined}
    };
    
    navigator.mediaDevices.getUserMedia(constraints).then(streamStart).then(() => {
        spinner.hidden = true;
        if (config.video){
            videoDiv.hidden = false;
            defaultImg.hidden = true;
        } else {
            videoDiv.hidden = true;
            defaultImg.hidden = false;
        }
    }).catch(() => alert("error"));
}

function videoControl(type) {
    if (type === 'audio') {
        audioOn.hidden = !audioOn.hidden;
        audioOff.hidden = !audioOff.hidden;
    } else if (type === 'camera') {
        if (cameraOn.hidden){
            videoTag.srcObject = null;
        }
        cameraOn.hidden = !cameraOn.hidden;
        cameraOff.hidden = !cameraOff.hidden;
    }
    let constraints = {audio: audioOn.hidden, video: cameraOn.hidden}
    const fun = (async () => {   
        await navigator.mediaDevices.getUserMedia(constraints);
        start(constraints);
    })();
}

setTimeout(() => {
    (async () => {
        try {
            await navigator.mediaDevices.getUserMedia({audio: true, video: true});
            let devices = await navigator.mediaDevices.enumerateDevices(); 
            prepareDevices(devices);
            start({audio: true, video: true});
        } catch (error) {
            spinner.hidden = true;
            videoDiv.hidden = true;
            defaultImg.hidden = false;
            let buttons = document.getElementsByTagName("button");
            for (let index = 0; index < buttons.length; index++) {
                const element = buttons[index];
                element.disabled = true;
            }
        }
      })();
}, 100);


// Code for webrtc

const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

const painel = document.getElementById("painel");
const painelControler = document.getElementById("painel-controler");
let remotePeers = [];

const hidePainel = () => {setTimeout(() => {
    painel.className = painel.className.replace('flex', 'hidden');
}, 1500)};


painelControler.onmouseover = ()=>{
    clearTimeout(hidePainel);
    painel.className = painel.className.replace('hidden', 'flex');
    painel.onmouseleave = () => hidePainel();
};



let participants = [];
let id = "";
let current = 1;
window.addEventListener(`phx:joining`, (members) => {
    console.log(members)
    videoTag.srcObject = null;
    hidePainel();
    id = members.detail.id;
    sdps = members.detail.sdps;
    current = members.detail.current;
    //if there's no one in the room yet, create a ICE candidate.
    if (current === 1){
        // makeCall(id);
        createOffer(id);
    } else {
        for (const sdp in sdps) {
            if (Object.hasOwnProperty.call(sdps, sdp)) {
                const element = sdps[sdp];
                element.id = sdp;
                console.log(element)
                answerPeer(element);
            }
        }
        // makeCall(id);
        createOffer(id);
    }
    //for (let index = 1; index <= current; index++) {
    //    const videoStream = document.getElementById(`video-${index}`)
        //videoStream.srcObject = localStream;
    //}
    const currentVideo = document.getElementById('video-1');
    currentVideo.srcObject = localStream;
})

window.addEventListener(`phx:offer`, async message => {
    if (message.offer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingChannel.send({'answer': answer});
    }
})

window.addEventListener(`phx:participants`, (message) => {
    alert("participants")
    console.log(message)
})

// This event listener is needed for safely removing srcObj from client. 
window.addEventListener(`phx:presence`, (message) => {
    console.log(message)
    const confirmation = {"ref": message.detail.ref, "user": message.detail.user};
    document.dispatchEvent(room_event("presence-client", confirmation)); 
})

let room_event = (message, payload) => new CustomEvent("room-event", {
    detail: { event: message, payload: payload},
});

// async function makeCall(id) {
//     const peerConnection = new RTCPeerConnection(configuration);
//     window.addEventListener(`phx:response`, async msg => {
//         if (!remoteStreams[msg.id]) {
//             const remoteDesc = new RTCSessionDescription(msg.answer);
//             await peerConnection.setRemoteDescription(remoteDesc);
//             remoteStreams[msg.id] = msg.answer;
//             makeCall(id);
//         }
//     })
//     peerConnection.ontrack = e => {
//         console.log("trackssssss on creator")
//         console.log(e.streams)
//         e.streams[0].onaddtrack = e => console.log("add track...")
//         e.streams[0].onremovetrack = e => console.log("remove track...")
//         //remoteStreams = e.streams[0];
//     }
//     let dc = peerConnection.createDataChannel("channel");
//     dc.onmessage = e => {
//         messages(e)
//     };
//     peerConnection.onnegotiationneeded = e => console.log("negotiation needed")
//     localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
//     const offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);
//     const iceoffer = {"id":id, "pc": offer};
//     document.dispatchEvent(room_event("icecandidate", iceoffer)); 
// }

function answerPeer(peer) {
    let peerConnection = new RTCPeerConnection(configuration);
    console.log("Answer peer")
    console.log(peer)
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = e => {
        console.log("trackssss...")
        console.log(e.streams)
        remoteStream = e.streams[0];
        e.streams[0].onaddtrack = e => console.log("add track...")
        e.streams[0].onremovetrack = e => console.log("remove track...")
    }
    peerConnection.onicecandidate = e => {
        // const iceresponse = {"id": peer.id, "pc":peerConnection.localDescription};
        // document.dispatchEvent(room_event("icecandidate-response", iceresponse));
        console.log("answer on ice candidate")
    }
    peerConnection.ondatachannel = e => {
        peerConnection.dc = e.channel;
        peerConnection.dc.onmessage = e => {
            messages(e);
        }
        
        peerConnection.dc.onopen = e => {
            remotePeers.push({"id":peer["id"], "pc": peerConnection, "dc": peerConnection.dc});
            // drawPeer(peer["id"])
        } 
    }
    peerConnection.onnegotiationneeded = e => console.log("negotiation needed")
    console.log(peer)
    peerConnection.setRemoteDescription(peer).then(a => console.log("offer set"))
    peerConnection.createAnswer().then(a => peerConnection.setLocalDescription(a)).then(a => {
        const iceresponse = {"id": peer.id, "pc":peerConnection.localDescription, from: id};
        document.dispatchEvent(room_event("icecandidate-response", iceresponse));
    })

}

function createOffer(client) {
    let peerConnection = new RTCPeerConnection(configuration);
    peerConnection.ontrack = e => {
        console.log("trackssssss on creator")
        console.log(e.streams)
        e.streams[0].onaddtrack = e => console.log("add track...")
        e.streams[0].onremovetrack = e => console.log("remove track...")
        remoteStream = e.streams[0];
    }

    let dc = peerConnection.createDataChannel("channel");
    dc.onmessage = e => {
        messages(e)
    };
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    remotePeers.push({"id": client, "pc":peerConnection, "dc": dc});
    peerConnection.onicecandidate = e => {
        // const iceoffer = {"id":id, "pc": peerConnection.localDescription};
        // document.dispatchEvent(room_event("icecandidate", iceoffer)); 
        console.log("icecandidate")
    }
    
    peerConnection.createOffer().then( o => 
        peerConnection.setLocalDescription(o)    
    ).then(p => {
        console.log("set succesfully")
        const iceoffer = {"id":id, "pc": peerConnection.localDescription};
        document.dispatchEvent(room_event("icecandidate", iceoffer)); 
    })
    peerConnection.onnegotiationneeded = e => console.log("negotiation needed")
    window.addEventListener(`phx:response`, async msg => {
        alert("Response!")
        console.log(msg)
        if (msg.detail.id === id) {
            peerConnection.setRemoteDescription(msg.detail.pc);
            remoteStreams[msg.detail.from] = msg.detail.answer;
            dc.onopen = e => console.log("estado open");
        }
    })
    console.log( "estado " + dc.readyState)
}