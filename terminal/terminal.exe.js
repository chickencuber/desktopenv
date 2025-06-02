const { fakeShell } = await use("~/fakeShell.exe");

let running = true;

const shell = fakeShell();

Shell.icon = loadImage(await getFile("~/../icons/terminal.png")) 

let command = getPath("/user/desktop/terminal/.startup.sh");

function fixCursor() {
    if (!shell.terminal.scroll.allow) return;
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
                        const txt = shell.terminal.text().split("\n");
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
                    cursor.y * 29 - shell.terminal.scroll.y,
                    2,
                    29
                );
            }
            break;
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

const textGraphics = Shell.gl.createGraphics(Shell.size.width, Shell.size.height);

let lastRenderedText = "";
let lastx = 0;
let lasty = 0;
function renderText() {
    const text = shell.terminal.text();
    if (text !== lastRenderedText || lastx !== shell.terminal.scroll.x || lasty !== shell.terminal.scroll.y) {
        textGraphics.background(0);
        textGraphics.text(
            text,
            -shell.terminal.scroll.x,
            -shell.terminal.scroll.y
        );
        lastRenderedText = text;
        lastx = shell.terminal.scroll.x;
        lasty = shell.terminal.scroll.y;
    }
}

Shell.gl.draw = () => {
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
        if (frame % Math.floor(480 / Shell.deltaTime) === 0)
            show_cursor = !show_cursor;
        frame++;
        if (show_cursor) showCursor();
        fixCursor();
    }

    if (running) {
        Shell.name = `shell: ${shell.name}`;
    } else {
        Shell.name = `shell: ${shell.localVars.workingDir}>`;
    }
};

function getCmd() {
    return shell.terminal
        .getLine()
        .slice(shell.localVars.workingDir.length + 1)
        .trim();
}

Shell.windowResized = () => {
    Shell.gl.resize();
    textGraphics.resizeCanvas(Shell.size.width, Shell.size.height);
    lastRenderedText = "";
    shell.windowResized();
};

const last = [];

async function Enter() {
    const cmd = getCmd();
    shell.terminal.cursor.x = 0;
    shell.terminal.cursor.y++;
    if (cmd !== "") {
        last.push(cmd);
        running = true;
        if (cmd === ":exit:") {
            Shell.exit = true;
        }
        const v = await shell.run(cmd);
        await clear();
        if (v === undefined) {
            shell.terminal.add(shell.localVars.workingDir + ">");
            return;
        }
        shell.terminal.add(v);
        shell.terminal.cursor.x = 0;
        shell.terminal.cursor.y++;
        shell.terminal.add(shell.localVars.workingDir + ">");
        return;
    } else {
        shell.terminal.add(shell.localVars.workingDir + ">");
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
            Shell.terminal.add("    ");
            break;
        case LEFT_ARROW:
            if (shell.terminal.cursor.x > shell.localVars.workingDir.length + 1) {
                shell.terminal.cursor.x--;
            }
            break;
        case RIGHT_ARROW:
            shell.terminal.cursor.x++;
        case DOWN_ARROW:
            break;
        case UP_ARROW:
            if (getCmd() === "" && last.length > 0) {
                shell.terminal.add(last.pop());
            }
            break;
        case ENTER:
            Enter();
            break;
        case BACKSPACE:
            if (shell.terminal.cursor.x > shell.localVars.workingDir.length + 1) {
                shell.terminal.delete();
            }
            break;
        default:
            shell.terminal.add(key);
            break;
    }
}

Shell.keyPressed = (keyCode, key) => {
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
            shell.terminal.color = "#ffffff";
            shell.gl.ready = false;
            running = false;
            r();
        }, 100);
    });
}

Shell.gl.new();

Shell.onExit = () => {
    textGraphics.remove();
    shell.exit = true;
};

const v = await shell.run(command);
if (v) {
    shell.terminal.add(v + "\n");
}
await clear();
shell.terminal.add("/>");

if (args[0]) {
    Shell.exit = true;
}

await run();
