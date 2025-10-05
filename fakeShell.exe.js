function fakeShell(x, y, width, height) {
    const term = {
        _text: "",
        text(v) {
            if (v === undefined) {
                return this._text;
            }
            this._text = v;
        },
        scroll: {
            height: 0,
        },
    };
    const shell = {
        in_desktop: true,
        localVars: {
            workingDir: "/",
        },
        reboot() {
            Shell.reboot();
        },
        keyPressed: () => {},
        keyReleased: () => {},
        mouseClicked: () => {},
        mouseDragged: () => {},
        mousePressed: () => {},
        mouseReleased: () => {},
        mouseMoved: () => {},
        windowResized: () => {},
        onExit: () => {},
        exit: false,
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
            allow_resize: true,
            canvas: false,
            ready: false,
            createGraphics: (...args) => {
                return Shell.gl.createGraphics(...args);
            },
            mouse: {
                get x() {
                    return x();
                },
                get y() {
                    return y();
                },
                get isDown() {
                    return Shell.gl.mouse.isDown;
                },
            },
            resize() {
                this.canvas.resizeCanvas(width(), height());
            },
            draw: () => {},
            setup: () => {},
            new(renderer = P2D) {
                this.canvas = Shell.gl.createGraphics(width(), height(), renderer);
                shell.gl.setup();
                shell.gl.ready = true;
            },
            get fonts() {
                return Shell.gl.fonts;
            },
        },
        size: {
            get width() {
                return width();
            },
            get height() {
                return height();
            },
        },
        terminal: {
            text(v) {
                if (v !== undefined) {
                    term.text(v);
                }
                return term.text();
            },
            color: "#ffffff",
            background: "#000000",
            scroll: {
                allow: false,
                get y() {
                    return 0;
                },
                set y(v) {},
                get x() {
                    return 0;
                },
                set x(v) {},
            },
            cursor: { x: 0, y: 0, style: "block" },
            getLine() {
                return this.text().split("\n")[shell.terminal.cursor.y] || "";
            },
            width: 0,
            height: 0,
            clear() {
                shell.terminal.cursor.x = 0;
                shell.terminal.cursor.y = 0;
                term.text("");
            },
            delete() {
                const cursor = shell.terminal.cursor;
                const arr = term
                    .text()
                    .split("\n")
                    .map((v) => v.split(""));
                while (arr.length <= cursor.y) {
                    arr.push([]);
                }
                if (cursor.x === 0) {
                    if (cursor.y > 0) {
                        const v = arr.splice(cursor.y, 1)[0];
                        shell.terminal.cursor.y--;
                        shell.terminal.cursor.x = arr[cursor.y].join("").length;
                        arr[cursor.y].push(...v);
                        term.text(arr.map((v) => v.join("")).join("\n"));
                    }
                    return;
                }
                arr[cursor.y].splice(cursor.x - 1, 1);
                term.text(arr.map((v) => v.join("")).join("\n"));
                cursor.x--;
            },
            add(str) {
                const cursor = shell.terminal.cursor;
                const arr = term
                    .text()
                    .split("\n")
                    .map((v) => v.split(""));
                while (arr.length <= cursor.y) {
                    arr.push([]);
                }
                arr[cursor.y].splice(cursor.x, 0, str);
                arr[cursor.y] = arr[cursor.y].map((v) => (v === undefined ? " " : v));
                term.text(arr.map((v) => v.join("")).join("\n"));
                cursor.x += str.length;
                cursor.y += (str.match(/\n/g) || []).length;
                if (str.endsWith("\n")) {
                    cursor.x = 0;
                }
                shell.terminal.scroll.y = term.scroll.height;
            },
        },
        update() {
            Shell.update();
        },
        run(command, _shell = shell, ...args) {
            return Shell.run(command, _shell, ...args);
        },
    };

    return shell;
}

return { fakeShell };
