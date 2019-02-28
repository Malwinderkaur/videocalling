//Drawing variables
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var drawing = false;
var current = {
    color: 'blue'
};

canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseUp, false);
canvas.addEventListener('mousemove', onMouseMove, false);

function takePicture() {
    clearCanvas()
    
    var video = document.getElementById('webrtc-remotevid');

	var w = 480//video.clientWidth
	var h = 270//video.clientHeight
	canvas.width = w;
	canvas.height = h;
    
	context.drawImage(video,0,0,w,h);

    app.call.telestration = true
}

function drawLine(x0, y0, x1, y1, color, ) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
}

function onMouseDown(e) {
    drawing = true;
    var mouse = getMousePos(e)
    current.x = mouse.x
    current.y = mouse.y
}

function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    var mouse = getMousePos(e)
    drawLine(current.x, current.y, mouse.x, mouse.y, current.color);

    sendTelestration()
}

function onMouseMove(e) {
    if (!drawing) { return; }
    var mouse = getMousePos(e)
    drawLine(current.x, current.y, mouse.x, mouse.y, current.color);
    current.x = mouse.x;
    current.y = mouse.y;
}

function  getMousePos(evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y
  
    return {
      x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
  }

  function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    app.call.telestration = false
  }


function sendTelestration() {
    console.log('sending telestration')
    var imageStr = canvas.toDataURL()
    //remove the invalid, non-base64 data from the string
    imageStr = imageStr.split(',')
    var base64 = ''
    for(var index = 1; index < imageStr.length; index++) {
        base64 += imageStr[index]
    }
    
    app.call.telestration = true
    sendPrivateMessage('telestration',otherPartySocketId,{
        image: true,
        buffer: base64
    })
}