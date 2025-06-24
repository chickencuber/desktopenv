if(!Shell.in_desktop) return "must be launched in a desktop enviroment";
const { Event, Button, Div, Element, root, vw, vh, Img } = await use(
  "~/ui.exe"
);

Shell.icon = loadImage(await getFile("~/icons/image.png"))

if (!args[0]) return "requires arg";


Shell.name = args[0].toPath(Shell);

const img = new Img({
    style: {
        border_width: 0,
    }
});

const src = await FS.getFromPath(args[0].toPath(Shell));

img.props.image = loadImage(src, () => {
  const wa = img.props.image.width;
  const ha = img.props.image.height;

  const a = wa / ha;
  function resize() {
    const w = root.rect.width;
    const h = root.rect.height;
    let nw = 0;
    let nh = 0;
    if (w/h<a) {
      nw = w;
      nh = w / a;
    } else {
      nw = a * h;
      nh = h;
    }
    img.rect.width = nw;
    img.rect.height = nh;
    img.rect.x = vw(50) - nw / 2;
    img.rect.y = vh(50) - nh / 2;
  }

  resize();

  root.child(img);

  root.on(Event.windowResized, () => {
    resize();
  });
});

return await run();
