const { fakeShell } = await use("~/fakeShell.exe");

let running = true;

const shell = fakeShell();

const icon = loadImage(await getFile("~/../icons/terminal.png"));
Shell.icon = icon;

let command = getPath("/user/desktop/terminal/.startup.sh");

function fixCursor() {
    if (!shell.terminal.scroll.allow && running) return;
    if(!running) {
        shell.terminal.scroll.x = 0;
    }
    if (getRect().right > shell.size.width) {
        shell.terminal.scroll.x += getRect().right - shell.size.width;
    } else if (getRect().left < 0) {
        shell.terminal.scroll.x += getRect().left;
    }
    if (getRect().bottom > shell.size.height) {
        shell.terminal.scroll.y += getRect().bottom - shell.size.height;
    } else if (getRect().top < 0) {
        shell.terminal.scroll.y += getRect().top;
    }
}

if (args.length > 0) {
    command = args.join(" ");
}

let frame = 0;

let show_cursor = true;

function showCursor() {
    const cursor = shell.terminal.cursor;
    switch (cursor.style) {
        case "block":
            {
                Shell.gl.canvas.rect(
                    cursor.x * 13.2 - shell.terminal.scroll.x,
                    cursor.y * 27.5 - shell.terminal.scroll.y,
                    13.2,
                    29
                );
                Shell.gl.canvas.fill(0);
                Shell.gl.canvas.text(
                    (() => {
                        const txt = shell.terminal.text().split(/\x1b[fbarg]\[[0-9A-Fa-f]{6}m/).join("").split("\n");
                        if (txt[cursor.y]) {
                            return txt[cursor.y][cursor.x] || "";
                        }
                        return "";
                    })(),
                    cursor.x * 13.2 - shell.terminal.scroll.x,
                    cursor.y * 27.5 - shell.terminal.scroll.y
                );
            }
            break;
        case "pipe":
            {
                Shell.gl.canvas.rect(
                    cursor.x * 13.2 - shell.terminal.scroll.x,
                    cursor.y * 27.5 - shell.terminal.scroll.y,
                    4,
                    29
                );
            }
            break;
        case "underscore": 
            {
                const x = cursor.x * 13.2 - shell.terminal.scroll.x;
                const y = cursor.y * 27.5 - shell.terminal.scroll.y + 25;
                Shell.gl.canvas.rect(x, y, 13.2, 4);
            }
            break
        case "none":
            break;
        default:
            cursor.style = "block";
            break;
    }
}

function getRect() {
    const cursor = shell.terminal.cursor;
    return {
        left: cursor.x * 13.2 - shell.terminal.scroll.x,
        top: cursor.y * 27.5 - shell.terminal.scroll.y,
        right: cursor.x * 13.2 + 13.2 - shell.terminal.scroll.x,
        bottom: cursor.y * 27.5 + 29 - shell.terminal.scroll.y,
    };
}

let textGraphics = Shell.gl.createGraphics(Shell.size.width, Shell.size.height);


//f:forground
//b:background
//g:reset background
//a:push to stack
//r:pop from stack
let lastRenderedText = "";
let lastx = 0;
let lasty = 0;
function renderText() {
    let background;//should get set at the start
    let forground;
    let render = false;
    const stack = [];
    const text = shell.terminal.text();
    if (text !== lastRenderedText || lastx !== shell.terminal.scroll.x || lasty !== shell.terminal.scroll.y) {
        textGraphics.background(shell.terminal.background || 0);
        let y = 0;
        let x = 0;
        /**
            * @type {string[]}
            */
            const parts = text.split(/\x1b([fbarg])\[([0-9A-Fa-f]{6})m/);
        parts.unshift("ffffff");
        parts.unshift("f");
        for(let i = 2; i < parts.length; i+=3) {
            const text = parts[i];
            const color = "#"+parts[i-1];
            const type = parts[i-2];
            if(type === "f") {
                forground = color;
            } else if(type === "b") {
                background = color;
                render = true;
            } else if(type === "g") {
                render = false;
            } else if(type === "a") {
                stack.push({f: forground, b: background, g:render});
            } else if(type==="r") {
                const temp = stack.pop();
                forground = temp.f;
                background = temp.b;
                render = temp.g;
            }
            if(text === "") continue;
            text.split(/(\n)/).forEach(v => {
                if(v === "\n") {
                    x = 0;
                    y += textGraphics.textLeading();
                    return
                }
                if(render) {
                    textGraphics.fill(background);
                    textGraphics.rect(-shell.terminal.scroll.x + x, -shell.terminal.scroll.y + y, textGraphics.textWidth(v), textGraphics.textLeading());
                }
                textGraphics.fill(forground);
                textGraphics.text(
                    v,
                    -shell.terminal.scroll.x + x,
                    -shell.terminal.scroll.y + y
                );
                x += textGraphics.textWidth(v);
            });
        }
        lastRenderedText = text;
        lastx = shell.terminal.scroll.x;
        lasty = shell.terminal.scroll.y;
    }
}

let _key = 0;
Shell.gl.draw = () => {
    if(!textGraphics) return;
    fixCursor();
    Shell.gl.canvas.background(0);
    Shell.gl.canvas.textAlign(LEFT, TOP);
    Shell.gl.canvas.textSize(22);
    Shell.gl.canvas.textFont(Shell.gl.fonts.JetBrainsMono);
    textGraphics.textFont(Shell.gl.fonts.JetBrainsMono);
    textGraphics.textAlign(LEFT, TOP);
    textGraphics.textSize(22);
    if (shell.gl.ready) {
        shell.gl.draw();
        Shell.gl.canvas.image(
            shell.gl.canvas,
            0,
            0,
            Shell.size.width,
            Shell.size.height
        );
    } else {
        textGraphics.fill(255);
        Shell.gl.canvas.fill(255);
        renderText();
        Shell.gl.canvas.image(
            textGraphics,
            0,
            0,
            Shell.size.width,
            Shell.size.height
        );
        if(_key>0) {
            _key--;
            show_cursor = true;
        } else {
            if (frame % Math.floor(480 / Shell.deltaTime) === 0) {
                show_cursor = !show_cursor;
                frame = 0;
            }
        }
        frame++;
        if (show_cursor) showCursor();
    }

    if (running) {
        Shell.name = `shell: ${shell.name}`;
        Shell.icon = shell.icon || icon;
    } else {
        Shell.name = `shell: ${shell.localVars.workingDir}>`;
        Shell.icon = icon;
    }
};


Shell.windowResized = () => {
    Shell.gl.resize();
    textGraphics.resizeCanvas(Shell.size.width, Shell.size.height);
    lastRenderedText = "";
    shell.windowResized();
};

const last = [];

let buff = ""
let cursorX = 0;
function getCmd() {
    return buff?.trim() || ""
}
function add(char) {
    const len = char.length;
    while(buff.length + char.length <= cursorX) {
        char = " " + char;
    }
    buff = buff.slice(0, cursorX) + char+ buff.slice(cursorX);
    cursorX+=len;//should be one, but its safe to make sure
    shell.terminal.cursor.x+=len;
}

let bbuff = "";
async function Enter() {
    const cmd = getCmd();
    shell.terminal.cursor.x = 0;
    shell.terminal.cursor.y++;
    if (cmd !== "") {
        last.push(cmd);
        running = true;
        if (cmd === ":exit:") {
            Shell.exit = true;
            return;
        }
        const v = await shell.run(cmd);
        await clear();
        cursorX = 0;
        if (v === undefined) {
            shell.terminal.add(shell.localVars.workingDir + ">");
            bbuff = shell.terminal.text().trim();
            buff = ""
            return;
        }
        shell.terminal.add(v);
        shell.terminal.cursor.x = 0;
        shell.terminal.cursor.y++;
        shell.terminal.add(shell.localVars.workingDir + ">");
        bbuff = shell.terminal.text().trim();
        buff = ""
        return;
    } else {
        shell.terminal.add(shell.localVars.workingDir + ">");
        bbuff = shell.terminal.text().trim();
        buff = ""
        return;
    }
}

function keyPressed(keyCode, key) {
    if (Shell.keyIsDown(CONTROL)) {
        return;
    }
    switch (keyCode) {
        case CONTROL:
        case SHIFT:
        case ESCAPE:
        case ALT:
        case SUPER:
            break;
        case TAB:
            add("    ");
            break;
        case LEFT_ARROW:
            if (cursorX>0) {
                shell.terminal.cursor.x--;
                cursorX--;
            }
            break;
        case RIGHT_ARROW:
            shell.terminal.cursor.x++;
            cursorX++;
        case DOWN_ARROW:
            break;
        case UP_ARROW:
            if (getCmd() === "" && last.length > 0) {
                add(last.pop());
            }
            break;
        case ENTER:
            Enter();
            break;
        case BACKSPACE:
            if (cursorX>0) {
                buff= buff.slice(0, cursorX-1) + buff.slice(cursorX);
                cursorX--;
                shell.terminal.cursor.x--;
            }
            break;
        default:
            if(key.length > 1) return;
            add(key);
            break;
    }
    shell.terminal.text(bbuff+buff);
}

Shell.keyPressed = (keyCode, key) => {
    _key++;;
    if (!running) {
        keyPressed(keyCode, key);
        return;
    }
    shell.keyPressed(keyCode, key);
};
Shell.keyReleased = (keyCode, key) => {
    shell.keyReleased(keyCode, key);
};
Shell.mouseClicked = (mouseButton) => {
    shell.mouseClicked(mouseButton);
};
Shell.mouseDragged = () => {
    shell.mouseDragged();
};
Shell.mousePressed = (mouseButton) => {
    shell.mousePressed(mouseButton);
};
Shell.mouseReleased = (mouseButton) => {
    shell.mouseReleased(mouseButton);
};
Shell.mouseMoved = () => {
    shell.mouseMoved();
};

function clear() {
    return new Promise((r) => {
        setTimeout(() => {
            shell.gl.draw = () => {};
            shell.gl.setup = () => {};
            shell.keyPressed = () => {};
            shell.keyReleased = () => {};
            if (shell.gl.canvas !== false) {
                shell.gl.canvas.remove();
            }
            shell.scroll = false;
            shell.gl.canvas = false;
            shell.exit = false;
            shell.mouseClicked = () => {};
            shell.mouseDragged = () => {};
            shell.mousePressed = () => {};
            shell.mouseReleased = () => {};
            shell.mouseMoved = () => {};
            shell.onExit = () => {};
            shell.windowResized = () => {};
            shell.gl.ready = false;
            shell.terminal.background = undefined;
            running = false;
            r();
        }, 100);
    });
}

Shell.gl.new();

Shell.onExit = () => {
    const t = textGraphics;
    textGraphics = null;
    t.remove();
    shell.exit = true;
    if(shell.gl.canvas !== false)
        shell.gl.canvas.remove();
};

const v = await shell.run(command);
if (v) {
    shell.terminal.add(v + "\n");
}
await clear();
shell.terminal.add(shell.localVars.workingDir + ">");
bbuff = shell.terminal.text().trim();

if (args[0] && !flags.includes("c")) {
    Shell.exit = true;
}

await run();
