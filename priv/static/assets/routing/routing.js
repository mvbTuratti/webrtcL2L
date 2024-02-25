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

// audioSelect.onclick = () => {
//     if (videoDropdown.className.includes('block')){
//         videoDropdown.className = videoDropdown.className.replace('block', 'hidden');
//     }
    
//     if (audioDropdown.className.includes('hidden')){
//         audioDropdown.className = audioDropdown.className.replace('hidden', 'block');
//     } else {
//         audioDropdown.className = audioDropdown.className.replace('block', 'hidden');
//     }
// }
// videoSelect.onclick = () => {
//     if (audioDropdown.className.includes('block')){
//         audioDropdown.className = audioDropdown.className.replace('block', 'hidden');
//     }
    
//     if (videoDropdown.className.includes('hidden')){
//         videoDropdown.className = videoDropdown.className.replace('hidden', 'block');
//     } else {
//         videoDropdown.className = videoDropdown.className.replace('block', 'hidden');
//     }
// }

// function prepareDevices(devices) {
//     let video = document.getElementById("dropdown-video-ul");
//     while (video.firstChild){
//         video.removeChild(video.firstChild);
//     }
//     let audio = document.getElementById("dropdown-audio-ul");
//     while (audio.firstChild){
//         audio.removeChild(audio.firstChild);
//     }
//     for (let i = 0; i !== devices.length; ++i) {
//         const device = devices[i];
//         if (device.kind === 'audioinput') {
//           let label = device.label || `microfone ${audio.childNodes.length + 1}`;
//           const li = liItemCreator(label, device.deviceId, 0);
//           audio.appendChild(li);
//         } else if (device.kind === 'videoinput') {
//           let label = device.label || `camera ${video.childNodes.length + 1}`;
//           const li = liItemCreator(label, device.deviceId, 1);
//           video.appendChild(li);
//         } else {
//           //console.log('Some other kind of source/device: ', device);
//         }
//     }
// }

// function liItemCreator(content, id, type) {
//     let li = document.createElement("li");
//     li.className += " mt-4 mb-4 h-8 hover:bg-gray-400"
//     let anchor = document.createElement("a");
//     if ((type === 1 && videoId == "")){
//         anchor.className += " bg-gray-100"
//         videoId = id;
//     }else if (type === 0 && audioId == ""){
//         anchor.className += " bg-gray-100"
//         audioId = id;
//     }

//     anchor.className += " text-sm text-gray-700 block px-4 py-2";
//     anchor.text = content;
//     li.id = id;
//     anchor.onclick = () => {
//         if (type === 1){
//             videoDropdown.className = videoDropdown.className.replace('block', 'hidden');
//             document.querySelectorAll("ul#dropdown-video-ul li a").forEach(a => {
//                 a.className = a.className.replace(/\bbg-gray-100\b/, "")
//             });
//             videoId = id;
//         } else {
//             audioDropdown.className = audioDropdown.className.replace('block', 'hidden');
//             document.querySelectorAll("ul#dropdown-audio-ul li a").forEach(a => {
//                 a.className = a.className.replace(/\b(bg-gray-100)\b/, "")
//             });
//             audioId = id;
//         }
//         anchor.className += " bg-gray-100";
//         start(configSettings);
//     };
//     li.appendChild(anchor);

//     return li;
// }

// function streamStart(stream) {
//     window.stream = stream; 
//     videoTag.srcObject = stream;
//     localStream = stream;

//     return navigator.mediaDevices.enumerateDevices();
// }
  

// function start(config) {
//     console.log(config)
//     if (window.stream) {
//         window.stream.getTracks().forEach(track => {
//             track.stop();
//         });
//     }
//     const audioSource = audioId;
//     const videoSource = videoId;
//     const constraints = {
//         audio: config.audio && {deviceId: audioSource ? {exact: audioSource} : undefined},
//         video: config.video && {deviceId: videoSource ? {exact: videoSource} : undefined}
//     };
    
//     navigator.mediaDevices.getUserMedia(constraints).then(streamStart).then(() => {
//         spinner.hidden = true;
//         if (config.video){
//             videoDiv.hidden = false;
//             defaultImg.hidden = true;
//         } else {
//             videoDiv.hidden = true;
//             defaultImg.hidden = false;
//         }
//     }).catch(() => alert("error"));
// }

// function videoControl(type) {
//     if (type === 'audio') {
//         audioOn.hidden = !audioOn.hidden;
//         audioOff.hidden = !audioOff.hidden;
//     } else if (type === 'camera') {
//         if (cameraOn.hidden){
//             videoTag.srcObject = null;
//         }
//         cameraOn.hidden = !cameraOn.hidden;
//         cameraOff.hidden = !cameraOff.hidden;
//     }
//     configSettings = {audio: audioOn.hidden, video: cameraOn.hidden}
//     const fun = (async () => {
//         try {
//             await navigator.mediaDevices.getUserMedia(configSettings);
//             start(configSettings);
//         } catch {
//             console.log("h")
//             if (window.stream) {
//                 window.stream.getTracks().forEach(track => {
//                     track.stop();
//                 });
//             }
//             spinner.hidden = true;
//             videoDiv.hidden = true;
//             defaultImg.hidden = false;
//         }
//     })();
// }

// setTimeout(() => {
//     (async () => {
//         try {
//             await navigator.mediaDevices.getUserMedia({audio: true, video: true});
//             let devices = await navigator.mediaDevices.enumerateDevices(); 
//             prepareDevices(devices);
//             start({audio: true, video: true});
//         } catch (error) {
//             spinner.hidden = true;
//             videoDiv.hidden = true;
//             defaultImg.hidden = false;
//             let buttons = document.getElementsByTagName("button");
//             for (let index = 0; index < buttons.length; index++) {
//                 const element = buttons[index];
//                 element.disabled = true;
//             }
//         }
//       })();
// }, 100);

// Control Painel

// const painel = document.getElementById("painel");
// const painelControler = document.getElementById("painel-controler");

// const hidePainel = () => {setTimeout(() => {
//     painel.className = painel.className.replace('flex', 'hidden');
// }, 1500)};


// painelControler.onmouseover = ()=>{
//     clearTimeout(hidePainel);
//     painel.className = painel.className.replace('hidden', 'flex');
//     painel.onmouseleave = () => hidePainel();
// };

// Code for webrtc

class PeerConnections {
    constructor() {
        this.users = {};
        this.users.room = new MediaTracks();
    }
    createRoomDataChannelOffer() {
        this.users.room.createDataChannelStream()
    }
    answerDataChannelOffer(peer, sdp) {
        this.users.peer = new MediaTracks();
        this.users.peer.acceptDataChannelStream(sdp, peer);
    }
    responseFromAnswerDataChannel(user, sdp) {
        // this.users.user = Object.assign({}, this.users.room);
        this.users.user = Object.assign(Object.create(this.users.room), this.users.room)
        console.log(this.users.user)
        this.users.user.assignRemoteDescription(sdp, "room");
        this.users.room = new MediaTracks();
        this.users.room.createDataChannelStream("perfect-negotiation-room");
    }
}
class DataChannel {
    constructor(chat) {
        this.peer = new RTCPeerConnection(MediaTracks.configuration);
        console.log(chat)
        this.dataChannel = chat ? this.setDataChannel(chat) : this.receiveDataChannel();
    }
    receiveDataChannel() {
        console.log("without parameter")
        this.peer.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            const dc = this.dataChannel;
            const peer = this.peer;
            this.dataChannel.onopen = (event) => {
                dc.send(`Hi back from ${self_id}`);
                //MURILO
                // getMetrics(peer);
            }
            this.dataChannel.onmessage = (event) => {
                console.log("on message")
                console.log(event)
                //MURILO
                if (event.iceCandidate) {
                    try {
                        peer.addIceCandidate(event.iceCandidate).then("added ice candidate");
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            }
        }
    }
    setDataChannel(chat){
        console.log("with parameter")
        this.dataChannel = this.peer.createDataChannel(chat);
        const dc = this.dataChannel;
        const peer = this.peer;
        console.log(dc);
        this.dataChannel.onopen = (event) => {
            dc.send(`Hi you! send from ${self_id}.`);
            // getMetrics(peer);
            //MURILO
            // setInterval(() => {this.sendMessage({type: "msg", msg: `Hi you! send from ${self_id}. ${}`})})
        }
        this.dataChannel.onmessage = (event) => {
            console.log("on message")
            console.log(event)
            //MURILO
            if (event.iceCandidate) {
                try {
                    peer.addIceCandidate(event.iceCandidate).then("added ice candidate");
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        }
    }
    sendMessage(msg) {
        this.dataChannel.send(msg);
    }
}

class MediaTracks {
    constructor() {
        this.highQuality = null;
        this.lowQuality = null;
        this.audioOnly = null;
        this.dataChannel = null;
        this.screenSharing = null;
    }
    static configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};
    createHighQualityStream() {
        this.highQuality = new RTCPeerConnection(MediaTracks.configuration);
        return this.highQuality;
    }
    createLowQualityStream() {
        this.lowQuality = new RTCPeerConnection(MediaTracks.configuration);
        return this.lowQuality;
    }
    createAudioOnlyStream() {
        this.audioOnly = new RTCPeerConnection(MediaTracks.configuration);
        return this.audioOnly;
    }
    createScreenSharingStream() {
        this.screenSharing = new RTCPeerConnection(MediaTracks.configuration);
        return this.screenSharing;
    }
    createDataChannelStream(type = "room") {
        this.dataChannel = new DataChannel("chat");
        let offer = this.createOffer(this.dataChannel.peer, this.dataChannel.dataChannel, type);
        return offer;
    }
    assignRemoteDescription(sdp, type) {
        switch (type) {
            case "room":
                this.dataChannel.peer.setRemoteDescription(sdp)
                break;
        
            default:
                break;
        }
    }
    acceptDataChannelStream(sdp, peer) {
        this.dataChannel = new DataChannel();
        setTimeout(() => this.acceptOffer(this.dataChannel.peer, this.dataChannel.dataChannel, "room", sdp, peer), 0);
    }
    createOffer(peerConnection, dc, type) {
        console.log("Called CreateOffer")
        peerConnection.onicecandidate = e => {
            if (e.candidate) {
                if (dc?.readyState == 'open') {
                    // console.log("CANDIDATE!!!")
                    dc.send(e.candidate)
                }
            }
         }
        
        peerConnection.createOffer().then( o => 
            peerConnection.setLocalDescription(o)    
        ).then(p => {
            console.log("set succesfully") 
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
                console.log("complete state!")
                const iceoffer = {type: type, pc: peerConnection.localDescription};
                document.dispatchEvent(sendPayloadToLiveView("ice-candidate", iceoffer)); 
                break;
            }
        });
        peerConnection.onnegotiationneeded = e => {
                const iceoffer = {type: `negotiation-${type}`,pc: peerConnection.localDescription};
                document.dispatchEvent(sendPayloadToLiveView("ice-candidate", iceoffer)); 
        }
    }
    acceptOffer(peerConnection, dc, type, sdp, peer){
        console.log("Called AcceptOffer!!")
        peerConnection.onicecandidate = e => {
            // console.log("answer on ice candidate")
            if (e.candidate) {
                if (dc?.readyState == 'open') {
                    console.log("AcceptOffer candidate")
                    console.log(dc)
                    dc.send(e.candidate)
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
            console.log("NEGOTIATION NEEDED!")
        }
        peerConnection.setRemoteDescription(sdp).then(a => {})
        peerConnection.createAnswer().then(a => peerConnection.setLocalDescription(a)).then(a => {
            // console.log("answer created");
            setTimeout(() => {
                const iceresponse = {source: peer, sdp:peerConnection.localDescription, type: `ice-response-${type}`};
                document.dispatchEvent(sendPayloadToLiveView("icecandidate-response", iceresponse))
            }, 0);
            
        })
    }
}

const participants = new PeerConnections();
let self_id = "";
let current = 1;
let sendPayloadToLiveView = (message, payload) => new CustomEvent("room-event", {
    detail: { event: message, payload: payload},
});
window.addEventListener(`phx:joining`, (members) => {
    console.log("joining...")
    console.log(members)
    self_id = members.detail.id
    if (members.detail.affected_users.length > 0) {
        Object.entries(members.detail.sdps).forEach(([name, sdp]) => {
            console.log(`${name} ${sdp}`); // "a 5", "b 7", "c 9"
            participants.answerDataChannelOffer(name, sdp);

        });
    }
})
window.addEventListener(`phx:ice-response-room`, (payload) => {
    participants.responseFromAnswerDataChannel(payload.detail.user_id, payload.detail.sdp);
})

participants.createRoomDataChannelOffer();


// a wrapper around getStats which hides the differences (where possible)
// following code-snippet is taken from somewhere on the github
// function _getStats(peer, cb) {
//     if (!!navigator.mozGetUserMedia) {
//         peer.getStats(
//             function (res) {
//                 var items = [];
//                 res.forEach(function (result) {
//                     items.push(result);
//                 });
//                 cb(items);
//             },
//             cb
//         );
//     } else {
//         peer.getStats(function (res) {
//             var items = [];
//             res.result().forEach(function (result) {
//                 var item = {};
//                 result.names().forEach(function (name) {
//                     item[name] = result.stat(name);
//                 });
//                 item.id = result.id;
//                 item.type = result.type;
//                 item.timestamp = result.timestamp;
//                 items.push(item);
//             });
//             cb(items);
//         });
//     }
// };
// function getStats(peer) {
//     _getStats(peer, function (results) {
//         for (let i = 0; i < results.length; ++i) {
//             let res = results[i];
//             if (res.googCodecName == 'opus') {
//                 if (!window.prevBytesSent) 
//                     window.prevBytesSent = res.bytesSent;

//                 let bytes = res.bytesSent - window.prevBytesSent;
//                 window.prevBytesSent = res.bytesSent;

//                 let kilobytes = bytes / 1024;
//                 console.log(kilobytes.toFixed(1) + ' kbits/s');
//             }
//         }

//         setTimeout(function () {
//             getStats(peer);
//         }, 1000);
//     });
// }

// function getMetrics(myPeerConnection) {
//     let reportId = setInterval((myPeerConnection) => {
//         myPeerConnection.getStats(null).then((stats) => {
//           let statsOutput = "";
      
//           stats.forEach((report) => {
//             statsOutput +=
//               `${report.type}\nID:${report.id}\n` +
//               `Timestamp:${report.timestamp}\n`;
      
//             // Now the statistics for this report; we intentionally drop the ones we
//             // sorted to the top above
      
//             Object.keys(report).forEach((statName) => {
//               if (
//                 statName !== "id" &&
//                 statName !== "timestamp" &&
//                 statName !== "type"
//               ) {
//                 statsOutput += `${statName}: ${report[statName]}\n`;
//               }
//             });
//           });
      
//           console.log(statsOutput);
//         });
//       }, 6000, myPeerConnection);
//     return reportId;
// }