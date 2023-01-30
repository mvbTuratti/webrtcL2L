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
let remoteStreams = {size: 1};
let configSettings = {audio: true, video: true};

let currentView = 1;


const remoteProxy = new Proxy(remoteStreams, {
    set: function (target, key, value) {
     console.log(`${key} set from ${remoteStreams.key} to ${value}, target = ${target.size}`);

     if (!(key in target)) target.size += 1;
     target[key] = value;
     if (target.size > 4 && currentView == 1){
        document.getElementById("salas-right").style.display = "block";
     }
     return true;
   },
});

let remoteStream = {};

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
        start(configSettings);
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
    console.log(config)
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
    configSettings = {audio: audioOn.hidden, video: cameraOn.hidden}
    const fun = (async () => {
        try {
            await navigator.mediaDevices.getUserMedia(configSettings);
            start(configSettings);
        } catch {
            console.log("h")
            if (window.stream) {
                window.stream.getTracks().forEach(track => {
                    track.stop();
                });
            }
            spinner.hidden = true;
            videoDiv.hidden = true;
            defaultImg.hidden = false;
        }
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
    // console.log(members)
    videoTag.srcObject = null;
    hidePainel();
    id = members.detail.id;
    sdps = members.detail.sdps;
    current = members.detail.current;

    //if there's no one in the room yet, create a ICE candidate.
    if (current === 1){
        // makeCall(id);
        createOffer();
    } else {
        for (const sdp in sdps) {
            if (Object.hasOwnProperty.call(sdps, sdp)) {
                const element = sdps[sdp];
                element.id = sdp;
                // console.log(element)
                answerPeer(element);
            }
        }
    }

    const currentVideo = document.getElementById('video-1');
    currentVideo.srcObject = localStream;
    const left = document.getElementById("salas-left");
    const right = document.getElementById("salas-right");
    left.addEventListener('click', () => {
        if (currentView > 4){
            for (let index = 0; index < 4; index++) {
                try {
                    const videoParent = document.getElementById(`video-${currentView + index}`).parentNode;
                    videoParent.style.display = "none";    
                } catch (error) {
                    //
                }
                if (currentView - index - 1> 0){
                    const videoParent = document.getElementById(`video-${currentView - 1 - index}`).parentNode;
                    videoParent.style.display = "block";
                }
            }
            currentView = currentView - 4;
            right.style.display = "block";
        }
        if (currentView < 4){
            left.style.display = "none";
        }
    })
    right.addEventListener('click', () => {
        if (remoteProxy.size > 4){
            for (let index = 0; index < 4; index++) {
                try {
                    const videoParent = document.getElementById(`video-${currentView + 4 + index}`).parentNode;
                    videoParent.style.display = "block";    
                } catch (error) {
                    console.log(`skipping video-${currentView + 4 + index}`);
                }
                try {
                    const videoParent = document.getElementById(`video-${currentView + index}`).parentNode;
                    videoParent.style.display = "none";
                } catch (error){
                    console.log(`skipping video-${currentView + index}`);
                }
            }
            currentView = currentView + 4;
            left.style.display = "block";
        }
        if (remoteProxy.size - currentView < 5){
            right.style.display = "none";
        }
    })
})

window.addEventListener(`phx:offer`, async message => {
    if (message.offer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingChannel.send({'answer': answer});
    }
})

// window.addEventListener(`phx:participants`, (message) => {
//     alert("participants")
//     console.log(message)
// })

// This event listener is needed for safely removing srcObj from client. 
window.addEventListener(`phx:presence`, (message) => {
    // console.log(message)
    delete remoteProxy[message.detail.user]
    remoteProxy.size -= 1;
    const confirmation = {"ref": message.detail.ref, "user": message.detail.user};
    document.dispatchEvent(room_event("presence-client", confirmation)); 
})

let room_event = (message, payload) => new CustomEvent("room-event", {
    detail: { event: message, payload: payload},
});
function setVideoStream(stream, streamsHash) {
    for (key of Object.keys(remoteProxy)){
        if (remoteProxy[key].hasOwnProperty('hash') && remoteProxy[key].hash == streamsHash){
            const videoHandler = document.getElementById(`video-${remoteProxy[key].stamp}`);
            videoHandler.srcObject = stream;
            return true;
        }
    } 
    return false;
}



function answerPeer(peer) {
    let peerConnection = new RTCPeerConnection(configuration);
    // console.log("PEER!")
    // console.log(peer)
    const streamsHash = (+new Date).toString(36).slice(-7);
    let size = (Object.hasOwnProperty.call(remoteProxy, peer["id"]) && remoteProxy[peer["id"]].stamp) || remoteProxy.size + 1;
    remoteProxy[peer["id"]] = {pc: peerConnection, dc: peerConnection.dc, hash: streamsHash, stamp: size};
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = e => {
        let isStreaming = setVideoStream(e.streams[0], streamsHash);
        if (!isStreaming){
            setTimeout(setVideoStream, 15000);
        }
        e.streams[0].onaddtrack = e => {}
        e.streams[0].onremovetrack = e => {}
    }
    peerConnection.onicecandidate = e => {
        // console.log("answer on ice candidate")
        if (e.candidate) {
            if (peerConnection.dc?.readyState == 'open') {
                // console.log("CANDIDATE!!!")
                dc.send(e.candidate)
            }
        }
    }
    peerConnection.ondatachannel = (event) => {
        peerConnection.dc = event.channel;
        peerConnection.dc.onopen = (event) => {
            peerConnection.dc.send('Hi back!');
            
            // remoteProxy.size += 1;
            createOffer();
        }
        peerConnection.dc.onmessage = (event) => {
            // console.log(.)+
            if (event.iceCandidate) {
                try {
                    peerConnection.addIceCandidate(event.iceCandidate).then("added ice candidate");
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        }
    }
    
    peerConnection.addEventListener("icegatheringstatechange", (ev) => {
        switch(peerConnection.iceGatheringState) {
          case "new":
            /* gathering is either just starting or has been reset */
            break;
          case "gathering":
            /* gathering has begun or is ongoing */
            break;
          case "complete":
            /* gathering has ended */
            console.log("complete state!")
            
            break;
        }
    });
    peerConnection.onnegotiationneeded = e => {
        // console.log("NEGOTIATION NEEDED!")
    }
    peerConnection.setRemoteDescription({sdp:peer.sdp,type: peer.type}).then(a => {})
    peerConnection.createAnswer().then(a => peerConnection.setLocalDescription(a)).then(a => {
        // console.log("answer created");
        setTimeout(() => {
            const iceresponse = {"id": peer.id, "pc":peerConnection.localDescription, from: id, hash: peer.hash};
            document.dispatchEvent(room_event("icecandidate-response", iceresponse))
        }, 0);
        
    })

}

function createOffer() {
    const streamsHash = (+new Date).toString(36).slice(-7);
    let peerConnection = new RTCPeerConnection(configuration);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = e => {
        console.log("trackssssss on creator")
        console.log(e.streams)
        e.streams[0].onaddtrack = e => {}
        e.streams[0].onremovetrack = e => {}
        let isStreaming = setVideoStream(e.streams[0], streamsHash);
        if (!isStreaming){
            setTimeout(setVideoStream, 15000);
        }
    }

    const dc = peerConnection.createDataChannel("chat");
    dc.onopen = (event) => {
        dc.send('Hi you!');
    }
    dc.onmessage = (event) => {
        if (event.iceCandidate) {
            try {
                peerConnection.addIceCandidate(event.iceCandidate).then("added ice candidate");
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        }
    }
    
    peerConnection.onicecandidate = e => {
        // const iceoffer = {"id":id, "pc": peerConnection.localDescription};
        // document.dispatchEvent(room_event("icecandidate", iceoffer));
        if (e.candidate) {
            if (dc?.readyState == 'open') {
                // console.log("CANDIDATE!!!")
                dc.send(e.candidate)
            }
        }
     }
    // window.addEventListener(`phx:new-ice`)
    
    peerConnection.createOffer().then( o => 
        peerConnection.setLocalDescription(o)    
    ).then(p => {
        // console.log("set succesfully") 
    })
    peerConnection.addEventListener("icegatheringstatechange", (ev) => {
        switch(peerConnection.iceGatheringState) {
          case "new":
            /* gathering is either just starting or has been reset */
            break;
          case "gathering":
            /* gathering has begun or is ongoing */
            break;
          case "complete":
            /* gathering has ended */
            // console.log("complete state!")
            const iceoffer = {id:id, pc: peerConnection.localDescription, hash: streamsHash};
            document.dispatchEvent(room_event("icecandidate", iceoffer)); 
            break;
        }
    });
    peerConnection.onnegotiationneeded = e => {
        setTimeout(() => {
            const iceoffer = {id:id, pc: peerConnection.localDescription, hash: streamsHash};
            document.dispatchEvent(room_event("icecandidate", iceoffer)); 
        }, 500);
    }
    window.addEventListener(`phx:response`, async msg => {
        if (msg.detail.hash === streamsHash) {
            // console.log("PHX: RESPONSE")
            // console.log(msg)
            peerConnection.setRemoteDescription(msg.detail.pc);
            console.log("PHX RESPONSE")
            console.log(remoteProxy)
            let size = (Object.hasOwnProperty.call(remoteProxy, msg.detail.from) && remoteProxy[msg.detail.from].stamp) || remoteProxy.size + 1;
            remoteProxy[msg.detail.from] = {pc: peerConnection, dc: dc, hash: streamsHash, stamp: size};
            dc.onopen = e => {}
            createOffer();
        }
    })
    // console.log( "estado " + dc.readyState)
}

// async function createOffer() {
//     const peerConnection = new RTCPeerConnection(configuration);
//     signalingChannel.addEventListener('message', async message => {
//         if (message.answer) {
//             const remoteDesc = new RTCSessionDescription(message.answer);
//             await peerConnection.setRemoteDescription(remoteDesc);
//         }
//     });
//     const offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);
//     signalingChannel.send({'offer': offer});
// }