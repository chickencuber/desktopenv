if(!Shell.in_desktop) return "must be launched in a desktop enviroment";
const { Event, Button, Div, Element, root, vw, vh, ScrollableVert  } = await use(
  "~/ui.exe"
);
const icon = loadImage(await getFile("~/icons/widget_manager.png"));
Shell.icon = icon;
Shell.name = "Widget Manager";

const port = Shell.listenPort("6969");

async function addWidget(name) {
    await FS.addFile("/user/desktop/desktop/" + crypto.randomUUID()+".json", JSON.stringify({
        path: name,
        type: "widget",
        x: 0,
        y: 0,
    }, null, 2));
    port.send("Refresh")
}

const scroll = new ScrollableVert();
scroll.rect.height = vh(100);
scroll.rect.width = vw(100);
root.on(Event.windowResized, () => {
    scroll.rect.height = vh(100);
    scroll.rect.width = vw(100);
});

let y = 0;
for(const w of await FS.getFromPath("/user/desktop/widgets")) {
    const json = JSON.parse(await FS.getFromPath(w));
    const b = new Button({
        text: " " + json.name 
    });
    b.rect.x = 5;
    b.rect.y = y;
    b.rect.width = vw(100)-10;
    b.on(Event.mousePressed, () => {
        addWidget(w)
    })
    y+=b.rect.height+5;
    scroll.child(b)
}
root.child(scroll);

await run();
