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
} = await use("~/ui.exe");

const _default = loadImage(await getFile("~/icons/default.png"))

/**
    * @typedef Settings
    * @property {boolean} show_content_while_dragging
    */

/**
    * @type {Settings}
    */
const settings = JSON.parse(await getFile("/user/desktop/settings.json"));
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
const desktop = new Img({
    style: {
        border_width: 0,
    }
});
desktop.rect.x = 0;
desktop.rect.y = 0;
desktop.rect.width = vw(100);
desktop.rect.height = vh(100);
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

//ipc go brrr
class Port {
    #queue = [];
    #recv = [];
    send(item) {
        if(this.#recv.length > 0) {
            this.#recv.shift()(item);
            return;
        }
        this.#queue.push(item);
    }
    recv() {
        return new Promise(r => {
            if(this.#queue.length > 0) {
                r(this.#queue.shift())
                return;
            }
            this.#recv.push(r);
        });
    }
}

const ports = new Map();

function listenPort(port) {
    if(ports.has(port)) {
        return ports.get(port);
    }
    const p = new Port();
    ports.set(port, p);
    return p;
}

const Dialog = (function(){
    /**
        * @type {Array<DialogQueueItem>}
        */
        const queue = [];
    let dialog = null;
    function display() {
        const {returnfn, menu} = queue[0];
        dialog = new Div({
            style: {
                background: "#ffffff",
                border_radius: 10,
            }
        });
        const text = new Div({
            text: menu.text,
            style: {
                border_width: 0,
                size: 30,
            },
        });
        text.rect.absolute = false;
        dialog.child(text);
        foreground.child(dialog);
        const change = 20;
        let width = Math.max(text.rect.width + change, 100);
        let height = 0;
        switch (menu.type) {
            case "menu": {
                const items = typeof menu.items === "object" && !Array.isArray(menu.items)
                ? Object.entries(menu.items)
                : menu.items.map(i => [i, i]);
                let i = text.rect.y + text.rect.height + 5;
                items.forEach(([id, display]) => {
                    const option = new Button()
                    const t = new Div({text: display, style: {border_width: 0}});
                    t.rect.absolute = false;
                    option.child(t)
                    option.rect.y = i;
                    option.rect.absolute = false;
                    dialog.child(option);
                    i+=option.rect.height + 5;
                    option.on(Event.mousePressed, ()=>returnfn(id))
                    height = i;
                    if(option.rect.width + change > width) {
                        width = option.rect.width + change;
                    }
                });
            }
                break;
            case "textInput": {
                const inp = new TextInput();
                inp.rect.y = text.rect.y + text.rect.height + 5;
                inp.rect.absolute = false;
                if(400 + (change) > width) {
                        width = 400 + (change);
                }
                dialog.child(inp);
                const ok = new Button()
                const okt = new Div({text: "OK", style:{border_width: 0}});
                okt.rect.absolute = false;
                ok.child(okt)
                ok.rect.y = inp.rect.y + inp.rect.height + 7;
                ok.rect.absolute = false;
                if(ok.rect.width + change > width) {
                        width = ok.rect.width + change;
                    }
                dialog.child(ok);
                ok.on(Event.mousePressed, ()=>returnfn(inp.text))
                const c = new Button();
                const ct = new Div({text: "CANCEL", style: {border_width: 0}});
                ct.rect.absolute = false;
                c.child(ct)
                c.rect.y = ok.rect.y + ok.rect.height + 5;
                height = c.rect.y + c.rect.height + 5;
                c.rect.absolute = false;
                if(c.rect.width + change > width) {
                    width = c.rect.width + change;
                }
                dialog.child(c);
                c.on(Event.mousePressed, ()=>returnfn(""))
                inp.on(Event.keyPressed, (code) => {
                    if(code === ENTER) {
                        ok.hover = true;
                        ok.mousePressed();
                    }
                });
            }
                break;
        }
        dialog.rect.width = width;
        dialog.rect.height = height;
        dialog.rect.x = vw(50) - vw(50, dialog);
        dialog.rect.y = vh(50) - vh(50, dialog);
        dialog.children.forEach(v => {
            if(v === text) return;
            v.rect.width = width-change;
            v.rect.x = vw(50, dialog) - vw(50, v);
            if(v instanceof TextInput) {
                v.rect.width = width-(change);
                v.rect.x = (vw(50, dialog) - vw(50, v));
                return;
            }
            v.children[0].rect.x = vw(50, v) - vw(50, v.children[0]);
        })
        text.rect.x = vw(50, dialog) - vw(50, text);
        dialog.on(Event.windowResized, () => {
            dialog.rect.x = vw(50) - vw(50, dialog);
            dialog.rect.y = vh(50) - vh(50, dialog);           
        });
    }
    function next() {
        dialog.remove();
        dialog = null;
        queue.shift();
        if(queue.length > 0) {
            display();
        }
    }
    function menu(text, menu) {
        return new Promise(r => {
            queue.push({
                returnfn: v => {r(v);next();},
                menu: {
                    text,
                    type: "menu",
                    items: menu, 
                },
            })
            if(queue.length === 1) {
                display();
            }
        });
    }
    async function alert(text) {
        await menu(text, ["OK"]);//doesn't need to return anything
    }
    async function confirm(text) {
        return ({true:true, false:false})[await (menu(text, {true: "Yes", false: "No"}))];
    }
    function prompt(text) {
        return new Promise(r => {
            queue.push({
                returnfn: v => {r(v);next();},
                menu: {
                    text,
                    type: "textInput",
                },
            })
            if(queue.length === 1) {
                display();
            }
        });
    }
    return {menu, alert, confirm, prompt}; 
})();

root.child(background, desktop, windows, foreground);


let context = null;
let setContext = false;

/**
    * @param {Record<string, () => void>} obj 
    */
function openContext(obj) {
    if(context) return;
    context = new Div({
        style: {
            border_width: 1,
            border_color: "#fff",
            background: "#252d35",
            border_radius: 10,
        }
    })
    let y = 5;
    for(const [k, v] of Object.entries(obj)) {
        const button = new Button({
            text: k,
            style: {
                border_width: 0,
                border_color: "#fff",
                color: "#fff",
                background: "#00000000",
            },
            style_hover: {
                background: "#555D65",
            }
        }) 
        button.on(Event.mousePressed, (mouse) => {
            if(mouse === RIGHT) return;
            v();
        });
        button.rect.absolute = false;
        button.rect.x = 5;
        button.rect.y = y;
        y += button.rect.height + 5;
        context.rect.width = Math.max(context.rect.width, button.rect.width + 10);
        context.child(button);
    } 
    context.rect.height = y + 0;
    for(const child of context.children) {
        child.rect.width = context.rect.width - 10;
    }
    if(Shell.gl.mouse.x + context.rect.width > root.rect.width) {
        context.rect.x = Shell.gl.mouse.x - context.rect.width;
    } else {
        context.rect.x = Shell.gl.mouse.x;
    }
    if(Shell.gl.mouse.y + context.rect.height > root.rect.height) {
        context.rect.y = Shell.gl.mouse.y - context.rect.height;
    } else {
        context.rect.y = Shell.gl.mouse.y;
    }
    foreground.child(context);
    setTimeout(() => {
        setContext = true;
    }, 100);
}

root.on(Event.mousePressed, () => {
    if(context !== null && setContext) {
        context.remove();
        context = null;
        setContext = false;
    }
});

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
        functions,
        app,
        window: null,
    }
    shell.shell.runApp = runApp;
    shell.shell.openContext = openContext;
    shell.shell.Dialog = Dialog;
    shell.shell.listenPort = listenPort;
    shell.shell.gl.resizeWindow = (w, h) => {
        functions.w = () => w;
        functions.h = () => h;
    };
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

function drag(elt, {link = ()=>{}, quit = () => {}, on_drag_start = () => {}, while_drag = () => {}, on_drag_end = () => {}, allow=[], block_x = false, block_y = false, no_children = false} = {}) {
    let drag = false;
    let cx = 0;
    let cy = 0;
    let d;
    quit(() => {
        if(drag) {
            drag = false;
            dragging = false;
            on_drag_end();
        }
    });
    elt.on(Event.mousePressed, (mouse) => {
        if(mouse === RIGHT) return;
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
        d = link() || elt;
        d.rect.x = elt.rect.x;
        d.rect.y = elt.rect.y;
        cx = Shell.gl.mouse.x - elt.rect.x;
        cy = Shell.gl.mouse.y - elt.rect.y;
        if(on_drag_start()) {
            dragging = false;
            drag = false;
        }
    });
    function moved() {
        if(!drag) return;
        if(!block_x)
            d.rect.x = Shell.gl.mouse.x - cx;
        if(!block_y) 
            d.rect.y = Shell.gl.mouse.y - cy;
        while_drag();
    }
    root.on(Event.mouseMoved, moved)
    function released() {
        if(drag) {
            drag = false;
            dragging = false;
            elt.rect.x = d.rect.x;
            elt.rect.y = d.rect.y;
            on_drag_end();
        }

    }
    root.on(Event.mouseReleased, released);
    elt.on(Event.removed, () => {
        root.removeEvent(Event.mouseReleased, released);
        root.removeEvent(Event.mouseMoved, moved);
    });
}

function createWindow(shell) {
    let quitDrag;
    const window = new Div({
        style: {
            background: "#2E2E32",
            border_color: "#ffffff",
            border_radius: 10,
            border_width: 1,
        }
    });
    const border = new Div({
        style: {
            background: "#00000000",
            border_color: "#666666",
            border_radius: 10,
            border_width: 2,
        }
    });
    shell.shell.gl.resizeWindow = (width, height) => {
        window.rect.width = width;
        window.rect.height = height;
        change();
    }
    let show = true;
    const old = window.move.bind(window);
    window.move = function(...args) {
        if(show) {
            return old(...args);
        } else {
            show = true;
            windows.child(window);
        }
    }
    function hide(mouse) {
        if(mouse === RIGHT) return;
        show = false;
        window.remove();
    }
    shell.window = window;
    window.rect.width = shell.functions.w() + 10;
    window.rect.height = shell.functions.h() + 25;
    border.rect.width = window.rect.width;
    border.rect.height = window.rect.height;
    const close = new Button({
        text: "\u{1F5D9}", 
        style: {
            color: "white",
            background: "#00000000",
            border_width: 0,
            font: Shell.gl.fonts.Symbols,
        }, 
        style_hover: {
            background: "#555D65",
        }
    })

    close.style.margin_left = 3;
    close.style.margin_top = -7;
    close.rect.y = 2;
    close.rect.absolute = false;
    close.rect.autosize = false;

    close.rect.height = close.rect.width;
    close.rect.x = window.rect.width - close.rect.width - 5;
    close.on(Event.mousePressed, (mouse) => {
        if(mouse === RIGHT) return;
        shell.shell.exit = true
    })

    const change_size = new Button({
        text: "\u{1F5D6}", 
        style: {
            border_width: 0,
            color: "#ffffff",
            background: "#00000000",
            size: 17,
            font: Shell.gl.fonts.Symbols,
        }, 
        style_hover: {
            background: "#555D65"
        }
    })

    change_size.style.margin_left = 2;
    change_size.rect.y = 1;
    change_size.style.margin_top = -2;
    change_size.rect.absolute = false;
    change_size.rect.autosize = false;
    change_size.rect.height = change_size.rect.width - 1;
    change_size.rect.x = close.rect.x - change_size.rect.width - 5;

    const minimize = new Button({
        text: "\u{1F5D5}", 
        style: {
            border_width: 0,
            color: "#ffffff",
            background: "#00000000",
            size: 17,
            font: Shell.gl.fonts.Symbols,
        }, 
        style_hover: {
            background: "#555D65"
        }
    })

    minimize.style.margin_left = 2;
    minimize.rect.y = 1;
    minimize.style.margin_top = -2;
    minimize.rect.absolute = false;
    minimize.rect.autosize = false;
    minimize.rect.height = minimize.rect.width - 1;
    minimize.rect.x = change_size.rect.x - minimize.rect.width - 5;
    minimize.on(Event.mousePressed, hide);

    let full = false;
    let prew;
    change_size.on(Event.windowResized, () => {
        if(full) {
            window.rect.width = vw(100);
            window.rect.height = vh(100);
            change();
        }
    })
    change_size.on(Event.mousePressed, (mouse) => {
        if(mouse === RIGHT) return;
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
            window.style.border_radius = 0;
            change_size.text = "\u{1F5D7}"
        } else {
            window.rect.x = prew.x;
            window.rect.y = prew.y;
            window.rect.width = prew.width;
            window.rect.height = prew.height;
            window.style.border_radius = 10;
            change();
            full = false;
            change_size.text = "\u{1F5D6}";
        }
        change_size.hover = change_size.collide();
        setTimeout(quitDrag, 0);
    });

    const icon = new Img({
        style: {
            border_width: 0,
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
    icon.rect.x = 6;
    icon.rect.y = 2;
    const name = new Div({
        style: {
            color: "#ffffff",
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
        link: () => settings.show_content_while_dragging? false: border,
        quit(fn) {
            quitDrag = fn;
        },
        no_children: true,
        allow: [name, icon, border],
        on_drag_start() {
            if(full) {
                return true;
            }
            Shell.gl.cursor= "grabbing";
            if(!settings.show_content_while_dragging) {
                border.rect.width = window.rect.width;
                border.rect.height = window.rect.height;
                border.rect.x = window.rect.x;
                border.rect.y = window.rect.y;
                window.child(border);
            }
        },
        on_drag_end() {
            if(!settings.show_content_while_dragging) {
                border.remove();
            }
            Shell.gl.cursor = "default";
        },
    })
    window.on(Event.mousePressed, (mouse) => {
        if(mouse === RIGHT) return;
        if(minimize.hover) return;
        window.move();
    })
    const img = new Img({
        props: {
            image: shell.shell.gl.canvas
        },
        style: {
            border_color: "white",
            border_width: 0,           
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
        shell.shell.keyPressed?.(...args);
    });
    img.on(Event.keyReleased, (...args) => {
        shell.shell.keyReleased?.(...args);
    });
    img.on(Event.mouseClicked, (...args) => {
        shell.shell.mouseClicked?.(...args);
    });
    img.on(Event.mouseDragged, (...args) => {
        shell.shell.mouseDragged?.(...args);
    });
    img.on(Event.mousePressed, (...args) => {
        shell.shell.mousePressed?.(...args);
    });
    img.on(Event.mouseReleased, (...args) => {
        shell.shell.mouseReleased?.(...args);
    });
    img.on(Event.mouseMoved, (...args) => {
        shell.shell.mouseMoved?.(...args);
    });
    img.on(Event.mouseWheel, (...args) => {
        shell.shell.mouseWheel?.(...args);
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
        if(full || !shell.shell.gl.allow_resize) {
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
        allow: [name, border],
        on_drag_start() {
            if(full || !shell.shell.gl.allow_resize) return true;
            if(!settings.show_content_while_dragging) {
                border.rect.width = window.rect.width;
                border.rect.height = window.rect.height;
                border.rect.x = window.rect.x;
                border.rect.y = window.rect.y;
                window.child(border)
            }
        },
        while_drag() {
            if(settings.show_content_while_dragging) {
                window.rect.width = (handle_x.getRect().x + 5) - window.rect.x;
                if(window.rect.width < 200) {
                    window.rect.width = 200;
                    handle_x.rect.x = window.rect.width - 5;
                }
                change()
            } else {
                border.rect.width = (handle_x.getRect().x + 5) - border.rect.x;
                if(border.rect.width < 200) {
                    border.rect.width = 200;
                    handle_x.rect.x = border.rect.width - 5;
                }
            }
        },
        on_drag_end(){
            if(!settings.show_content_while_dragging) {
                border.remove();
                window.rect.width = border.rect.width;
                change();
            }
        },
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
        if(full || !shell.shell.gl.allow_resize) {
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
        allow: [name, border],
        on_drag_start() {
            if(full || !shell.shell.gl.allow_resize) return true;
            if(!settings.show_content_while_dragging) {
                border.rect.width = window.rect.width;
                border.rect.height = window.rect.height;
                border.rect.x = window.rect.x;
                border.rect.y = window.rect.y;
                window.child(border);
            }
        },
        while_drag() {
            if(settings.show_content_while_dragging) {
                window.rect.height = (handle_y.getRect().y + 5) - window.rect.y;
                if(window.rect.height < 200) {
                    window.rect.height = 200;
                    handle_y.rect.y = window.rect.height - 5;
                }
                change()
            } else {
                border.rect.height = (handle_y.getRect().y + 5) - border.rect.y;
                if(border.rect.height < 200) {
                    border.rect.height = 200;
                    handle_y.rect.y = border.rect.height - 5;
                }
            }
        },
        on_drag_end() {
            if(!settings.show_content_while_dragging) {
                border.remove();
                window.rect.height = border.rect.height;
                change();
            }
            border.style.border_width = 0; 
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
        img.style.border_width = img.focused? 1: 0;
        window.style.border_width = window.hover? 2: 1;
        if(dragging) return;
        if(full || !shell.shell.gl.allow_resize) {
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
        allow: [name, border],
        on_drag_start() {
            if(full || !shell.shell.gl.allow_resize) return true;
            if(!settings.show_content_while_dragging) {
                border.rect.width = window.rect.width;
                border.rect.height = window.rect.height;
                border.rect.x = window.rect.x;
                border.rect.y = window.rect.y;
                window.child(border)
            }
        },
        while_drag() {
            if(settings.show_content_while_dragging) {
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
            } else {
                border.rect.height = (handle_c.getRect().y + 5) - border.rect.y;
                if(border.rect.height < 200) {
                    border.rect.height = 200;
                    handle_c.rect.y = border.rect.height - 5;
                }

                border.rect.width = (handle_c.getRect().x + 5) - border.rect.x;
                if(border.rect.width < 200) {
                    border.rect.width = 200;
                    handle_c.rect.x = border.rect.width - 5;
                }
            }
        },
        on_drag_end() {
            if(!settings.show_content_while_dragging) {
                border.remove();
                window.rect.height = border.rect.height;
                window.rect.width = border.rect.width;
                change();
            }
            border.style.border_width = 0; 
        }
    })

    shell.functions.x = () => Shell.gl.mouse.x - img.getRect().x;
    shell.functions.y = () => Shell.gl.mouse.y - img.getRect().y;
    shell.functions.w = () => img.getRect().width;
    shell.functions.h = () => img.getRect().height;

    function change() {
        handle_y.rect.width = window.rect.width - 5;
        img.rect.width = window.rect.width - 10;
        handle_x.rect.x = window.rect.width - 5;
        handle_y.rect.y = window.rect.height - 5;
        close.rect.x = window.rect.width - close.rect.width - 5;
        change_size.rect.x = close.rect.x - change_size.rect.width - 5;
        handle_c.rect.x = window.rect.width - 5;
        handle_c.rect.y = window.rect.height - 5;
        handle_x.rect.height = vh(100, window) - 20;
        img.rect.height= window.rect.height - 25;     
        minimize.rect.x = change_size.rect.x - minimize.rect.width - 5;
    }

    window.on(Event.mousePressed, (mouse) => {
        if(img.hover) return;
        if(mouse===RIGHT) {
            openContext({
                "Minimize": () => minimize.active(Event.mousePressed, LEFT),
                [full? "Restore": "Maximize"]: () => change_size.active(Event.mousePressed, LEFT),
                "Close": () => close.active(Event.mousePressed, LEFT),
            });
        }
    })
    window.child(img, handle_x, handle_y, handle_c,name, close, change_size, icon, minimize);
    windows.child(window);
}


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

button.on(Event.mousePressed, (mouse) => {
    if(mouse === RIGHT) return;
    toggleMenu();
});

bar.child(button)

root.on(Event.mousePressed, (mouse) => {
    if(mouse === RIGHT) return;
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
    applet.Dialog = Dialog;
    applet.listenPort = listenPort;
    applet.openContext = openContext;
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
    ctx.on(Event.removed, () => {
        applet.exit = true; 
    })

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

const taskbar = new Img({
    style: {
        border_width: 0,
    }
})

taskbar.rect.absolute = false;
taskbar.rect.height = bar.rect.height / 2 - 2;
taskbar.rect.y = 1;
taskbar.rect.x = button.rect.x + button.rect.width + 10;
createApplet("/bin/desktop/applets/taskbar.exe", taskbar).get_windows = () => {
    return shells.filter(v => v.window !== null);
};

createApplet("/bin/desktop/applets/desktop.exe", desktop).createApplet = (...args) => {
    return createApplet(...args)
};

bar.child(taskbar);
let clock = await FS.getFromPath("/user/desktop/24hour") === "0"
function gettime(view = false) {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    if(clock) {
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
    }

    const currentTime = `${hours.toString().padStart(2, "0")}:${minutes}${view | !clock? `:${seconds}`:` ${ampm}`}`;
    return currentTime;
}
const time = new Div({
    text: gettime(),
    style: {
        border_width: 0,
        border_radius: 10,
        background: "#4D545E",
        color: "white",
    }
});
time.on(Event.mousePressed, async (mouse) => {
    if(mouse === RIGHT) return;
    clock = !clock;
    if(clock) {
        await FS.addFile("/user/desktop/24hour", "0");
    } else {
        await FS.addFile("/user/desktop/24hour", "1");
    }
})

time.rect.y = 8;
time.rect.height = 25;
time.rect.width = 100;
time.style.margin_top = 4;
time.style.margin_left = 7;
time.rect.x = vw(100) - time.rect.width - button.rect.x - 5
time.rect.autosize = false;
time.rect.absolute = false;
taskbar.rect.width = vw(100) - (taskbar.rect.x + button.rect.width) - time.rect.width;

bar.child(time);

root.on(Event.tick, () => {
    for(const shell of shells) {
        if (shell.shell.gl.ready && !shell.shell.gl.has_window) {
            shell.shell.gl.has_window = true;
            createWindow(shell);
        }
    }
    time.text = gettime(time.hover);
})

function clean() {
    for(const shell of shells) {
        shell.shell.exit = true;
    }
    for(const applet of applets) {
        applet.exit = true;
    }
}
root.on(Event.Exit, () => {
    clean()
});

root.on(Event.windowResized, () => {
    background.rect.width = vw(100);
    background.rect.height = vh(100);
    desktop.rect.width = vw(100);
    desktop.rect.height = vh(100);
    bar.rect.width = root.rect.width;
    bar.rect.y = vh(100) - bar.props.active;
    menu_elt.rect.y = vh(100) - (bar.rect.height / 2 + 2)- menu_elt.rect.height;
    time.rect.x = vw(100) - time.rect.width - button.rect.x - 5
    taskbar.rect.width = vw(100) - (taskbar.rect.x + button.rect.width) - time.rect.width;
});

await run(r => {
    power.on(Event.mousePressed, (mouse) => {
    if(mouse === RIGHT) return;
        r();
    })
});


