const {
    Element,
    Button,
    Div,
    root,
    vw,
    vh,
    Event,
    Img,
} = await use("~/../ui.exe");
root.style.background = "#00000000";

let dragging = false;

function drag(elt, allow = () => {}, onEnd = () => {}) {
    let drag = false;
    let cx = 0;
    let cy = 0;
    elt.on(Event.mousePressed, (mouse) => {
        if(!allow()) {
            return;
        }
        if(mouse === RIGHT) return;
        if(dragging) return;
        drag = true;
        dragging = true;
        cx = Shell.gl.mouse.x - elt.rect.x;
        cy = Shell.gl.mouse.y - elt.rect.y;
    });
    function moved() {
        if(!drag) return;
        elt.rect.x = Shell.gl.mouse.x - cx;
        elt.rect.y = Shell.gl.mouse.y - cy;
    }

    root.on(Event.mouseMoved, moved)
    function released() {
        if(drag) {
            drag = false;
            dragging = false;
            onEnd();
        }
    }
    root.on(Event.mouseReleased, released);
    elt.on(Event.removed, () => {
        root.removeEvent(Event.mouseReleased, released);
        root.removeEvent(Event.mouseMoved, moved);
    });
}


async function loadApps() {
    const p = await FS.getFromPath("/user/desktop/desktop");
    const o = [];
    for(const f of p) {
        if(!f.endsWith(".json")) continue;
        try {
            const j = JSON.parse(await FS.getFromPath(f))
            o.push({json: j, path: f});
        } catch(e) {}
    }
    return o;
}

function launch(app) {
    if(app.terminal) {
        Shell.runApp("/bin/desktop/terminal/terminal.exe " + app.exec);
    } else {
        Shell.runApp(app.exec);
    }
}

async function viewdesktopentry(app, p, json) {
    const h = new Button({
        style: {
            border_width: 0,
            background: "#00000000"
        },
        style_hover: {
            background: "#FFFFFF70",
        }
    });
    const img = new Img({
        props: {
            image: loadImage(await getFile(app.icon ?? "~/icons/default.png")),
        },
        style: {
            border_width: 0,
        }
    });
    img.rect.width = 40;
    img.rect.height = 40;
    img.rect.absolute = false;
    h.child(img);
    h.rect.x = json.x;
    h.rect.y = json.y;
    h.rect.width = 40;
    h.rect.height = 50;
    const text = new Div({
        text: "T",
        style: {
            border_width: 0,
            color: "black",
            size: 15,
        }
    });
    text.rect.y = vh(100, h)-text.rect.height + 7;
    text.text = app.name.match(/.{1,5}/g).join("\n")
    text.rect.absolute = false;
    h.child(text);
    drag(h, () => editMode, () => {
        json.x = h.rect.x;
        json.y = h.rect.y;
        FS.addFile(p, JSON.stringify(json, null, 2))
    });
    h.on(Event.mousePressed, (v) => {
        if(editMode) return;
        if(v==RIGHT) {
            Shell.openContext({
                async ["Remove From Desktop"](){
                    await FS.delete(p);
                    count = 0;
                    update();
                }
            })
            return;
        }
        launch(app);
    })

    root.child(h);
}

let editMode = false;

async function update() {
    if(editMode) return;
    [...root.children].forEach(v => v.remove());
    const apps = await loadApps();
    for(const _app of apps) {
        const app = _app.json;
        switch(app.type) {
            case "desktopentry":
                await viewdesktopentry(JSON.parse(await FS.getFromPath(app.path)), _app.path, app);                
                break;
        }
    }
}
let count = 0;
update();

const port = Shell.listenPort("6969");
async function recv() {
    while(true) {
        if(await port.recv() === "Refresh") {
            count = 0;
            update();
        }
    }
}

recv();

root.on(Event.mousePressed, (button) => {
    if(root.children.some(v => v.hover)) {
        return;
    }
    if(button === RIGHT) {
        Shell.openContext({
            Refresh() {
                count = 0;
                update();
            },
            [`${editMode? "Exit": "Enter"} Edit Mode`]() {
                editMode = !editMode;            
                if(editMode) {
                    root.style.background = "#00000060";
                } else {
                    root.style.background = "#00000000";
                }
            }
        })
    }
})

root.on(Event.tick, () => {
    count ++;
    if(count >= 3000) {
        count = 0;
        update();
    }
});

await run();

