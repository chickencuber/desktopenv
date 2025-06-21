
if(!Shell.in_desktop) return "must be launched in a desktop enviroment";
const icon = loadImage(await getFile("~/../icons/files.png"));
Shell.icon = icon;
Shell.name = "Files";
const { Event, Button, Div, Element, root, vw, vh, Img } = await use(
    "~/../ui.exe"
);

root.child(new Div({text:"in development", style:{color:"#ffffff"}}))

await run();
