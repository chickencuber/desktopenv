const {
    Element,
    Button,
    Div,
    root,
    vw,
    vh,
    Event,
    Img,
    TextInput,
} = await use("~/../../ui.exe");

root.style.background = "#000000"

let p = 0;

const colors = [
    "#000000",
    "#0000ff",
    "#ffffff",
    "#00ff00",
    "#ffff00",
    "#ff0000",
]

let tc = 0;

root.on(Event.tick, () => {
    tc++;
    if(tc > 50) {
        tc = 0;
        p++;
        p = p%colors.length;
        root.style.background = colors[p]
    }
})

await run();

