// ENCODE: Hide message in image and add watermark
function encodeMessageInImage(image, message, watermark, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Hide message in image pixels (simple LSB steganography)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    // Convert message to binary
    let binMsg = '';
    for (let i = 0; i < message.length; i++) {
        let bin = message.charCodeAt(i).toString(2).padStart(8, '0');
        binMsg += bin;
    }
    // Add delimiter to mark end of message
    binMsg += '0000000000000000'; // 2 null chars
    // Hide message in the LSB of the red channel
    for (let i = 0; i < binMsg.length && i < data.length / 4; i++) {
        let idx = i * 4;
        data[idx] = (data[idx] & 0xFE) | parseInt(binMsg[i]);
    }
    ctx.putImageData(imgData, 0, 0);

    // Add watermark text (bottom right) AFTER encoding
    ctx.font = `${Math.floor(canvas.width / 20)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.strokeText(watermark, canvas.width - 10, canvas.height - 10);
    ctx.fillText(watermark, canvas.width - 10, canvas.height - 10);

    callback(canvas);
}

// DECODE: Extract message from image
function decodeMessageFromImage(image, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let binMsg = '';
    for (let i = 0; i < data.length / 4; i++) {
        let idx = i * 4;
        binMsg += (data[idx] & 1).toString();
    }
    // Convert binary to string, stop at null char
    let chars = [];
    for (let i = 0; i < binMsg.length; i += 8) {
        let byte = binMsg.slice(i, i + 8);
        if (byte.length < 8) break;
        let charCode = parseInt(byte, 2);
        if (charCode === 0) break; // End of message
        chars.push(String.fromCharCode(charCode));
    }
    callback(chars.join(''));
}

// DOM handlers
window.onload = function() {
    // Tab logic
    const tabEncode = document.getElementById('tab-encode');
    const tabDecode = document.getElementById('tab-decode');
    const encodeSection = document.getElementById('encode-section');
    const decodeSection = document.getElementById('decode-section');
    tabEncode.onclick = function() {
        tabEncode.classList.add('active');
        tabDecode.classList.remove('active');
        encodeSection.style.display = '';
        decodeSection.style.display = 'none';
    };
    tabDecode.onclick = function() {
        tabDecode.classList.add('active');
        tabEncode.classList.remove('active');
        decodeSection.style.display = '';
        encodeSection.style.display = 'none';
    };
    // ENCODE preview
    document.getElementById('encode-image-input').onchange = function(e) {
        const previewDiv = document.getElementById('encode-image-preview');
        previewDiv.innerHTML = '';
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const img = document.createElement('img');
                img.src = ev.target.result;
                previewDiv.appendChild(img);
            };
            reader.readAsDataURL(this.files[0]);
        }
    };
    // DECODE preview
    document.getElementById('decode-image-input').onchange = function(e) {
        const previewDiv = document.getElementById('decode-image-preview');
        previewDiv.innerHTML = '';
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const img = document.createElement('img');
                img.src = ev.target.result;
                previewDiv.appendChild(img);
            };
            reader.readAsDataURL(this.files[0]);
        }
    };
    // ENCODE
    document.getElementById('encode-btn').onclick = function() {
        const imgInput = document.getElementById('encode-image-input');
        const msgInput = document.getElementById('encode-message-input');
        const watermarkInput = document.getElementById('encode-watermark-input');
        const outputDiv = document.getElementById('encoded-image-output');
        const downloadLink = document.getElementById('download-encoded-image');
        outputDiv.innerHTML = '';
        downloadLink.style.display = 'none';
        if (!imgInput.files[0] || !msgInput.value || !watermarkInput.value) {
            alert('Please provide image, message, and watermark.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new window.Image();
            img.onload = function() {
                encodeMessageInImage(img, msgInput.value, watermarkInput.value, function(canvas) {
                    const dataURL = canvas.toDataURL('image/png');
                    const imgElem = document.createElement('img');
                    imgElem.src = dataURL;
                    outputDiv.innerHTML = '';
                    outputDiv.appendChild(imgElem);
                    downloadLink.href = dataURL;
                    downloadLink.style.display = 'inline-block';
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(imgInput.files[0]);
    };
    // DECODE
    document.getElementById('decode-btn').onclick = function() {
        const imgInput = document.getElementById('decode-image-input');
        const outputDiv = document.getElementById('decoded-message-output');
        const decodedImgDiv = document.getElementById('decoded-image-output');
        outputDiv.innerHTML = '';
        decodedImgDiv.innerHTML = '';
        if (!imgInput.files[0]) {
            alert('Please provide an image to decode.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new window.Image();
            img.onload = function() {
                // Show the image as result
                const imgElem = document.createElement('img');
                imgElem.src = e.target.result;
                decodedImgDiv.appendChild(imgElem);
                decodeMessageFromImage(img, function(message) {
                    outputDiv.innerHTML = '<div style="font-weight:bold;font-size:1.1em;margin-bottom:8px;">Hasil Dekripsi:</div>' +
                        '<div><span style="font-weight:600;">Pesan Rahasia:</span> <span style="color:#007bff;">' + (message ? message : '(tidak ada pesan)') + '</span></div>';
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(imgInput.files[0]);
    };
}; 