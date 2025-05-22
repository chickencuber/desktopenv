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

const _default = loadImage(await getFile("~/icons/default.png"))

const background = new Img({
    props: {
        image: loadImage(await getFile("/user/desktop/wallpaper.png"))
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
const foreground = new Div({
    style: {
        border_width: 0,
    }
});

root.child(background, desktop, windows, foreground);

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
        text: "\u{1F5D9}", 
        style: {
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
    img.on(Event.tick, (t = false) => {
        if(!shells.includes(shell)) {
            window.remove();
        }
        if(pw !== img.getRect().width || ph !== img.getRect().height) {
            pw = img.getRect().width; 
            ph = img.getRect().height; 
            shell.shell.windowResized();
        }
        if(shell.shell.gl.ready) {
            shell.shell.gl.draw(t);
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

const bar = new Div({
    props: {
        active: 0,
        speed: 4,
    },
    style: {
        border_width: 0,
        background: "#252d35",
        border_radius: 20,
    },
});
bar.rect.width = root.rect.width;
bar.rect.height = 80;
bar.rect.y = vh(100) - bar.props.active;

let menu = false;


const menu_elt = new Div({
    props: {
        active: 0,
        speed: 20,
    },
    style: {
        background: "#252d35",
        border_width: 0,
        border_radius: 20,
    },
});

menu_elt.rect.width = 400;
menu_elt.rect.height = 400;
menu_elt.rect.x = -menu_elt.rect.width;
menu_elt.rect.y = vh(100) - (bar.rect.height / 2 + 5)- menu_elt.rect.height;

root.on(Event.tick, () => {
    if(Shell.gl.mouse.y >= vh(100) - 10 || menu) {
        bar.props.active += bar.props.speed;
        if(bar.props.active > bar.rect.height / 2) {
            bar.props.active = bar.rect.height / 2;
        }
    } else if(Shell.gl.mouse.y < vh(100) - bar.rect.height / 2) {
        bar.props.active -= bar.props.speed;
        if(bar.props.active < 0) {
            bar.props.active = 0;
        }
    }
    bar.rect.y = vh(100) - bar.props.active;
    if(menu) {
        menu_elt.props.active += menu_elt.props.speed;
        if(menu_elt.props.active > menu_elt.rect.width / 2) menu_elt.props.active = menu_elt.rect.width / 2
    } else {
        menu_elt.props.active -= menu_elt.props.speed;
        if(menu_elt.props.active < 0) menu_elt.props.active = 0;
    }
    menu_elt.rect.x = (-menu_elt.rect.width) + menu_elt.props.active
});

root.on(Event.windowResized, () => {
    bar.rect.width = root.rect.width;
    bar.rect.y = vh(100) - bar.props.active;
    menu_elt.rect.y = vh(100) - (bar.rect.height / 2 + 2)- menu_elt.rect.height;
});

foreground.child(bar, menu_elt);

const button = new Button({
    text: "\u2022",
    style: {
        background: "#40464e",
        color: "white",
        border_radius: 100,
        border_width: 0,
        margin_left: 8.5,
        margin_top: -10.5,
        size: 40,
        font: Shell.gl.fonts.Symbols,
    } 
});


button.rect.absolute = false;
button.rect.x = 2;
button.rect.y = 2;
button.rect.width = 35;
button.rect.height = 35;

const power = new Button({
    text: "\u23FB",
    style: {
        background: "#40464e",
        color: "white",
        border_radius: 100,
        border_width: 0,
        margin_top: -1,
        margin_left: 4,
        font: Shell.gl.fonts.Symbols,
    }
})

power.rect.absolute = false;
power.rect.width = 25;
power.rect.height = 25;
power.rect.x = vw(100, menu_elt) - power.rect.width - 5;
power.rect.y = vh(100, menu_elt) - power.rect.height - 5;

menu_elt.child(power);

function toggleMenu() {
    menu = !menu
    if(menu) {
        button.style.background = "#98cbff";
        button.style.color = "#40464e";
    } else {
        button.style.background = "#40464e";
        button.style.color = "white";
    }
}

button.on(Event.mousePressed, () => {
    toggleMenu();
});

bar.child(button)

root.on(Event.mousePressed, () => {
    if(bar.collide() || menu_elt.collide() || !menu) return;
    toggleMenu()
})

root.on(Event.keyPressed, (key) => {
    if(key == ALT) {
        toggleMenu();
    }
});

const applets = []

function createApplet(app, ctx) {
    const applet= fakeShell(
            () => Shell.gl.mouse.x - ctx.getRect().x,
            () => Shell.gl.mouse.y - ctx.getRect().y,
            () => ctx.getRect().width,
            () => ctx.getRect().height,
        );
    applet.runApp = runApp;
    ctx.on(Event.tick, (f = false) => {
        ctx.props.image = applet.gl.canvas;
        if(!applet.gl.canvas) return;
        if(pw !== ctx.getRect().width || ph !== ctx.getRect().height) {
            pw = ctx.getRect().width; 
            ph = ctx.getRect().height; 
            applet.windowResized();
        }
        applet.gl.draw(f);
    });
    let pw = 400;
    let ph = 400;
    ctx.on(Event.keyPressed, (...args) => {
        applet.keyPressed(...args);
    });
    ctx.on(Event.keyReleased, (...args) => {
        applet.keyReleased(...args);
    });
    ctx.on(Event.mouseClicked, (...args) => {
        applet.mouseClicked(...args);
    });
    ctx.on(Event.mouseDragged, (...args) => {
        applet.mouseDragged(...args);
    });
    ctx.on(Event.mousePressed, (...args) => {
        applet.mousePressed(...args);
    });
    ctx.on(Event.mouseReleased, (...args) => {
        applet.mouseReleased(...args);
    });
    ctx.on(Event.mouseMoved, (...args) => {
        applet.mouseMoved(...args);
    });
    ctx.on(Event.mouseWheel, (...args) => {
        applet.mouseWheel(...args);
    });

    applet.run(app).then(() => {
        if(applet.gl.canvas) {
            const h = applet.gl.canvas;
            applet.gl.canvas = undefined;
            h.remove()
        }
        applets.splice(applets.indexOf(applet), 1);
    });
    applets.push(applet);
    return applet;
}

const menu_applet = new Img({
    style: {
        border_width: 0,
    }
});

menu_applet.rect.width = menu_elt.rect.width / 2 - 20;
menu_applet.rect.height = menu_elt.rect.height - 30;
menu_applet.rect.x = menu_elt.rect.width / 2;
menu_applet.rect.absolute = false;
createApplet("/bin/desktop/applets/menu.exe", menu_applet).toggleMenu = toggleMenu;
menu_elt.child(menu_applet);

function clean() {
    for(const shell of shells) {
        shell.shell.exit = true;
    }
    for(const applet of applets) {
        applet.exit = true;
    }
}

await run(r => {
    power.on(Event.mousePressed, () => {
        clean()
        r();
    })
});


