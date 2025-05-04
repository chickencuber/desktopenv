const {
    Element,
    Button,
    Div,
    root,
    vw,
    vh,
    Event,
    Img,
} = await use("~/ui.exe");

const _default = loadImage(getFile("~/icons/default.png"))

const background = new Img(
    {
        props: {
            image: loadImage(getFile("~/wallpapers/default.png"))
        },
        style: {
            border_width: 0,
        }
})
background.rect.width = vw(100);
background.rect.height = vh(100);
const desktop = new Div({
    style: {
        border_width: 0,
    }
});
const windows = new Div({
    style: {
        border_width: 0,
    }
});
const bar = new Div({
    style: {
        border_width: 0,
    }
});

root.child(background, desktop, windows, bar)

const {fakeShell} = await use("~/fakeShell.exe");
const shells = [];
function runApp(app) {
    const functions = {
        x: () => 0,
        y: () => 0,
        w: () => 400,
        h: () => 400,
    }
    const shell = {
        shell: fakeShell(
            () => functions.x(),
            () => functions.y(),
            () => functions.w(),
            () => functions.h(),
        ),
        app,
    }
    shell.shell.runApp = runApp;
    shell.shell._functions = functions;
    shell.shell.run(app).then(() => {
        shells.splice(shells.indexOf(shell), 1);
        if(shell.shell.gl.ready) {
            shell.shell.gl.ready = false;
            shell.shell.gl.canvas.remove();
            shell.shell.gl.canvas = false;
        }
    });
    shells.push(shell);
}

let dragging = false;

function drag(elt, {on_drag_start = () => {}, while_drag = () => {}, on_drag_end = () => {}, allow=[], block_x = false, block_y = false, no_children = false} = {}) {
    let drag = false;
    let cx = 0;
    let cy = 0;
    elt.on(Event.mousePressed, () => {
        if(dragging) return;
        if(no_children) for(const child of elt.children) {
            if(allow.includes(child)) {
                continue;
            }
            if(child.collide()) {
                return;
            }
        }
        drag = true;
        dragging = true;
        cx = Shell.gl.mouse.x - elt.rect.x;
        cy = Shell.gl.mouse.y - elt.rect.y;
        if(on_drag_start()) {
            dragging = false;
            drag = false;
        }
    });
    root.on(Event.mouseMoved, () => {
        if(!drag) return;
        if(!block_x)
            elt.rect.x = Shell.gl.mouse.x - cx;
        if(!block_y) 
            elt.rect.y = Shell.gl.mouse.y - cy;
        while_drag();
    })
    root.on(Event.mouseReleased, () => {
        if(drag) {
            drag = false;
            dragging = false;
            on_drag_end();
        }
    })
}

function to_front(elt) {
    elt.parent.children.splice(elt.parent.children.indexOf(elt), 1);
    elt.parent.child(elt);
}

function createWindow(shell) {
    const window = new Div({
        style: {
            background: "#ffffff",
        }
    });
    const s = 400;
    window.rect.width = s + 10;
    window.rect.height = s + 25;
    const close = new Button({
        text: "\u{1F5D9}", style: {
            background: "#f00",
            border_width: 0,
            font: Shell.gl.fonts.Symbols,
        }, 
        style_hover: {
            background: "#d00"
        }
    })

    close.style.margin_left = 3;
    close.style.margin_top = -7;
    close.rect.absolute = false;
    close.rect.autosize = false;

    close.rect.height = close.rect.width;
    close.rect.x = window.rect.width - close.rect.width - 2;
    close.on(Event.mousePressed, () => shell.shell.exit = true)

    const change_size = new Button({
        text: "\u{1F5D6}", style: {
            border_width: 0,
            size: 17,
            font: Shell.gl.fonts.Symbols,
        }, 
    })



    change_size.style.margin_left = 2;
    change_size.rect.y = 1;
    change_size.style.margin_top = -2;
    change_size.rect.absolute = false;
    change_size.rect.autosize = false;
    let full = false;
    let prew;
    change_size.rect.height = change_size.rect.width - 1;
    change_size.rect.x = close.rect.x - change_size.rect.width - 5;
    change_size.on(Event.mousePressed, () => {
        if(!full) {
            prew = {
                x: window.rect.x,
                y: window.rect.y,
                width: window.rect.width,
                height: window.rect.height,
            }
            window.rect.x = 0;
            window.rect.y = 0;
            window.rect.width = vw(100);
            window.rect.height = vh(100);
            change();
            full = true;
            change_size.text = "\u{1F5D7}"
        } else {
            window.rect.x = prew.x;
            window.rect.y = prew.y;
            window.rect.width = prew.width;
            window.rect.height = prew.height;
            change();
            full = false;
            change_size.text = "\u{1F5D6}";
        }
        change_size.hover = change_size.collide();
    });

    const icon = new Img({
        style: {
            border_width: 1,
        }
    });
    icon.props = new Proxy({}, {
        get() {
            return shell.shell.icon ?? _default;
        }
    })
    icon.rect.width = close.rect.width - 2;
    icon.rect.height = close.rect.height - 2;
    icon.rect.absolute = false;
    icon.rect.x = 5;
    const name = new Div({
        style: {
            border_width: 0,
            size:17,
        }
    });

    name.style.margin_top = 2;
    name.rect.absolute = false;
    name.on(Event.tick, () => {
        const max = window.rect.width / 10 - 5;
        name.text = (shell.shell.name ?? shell.app).toString().slice(0, max)
    })
    name.rect.x = close.rect.width + 7;

    drag(window, {
        no_children: true,
        allow: [name],
        on_drag_start() {
            if(full) {
                return true;
            }
            Shell.gl.cursor= "grabbing";
        },
        on_drag_end() {
            Shell.gl.cursor = "default";
        },
    })
    window.on(Event.mousePressed, () => {
        to_front(window);
    })
    const img = new Img({
        props: {
            image: shell.shell.gl.canvas
        },
        style: {
             border_width: 1,           
        }
    })
    img.rect.x = 5;
    img.rect.y = 20;
    img.rect.width = window.rect.width - 10;
    img.rect.height = window.rect.height - 25;
    img.rect.absolute = false;
    let pw = 400;
    let ph = 400;
    img.on(Event.keyPressed, (...args) => {
        shell.shell.keyPressed(...args);
    });
    img.on(Event.keyReleased, (...args) => {
        shell.shell.keyReleased(...args);
    });
    img.on(Event.mouseClicked, (...args) => {
        shell.shell.mouseClicked(...args);
    });
    img.on(Event.mouseDragged, (...args) => {
        shell.shell.mouseDragged(...args);
    });
    img.on(Event.mousePressed, (...args) => {
        shell.shell.mousePressed(...args);
    });
    img.on(Event.mouseReleased, (...args) => {
        shell.shell.mouseReleased(...args);
    });
    img.on(Event.mouseMoved, (...args) => {
        shell.shell.mouseMoved(...args);
    });
    img.on(Event.mouseWheel, (...args) => {
        shell.shell.mouseWheel(...args);
    });
    img.on(Event.tick, () => {
        if(!shells.includes(shell)) {
            window.remove();
        }
        if(pw !== img.getRect().width || ph !== img.getRect().height) {
            pw = img.getRect().width; 
            ph = img.getRect().height; 
            shell.shell.windowResized();
        }
        if(shell.shell.gl.ready) {
            shell.shell.gl.draw();
        }
    })

    const handle_x = new Div({
        style: {
            border_width: 0,
        }
    });
    handle_x.rect.height = vh(100, window) - 20;
    handle_x.rect.width = 7;
    handle_x.rect.absolute = false;
    handle_x.rect.x = vw(100, window) - 5;
    handle_x.rect.y = 20; 
    let hx = false;
    handle_x.on(Event.tick, () => {
        if(dragging) return;
        if(full) {
            Shell.gl.cursor = "default";
            hx = false;
            return;
        }
        if(handle_x.hover) {
            Shell.gl.cursor = "ew-resize";
            hx = true;
        } else if (hx) {
            Shell.gl.cursor = "default";
            hx = false;
        }
    });
    drag(handle_x, {
        block_y: true,
        allow: [name],
        on_drag_start() {
            return full;
        },
        while_drag() {
            window.rect.width = (handle_x.getRect().x + 5) - window.rect.x;
            if(window.rect.width < 200) {
                window.rect.width = 200;
                handle_x.rect.x = window.rect.width - 5;
            }
            change()
        }
    })


    const handle_y = new Div({
        style: {
            border_width: 0,
        }
    });
    handle_y.rect.height = 7;
    handle_y.rect.width = window.rect.width - 5;
    handle_y.rect.absolute = false;
    handle_y.rect.x = 0;
    handle_y.rect.y = window.rect.height - 5;
    let hy = false;
    handle_y.on(Event.tick, () => {
        if(dragging) return;
        if(full) {
            Shell.gl.cursor = "default";
            hy = false;
            return;
        }
        if(handle_y.hover) {
            Shell.gl.cursor = "ns-resize";
            hy = true;
        } else if (hy) {
            Shell.gl.cursor = "default";
            hy = false;
        }
    });
    drag(handle_y, {
        block_x: true,
        allow: [name],
        on_drag_start() {
            return full;
        },
        while_drag() {
            window.rect.height = (handle_y.getRect().y + 5) - window.rect.y;
            if(window.rect.height < 200) {
                window.rect.height = 200;
                handle_y.rect.y = window.rect.height - 5;
            }
            change()
        }
    })

    const handle_c = new Div({
        style: {
            border_width: 0,
        }
    });
    handle_c.rect.height = 7;
    handle_c.rect.width =  7;
    handle_c.rect.absolute = false;
    handle_c.rect.x = window.rect.width - 5;
    handle_c.rect.y = window.rect.height - 5;
    let hc = false;
    handle_c.on(Event.tick, () => {
        if(dragging) return;
        if(full) {
            Shell.gl.cursor = "default";
            hc = false;
            return;
        }
        if(handle_c.hover) {
            Shell.gl.cursor = "nw-resize";
            hc = true;
        } else if (hc) {
            Shell.gl.cursor = "default";
            hc = false;
        }
    });
    drag(handle_c, {
        allow: [name],
        on_drag_start() {
            return full
        },
        while_drag() {
            window.rect.height = (handle_c.getRect().y + 5) - window.rect.y;
            if(window.rect.height < 200) {
                window.rect.height = 200;
                handle_c.rect.y = window.rect.height - 5;
            }

            window.rect.width = (handle_c.getRect().x + 5) - window.rect.x;
            if(window.rect.width < 200) {
                window.rect.width = 200;
                handle_c.rect.x = window.rect.width - 5;
            }
            change();
        }
    })

    shell.shell._functions.x = () => Shell.gl.mouse.x - img.getRect().x;
    shell.shell._functions.y = () => Shell.gl.mouse.y - img.getRect().y;
    shell.shell._functions.w = () => img.getRect().width;
    shell.shell._functions.h = () => img.getRect().height;
    shell.shell.gl.setup();


    function change() {
        handle_y.rect.width = window.rect.width - 5;
        img.rect.width = window.rect.width - 10;
        handle_x.rect.x = window.rect.width - 5;
        handle_y.rect.y = window.rect.height - 5;
        close.rect.x = window.rect.width - close.rect.width - 2;
        change_size.rect.x = close.rect.x - change_size.rect.width - 5;
        handle_c.rect.x = window.rect.width - 5;
        handle_c.rect.y = window.rect.height - 5;
        handle_x.rect.height = vh(100, window) - 20;
        img.rect.height= window.rect.height - 25;     
    }

    window.child(img, handle_x, handle_y, handle_c,name, close, change_size, icon);
    windows.child(window);
}

runApp("/bin/desktop/game.exe")
runApp("examples graphics")

root.on(Event.tick, () => {
    for(const shell of shells) {
        if (shell.shell.gl.ready && !shell.shell.gl.has_window) {
            shell.shell.gl.has_window = true;
            createWindow(shell);
        }
    }
})

root.on(Event.windowResized, () => {
    background.rect.width = vw(100);
    background.rect.height = vh(100);
})

return await run();


