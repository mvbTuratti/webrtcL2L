const audioSelect = document.getElementById("audio-btn");
const videoSelect = document.getElementById("video-btn");
const audioDropdown = document.getElementById("dropdown-audio");
const videoDropdown = document.getElementById("dropdown-video");
const spinner = document.getElementById("spinner");
const videoTag = document.getElementById("video");

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
          console.log('Some other kind of source/device: ', deviceInfo);
        }
    }

    return false;
}

function liItemCreator(content, id, type) {
    let li = document.createElement("li");
    let anchor = document.createElement("a");
    anchor.className += "bg-gray-100 text-sm hover:bg-gray-100 text-gray-700 block px-4 py-2";
    anchor.text = content;
    li.id = id; //returning empty...
    anchor.onclick = () => {
        if (type === 1){
            videoDropdown.className = videoDropdown.className.replace('block', 'hidden');
            document.querySelectorAll("ul#dropdown-video-ul li a").forEach(a => {
                a.className = a.className.replace(/\bbg-gray-100\b/, "")
            });
        } else {
            audioDropdown.className = audioDropdown.className.replace('block', 'hidden');
            document.querySelectorAll("ul#dropdown-audio-ul li a").forEach(a => {
                a.className = a.className.replace(/\b(bg-gray-100)\b/, "")
            });
        }
        anchor.className += " bg-gray-100"; 
        
    };
    li.appendChild(anchor);

    return li;
}




setTimeout(() => {
    navigator.mediaDevices.enumerateDevices().then(prepareDevices).catch(() => alert("Erro ao reconhecer dispositivos de vídeo e áudio"));

}, 100);

