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
const desktop = new Div();
const windows = new Div();
const bar = new Div();

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
    const shell = fakeShell(
        () => functions.x(),
        () => functions.y(),
        () => functions.w(),
        () => functions.h(),
    )
    shell.runApp = runApp;
    shell._functions = functions;
    shell.run(app).then(() => {
        shells.splice(shells.indexOf(shell), 1);
        if(shell.gl.ready) {
            shell.gl.ready = false;
            shell.gl.canvas.remove();
            shell.gl.canvas = false;
        }
    });
    shells.push(shell);
}

let dragging = false;

function drag(elt, {on_drag_start = () => {}, while_drag = () => {}, on_drag_end = () => {}, block_x = false, block_y = false, no_children = false} = {}) {
    let drag = false;
    let cx = 0;
    let cy = 0;
    elt.on(Event.mousePressed, () => {
        if(dragging) return;
        if(no_children) for(const child of elt.children) {
            if(child.collide()) {
                return;
            }
        }
        drag = true;
        dragging = true;
        cx = Shell.gl.mouse.x - elt.rect.x;
        cy = Shell.gl.mouse.y - elt.rect.y;
        on_drag_start();
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
    drag(window, {
        no_children: true,
        on_drag_start() {
            Shell.gl.cursor= "grabbing";
        },
        on_drag_end() {
            Shell.gl.cursor = "default";
        },
    })
    window.on(Event.mousePressed, () => {
        to_front(window);
    })
    const s = 400;
    window.rect.width = s + 10;
    window.rect.height = s + 20;
    const img = new Img({
        props: {
            image: shell.gl.canvas
        },
        style: {
             border_width: 1,           
        }
    })
    img.rect.x = 5;
    img.rect.y = 15;
    img.rect.width = window.rect.width - 10;
    img.rect.height = window.rect.height - 20;
    img.rect.absolute = false;
    let pw = 400;
    let ph = 400;
    img.on(Event.keyPressed, (...args) => {
        shell.keyPressed(...args);
    });
    img.on(Event.keyReleased, (...args) => {
        shell.keyReleased(...args);
    });
    img.on(Event.mouseClicked, (...args) => {
        shell.mouseClicked(...args);
    });
    img.on(Event.mouseDragged, (...args) => {
        shell.mouseDragged(...args);
    });
    img.on(Event.mousePressed, (...args) => {
        shell.mousePressed(...args);
    });
    img.on(Event.mouseReleased, (...args) => {
        shell.mouseReleased(...args);
    });
    img.on(Event.mouseMoved, (...args) => {
        shell.mouseMoved(...args);
    });
    img.on(Event.mouseWheel, (...args) => {
        shell.mouseWheel(...args);
    });
    img.on(Event.tick, () => {
        if(!shells.includes(shell)) {
            window.remove();
        }
        if(pw !== img.getRect().width || ph !== img.getRect().height) {
            pw = img.getRect().width; 
            ph = img.getRect().height; 
            shell.windowResized();
        }
        if(shell.gl.ready) {
            shell.gl.draw();
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
    handle_x.rect.y = 15
    let hx = false;
    handle_x.on(Event.tick, () => {
        if(dragging) return;
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
        while_drag() {
            window.rect.width = (handle_x.getRect().x + 5) - window.rect.x;
            if(window.rect.width < 200) {
                window.rect.width = 200;
                handle_x.rect.x = window.rect.width - 5;
            }
            handle_y.rect.width = window.rect.width - 5;
            handle_c.rect.x = window.rect.width - 5;
            img.rect.width = window.rect.width - 10;
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
        while_drag() {
            window.rect.height = (handle_y.getRect().y + 5) - window.rect.y;
            if(window.rect.height < 200) {
                window.rect.height = 200;
                handle_y.rect.y = window.rect.height - 5;
            }
            handle_x.rect.height = vh(100, window) - 20;
            handle_c.rect.y = window.rect.height - 5;
            img.rect.height= window.rect.height - 20;
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
        if(handle_c.hover) {
            Shell.gl.cursor = "nw-resize";
            hc = true;
        } else if (hc) {
            Shell.gl.cursor = "default";
            hc = false;
        }
    });
    drag(handle_c, {
        while_drag() {
            window.rect.height = (handle_c.getRect().y + 5) - window.rect.y;
            if(window.rect.height < 200) {
                window.rect.height = 200;
                handle_c.rect.y = window.rect.height - 5;
            }
            handle_x.rect.height = vh(100, window) - 20;
            img.rect.height= window.rect.height - 20;           

            window.rect.width = (handle_c.getRect().x + 5) - window.rect.x;
            if(window.rect.width < 200) {
                window.rect.width = 200;
                handle_c.rect.x = window.rect.width - 5;
            }
            handle_y.rect.width = window.rect.width - 5;
            img.rect.width = window.rect.width - 10;
            handle_x.rect.x = window.rect.width - 5;
            handle_y.rect.y = window.rect.height - 5;
        }
    })

    shell._functions.x = () => Shell.gl.mouse.x - img.getRect().x;
    shell._functions.y = () => Shell.gl.mouse.y - img.getRect().y;
    shell._functions.w = () => img.getRect().width;
    shell._functions.h = () => img.getRect().height;
    shell.gl.setup();

    window.child(img, handle_x, handle_y, handle_c);
    windows.child(window);
}

runApp("/bin/desktop/game.exe")

root.on(Event.tick, () => {
    for(const shell of shells) {
        if (shell.gl.ready && !shell.gl.has_window) {
            shell.gl.has_window = true;
            createWindow(shell);
        }
    }
})

root.on(Event.windowResized, () => {
    background.rect.width = vw(100);
    background.rect.height = vh(100);
})

return await run();


