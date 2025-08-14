function fixCursorX(line, desiredX) {
    const regex = /\x1b[fbarg]\[[0-9A-Fa-f]{6}m/;
    let pos = desiredX;

    while (true) {
        const match = line.match(regex);
        if(match === null) break;
        if(pos>match.index&&pos<match.index+match[0].length) {
            pos = match.index + match[0].length; 
            line = line.replace(regex, "");
        } else {
            break;
        }
    }

    return pos;
}

function fakeShell() {
    const term = {
        _text: "",
        text(v) {
            if (v === undefined) {
                return this._text;
            }
            this._text = v;
        },
        scroll: {
            get height() {
                const temp = term._text.split("\n").length * 27.5 - Shell.size.height;
                return temp < 0 ? 0 : temp;
            },
        },
    };
    const shell = {
        supports_fansi: true,
        localVars: {
            workingDir: "/",
        },
        reboot() {
            Shell.reboot();
        },
        onExit: () => {},
        exit: false,
        keyPressed: () => {},
        keyReleased: () => {},
        mouseClicked: () => {},
        mouseDragged: () => {},
        mousePressed: () => {},
        mouseReleased: () => {},
        mouseMoved: () => {},
        windowResized: () => {},
        keyIsDown(...args) {
            return Shell.keyIsDown(...args);
        },
        get keyIsPressed() {
            return Shell.keyIsPressed;
        },
        get deltaTime() {
            return Shell.deltaTime;
        },
        gl: {
            canvas: false,
            ready: false,
            createGraphics: (...args) => {
                return Shell.gl.createGraphics(...args);
            },
            mouse: {
                get x() {
                    return Shell.gl.mouse.x;
                },
                get y() {
                    return Shell.gl.mouse.y;
                },
                get isDown() {
                    return Shell.gl.mouse.isDown;
                },
            },
            resize() {
                this.canvas.resizeCanvas(Shell.size.width, Shell.size.height);
            },
            draw: () => {},
            setup: () => {},
            get fonts() {
                return Shell.gl.fonts;
            },
            new(renderer = P2D) {
                this.canvas = Shell.gl.createGraphics(
                    Shell.size.width,
                    Shell.size.height,
                    renderer
                );
                shell.gl.setup();
                shell.gl.ready = true;
            },
        },
        size: {
            get width() {
                return Shell.size.width;
            },
            get height() {
                return Shell.size.height;
            },
        },
        terminal: {
            text(v) {
                if (v !== undefined) {
                    term.text(v);
                }
                return term.text();
            },
            get width() {
                const charWidth = 13.2;
                return Math.floor(Shell.size.width / charWidth);
            },
            get height() {
                const charHeight = 27.5;
                return Math.floor(Shell.size.height / charHeight);
            },
            scroll: {
                allow: false,
                x: 0,
                y: 0,
            },
            cursor: { x: 0, y: 0, style: "block" },

            getLine() {
                return this.text().split("\n")[shell.terminal.cursor.y] || "";
            },

            clear() {
                shell.terminal.cursor.x = 0;
                shell.terminal.cursor.y = 0;
                term.text("");
            },

            delete() {
                const cursor = shell.terminal.cursor;
                const textArray = term
                    .text()
                    .split("\n")
                    .map((v) => v.split(""));

                while (textArray.length <= cursor.y) {
                    textArray.push([]);
                }

                if (cursor.x === 0) {
                    if (cursor.y > 0) {
                        const deletedText = textArray.splice(cursor.y, 1)[0];
                        shell.terminal.cursor.y--;
                        shell.terminal.cursor.x = textArray[cursor.y].join("").length;

                        textArray[cursor.y].push(...deletedText);

                        term.text(textArray.map((v) => v.join("")).join("\n"));
                    }
                    return;
                }

                textArray[cursor.y].splice(cursor.x - 1, 1);

                term.text(textArray.map((v) => v.join("")).join("\n"));

                cursor.x--;
            },
            add(str) {
                const pcursor = shell.terminal.cursor;
                const cursor = {x: pcursor.x, y: pcursor.y}
                cursor.x = fixCursorX(shell.terminal.getLine(), cursor.x)
                const arr = term
                    .text()
                    .split("\n")
                    .map((v) => v.split(""));
                while (arr.length <= cursor.y) {
                    arr.push([]);
                }
                while(arr[cursor.y].length <= cursor.x) {
                    arr[cursor.y].push(" ");
                }
                arr[cursor.y].splice(cursor.x, 0, str);
                arr[cursor.y] = arr[cursor.y].map((v) => (v === undefined ? " " : v));
                term.text(arr.map((v) => v.join("")).join("\n"));
                str = str.split(/\x1b[fbarg]\[[0-9A-Fa-f]{6}m/).join("")
                pcursor.x += str.length;
                pcursor.y += (str.match(/\n/g) || []).length;
                if (str.split("\n").length>1) {
                    pcursor.x = str.split("\n").at(-1).length;
                }
            },
        },
        update() {
            Shell.update();
        },
        async run(command, _shell = shell, ...args) {
            shell.name = command.split(" ")[0];
            return await Shell.run(command, _shell, ...args);
        },
    };

    return shell;
}

return { fakeShell };
