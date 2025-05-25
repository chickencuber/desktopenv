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

root.style.background = "#252d35";

async function loadApps() {
    const p = await FS.getFromPath("/user/desktop/apps");
    const o = [];
    for(const f of p) {
        try {
            const j = JSON.parse(await FS.getFromPath(f))
            o.push(j);
        } catch(e) {}
    }
    return o;
}

const scroll = new Div({
    style: {
        border_width: 0,
    }
})

root.child(scroll);

async function update() {
    scroll.children = [];
    const apps = await loadApps();
    let y = 5;
    for(const app of apps) {
        const h = new Button({
            style: {
                border_width: 0,
                background: "#00000000"
            },
            style_hover: {
                background: "#555D65",
            }
        });
        h.rect.absolute = false;
        h.rect.y = y;
        const text = new Div({
            text: app.name,
            style: {
                border_width: 0,
                color: "white",
            }
        });
        text.rect.absolute = false;
        text.rect.x = text.rect.height;
        text.rect.height += 3;
        const img = new Img({
            props: {
                image: loadImage(await getFile(app.icon ?? "~/icons/default.png")),
            },
            style: {
                border_width: 0,
            }
        })
        img.rect.width = text.rect.height;
        img.rect.height = text.rect.height;
        text.rect.x = text.rect.height + 2;
        img.rect.absolute = false;
        h.child(text, img)
        h.rect.width = vw(100);
        h.rect.height = text.rect.height;
        y += h.rect.height;
        h.on(Event.mousePressed, () => {
            Shell.toggleMenu();
            Shell.runApp(app.exec);
        })
        scroll.child(h);
    }
}

let count = 0;
update();

root.on(Event.tick, () => {
    count ++;
    if(count >= 3000) {
        count = 0;
        update();
    }
});

await run()
