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
const _default = loadImage(await getFile("~/../icons/default.png"))
root.style.background = "#252d35";

function onChange(w) {
    [...root.children].forEach(v => v.remove());
    let x = 0;
    for(const win of w) {
        const button = new Img({
            props: new Proxy({}, {
                get() {
                    return win.shell.icon ?? _default
                }
            }),
            style: {
                border_width: 0,
            }
        })
        button.rect.width = vh(100);
        button.rect.height = vh(100);
        button.rect.x = x;
        button.rect.absolute = false;
        button.on(Event.mousePressed, () => {
            win.window.move()
        })
        root.child(button);
        x += button.rect.width + 5;
    }
}

let p = 0;
root.on(Event.tick, () => {
    let w = Shell.get_windows()
    if(w.length !== p) {
        onChange(w);
        p = w.length;
    }
})

await run()
