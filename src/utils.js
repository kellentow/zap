var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var GlobalContent = [];

function onTick() {
    // Redraw all stamped images
    for (var i = 0; i < GlobalContent.length; i++) {
        content = GlobalContent[i]
        if (content.type == "image") {
            ctx.drawImage(content.content, content.x, content.y, content.w, content.h);
        } else if (content.type == "video") {
            ctx.drawImage(content.content, content.x, content.y, content.w, content.h);
        } else if (content.type == "text") {
            ctx.font = content.font || "16px Arial";
            ctx.fillStyle = content.color || "black";
            ctx.fillText(content.text, content.x, content.y);
        } else if (content.type == "rect") {
            ctx.fillStyle = content.color || "black";
            ctx.fillRect(content.x, content.y, content.w, content.h);
        } else if (content.type == "object") {
            if (content.onTick) {
                content.onTick(ctx, content.x, content.y, content.w, content.h);
            }
            if (content.draw) {
                content.draw(ctx, content.x, content.y, content.w, content.h);
            }
        }
    }
    requestAnimationFrame(onTick)
}

function stampURI(uri, x, y, w, h) {
    x = x || 0
    y = y || 0
    var img = new Image()
    img.src = uri
    img.onload = function () {
        w = w || img.width
        h = h || img.height
        GlobalContent.push({ content: img, type: "image", x: x, y: y, w: w, h: h })
    };
}

function stampURIvideo(uri, x, y, w, h) {
    x = x || 0
    y = y || 0
    var vid = document.createElement('video');
    vid.src = uri;
    vid.loop = true;
    vid.muted = true;
    vid.onloadedmetadata = function () {
        vid.play();
        w = w || vid.width;
        h = h || vid.height;
        GlobalContent.push({ content: vid, type: "video", x: x, y: y, w: w, h: h });
    };
}

requestAnimationFrame(onTick)

export {stampURI, stampURIvideo};