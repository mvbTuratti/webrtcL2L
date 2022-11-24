// Code for first step, configuring video and audio.
const audioSelect = document.getElementById("audio-btn");
const videoSelect = document.getElementById("video-btn");
const audioDropdown = document.getElementById("dropdown-audio");
const videoDropdown = document.getElementById("dropdown-video");
const spinner = document.getElementById("spinner");
const videoTag = document.getElementById("video");
const defaultImg = document.getElementById("defaultImg");
const videoDiv = document.getElementById("video-div");
const cameraOn = document.getElementById("camera-on");
const cameraOff = document.getElementById("camera-off");
const audioOn = document.getElementById("mic-on");
const audioOff = document.getElementById("mic-off");
let audioId = "";
let videoId = "";
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
    
    navigator.mediaDevices.getUserMedia(constraints).then(streamStart).then(e => {
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
let participants = [];
let id = "";
window.addEventListener(`phx:joining`, (members) => {
    console.log(members)
    id = members.detail.id;
    participants = members.detail.participants;
    //if there's no one in the room yet, create a ICE candidate.
    if (!participants.length){
        
    }
    document.dispatchEvent(room_event("icecandidate", []));
})

let room_event = (message, payload) => new CustomEvent("room-event", {
    detail: { event: message, payload: payload},
});