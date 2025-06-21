let focus = [];

const default_font = Shell.gl.fonts.Arial;

const Event = {
    keyPressed: "keyPressed",
    keyReleased: "keyReleased",
    mouseClicked: "mouseClicked",
    mouseDragged: "mouseDragged",
    mousePressed: "mousePressed",
    mouseReleased: "mouseReleased",
    mouseMoved: "mouseMoved",
    windowResized: "windowResized",
    mouseWheel: "mouseWheel",
    removed: "removed",
    tick: "tick",
};

class Element {
    get text() {
        return this._text;
    }
    set text(v) {
        this._text = v.toString();
        const { x, y, absolute, autosize } = this.rect;
        if (autosize) {
            this._default();
            this.rect.x = x;
            this.rect.y = y;
            this.rect.absolute = absolute;
            this.rect.autosize = autosize;
        }
    }
    constructor({ style = {}, style_hover = {}, props = {}, text = "" } = {}) {
        this.style = style;
        this.style_hover = style_hover;
        this.rect = {};
        this.props = props;
        this._text = text;
        this.children = [];
        this._keyPressed = [];
        this._keyReleased = [];
        this._mouseClicked = [];
        this._mouseDragged = [];
        this._mousePressed = [];
        this._mouseReleased = [];
        this._mouseMoved = [];
        this._windowResized = [];
        this._mouseWheel = [];
        this._removed = [];
        this._tick = [];
        this.parent = null;
        this.hover = false;
        this._default();
        this._start();
    }
    move(i = this.parent.children.length) {
        const idx = this.parent.children.indexOf(this);
        this.parent.children.splice(idx, 1);
        this.parent.children.splice(i, 0, this);
    }
    remove() {
        if (!this.parent) throw new Error("there is no parent to element");
        if (this.focused) focus.splice(focus.indexOf(this), 1);
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.removed();
    }
    _start() {}
    on(txt, func) {
        try {
            this["_" + txt].push(func);
        } catch (e) {
            throw new Error("not defined");
        }
    }
    active(txt, ...args) {
        try {
            for (let i = this.children.length - 1; i >= 0; i--) {
                this.children[i].active(txt, ...args);
            }
            this["_" + txt].forEach(v => v(...args));
        } catch (e) {
            throw new Error("not defined");
        }
    }
    removeEvent(txt, func) {
        try {
            this["_" + txt].splice(this["_" + txt].indexOf(func), 1);
        } catch (e) {
            throw new Error("not defined");
        }
    }
    getRect() {
        const parent = this.parent;
        let { absolute, x, y, width, height } = this.rect;

        if (!absolute) {
            x += parent?.getRect().x ?? 0;
            y += parent?.getRect().y ?? 0;
        }
        return { x, y, width, height };
    }
    collide() {
        const { x, y, width: w, height: h } = this.getRect();
        const { x: mx, y: my } = Shell.gl.mouse;
        return mx >= x && mx <= x + w && my >= y && my <= y + h;
    }
    child(...children) {
        for (const c of children) {
            c.parent = this;
            this.children.push(c);
        }
    }
    _render(canvas = Shell.gl.canvas) {
        this.render(canvas);
        this.children.forEach((v) => v._render(canvas));
    }
    tick(cc = false) {
        let c = false;
        for (let i = this.children.length - 1; i >= 0; i--) {
            if(this.children[i].tick(c||cc)) {
                c = true;
            }
        }
        if(this.collide() && !cc) {
            this.hover = true;
        } else {
            this.hover = false
        }
        this._tick.forEach((v) => v(cc));
        return this.hover || c;
    }
    mouseWheel(x, y) {
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.children[i].mouseWheel(x, y);
        }
        if (this.hover) {
            this._mouseWheel.forEach((v) => v(x, y));
        }
    }
    keyPressed(keyCode, key) {
        let ii = false;
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].keyPressed(keyCode, key)) {
                ii = true;
                break;
            }
        }
        if (this.focused) {
            this._keyPressed.forEach((v) => v(keyCode, key));
            return true;
        }
        return ii;
    }
    keyReleased(keyCode, key) {
        let ii = false;
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].keyReleased(keyCode, key)) {
                ii = true;
                break;
            }
        }
        if (this.focused) {
            this._keyReleased.forEach((v) => v(keyCode, key));
            return true;
        }
        return ii;
    }
    mouseClicked(mouseButton) {
        let ii = false;
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].mouseClicked(mouseButton)) {
                ii = true;
                break;
            }
        }
        if (this.hover) {
            this._mouseClicked.forEach((v) => v(mouseButton));
            return true;
        } else if (this.focused) {
            focus.splice(focus.indexOf(this), 1);
        }
        return ii;
    }
    mouseDragged() {
        let ii = false;
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].mouseDragged()) {
                ii = true;
                break;
            }
        }
        if (this.hover) {
            this._mouseDragged.forEach((v) => v());
            return true;
        }
        return ii;
    }
    mousePressed(mouseButton) {
        let ii = false;
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].mousePressed(mouseButton)) {
                ii = true;
                break;
            }
        }
        if (this.hover) {
            if (!this.focused) focus.push(this);
            this._mousePressed.forEach((v) => v(mouseButton));
            return true;
        } else if (this.focused) {
            focus.splice(focus.indexOf(this), 1);
        }
        return ii;
    }
    mouseReleased(mouseButton) {
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].mouseReleased(mouseButton)) {
                break;
            }
        }
        if (this.hover) {
            this._mouseReleased.forEach((v) => v(mouseButton));
            return true;
        }
        return false;
    }
    removed() {
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.children[i].removed();
        }
        this._removed.forEach((v) => v());
        return true;
    }
    mouseMoved() {
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].mouseMoved()) {
                break;
            }
        }
        if (this.hover) {
            this._mouseMoved.forEach((v) => v());
            return true;
        } 
        return false;
    }
    windowResized() {
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.children[i].windowResized();
        }
        this._windowResized.forEach((v) => v());
        return true;
    }
    render() {}
    get focused() {
        return focus.includes(this);
    }
    focus() {
        if (!this.focused) focus.push(this);
    }
    unfocus() {
        if(this.focused) focus.splice(focus.indexOf(this), 1);
    }
    _default() {}
}

class RootElement extends Element {
    render(canvas = Shell.gl.canvas) {
        canvas.background(this.style.background ?? "#000000");
    }
    remove() {
        if (this.focused) focus.splice(focus.indexOf(this), 1);
        this.removed();
    }
    _default() {
        this.rect = {
            autosize: true,
            absolute: true,
            x: 0,
            y: 0,
            get width() {
                return Shell.size.width;
            },
            get height() {
                return Shell.size.height;
            },
        };
    }
}

class Button extends Element {
    getWidth(text) {
        if (text === "") return 0;
        const collide = this.hover;
        const {
            size = this.style.size ?? 20,
            font_weight = this.style.font_weight ?? 0,
            font = this.style.font ?? default_font,
            margin_left = this.style.margin_left ?? 2,
        } = collide ? this.style_hover : this.style;
        Shell.gl.canvas.strokeWeight(font_weight);
        Shell.gl.canvas.textAlign(LEFT, TOP);
        Shell.gl.canvas.textSize(size);
        if (font) Shell.gl.canvas.textFont(font);
        return Shell.gl.canvas.textWidth(text) + margin_left * 2;
    }
    getHeight(text) {
        const collide = this.hover;
        const {
            size = this.style.size ?? 20,
            margin_top = this.style.margin_top ?? 2,
        } = collide ? this.style_hover : this.style;
        return size * text.split("\n").length + margin_top * 2;
    }
    _default() {
        this.rect = {
            autosize: true,
            absolute: true,
            x: 0,
            y: 0,
            width: this.getWidth(this.text),
            height: this.getHeight(this.text),
        };
    }
    render(canvas = Shell.gl.canvas) {
        let { x, y, width, height } = this.getRect();
        const collide = this.hover;
        const {
            background = this.style.background ?? (collide ? "#aaaaaa" : "#ffffff"),
            color = this.style.color ?? "#000000",
            size = this.style.size ?? 20,
            border_radius = this.style.border_radius ?? 0,
            border_width = this.style.border_width ?? 2,
            border_color = this.style.border_color ?? "#000000",
            font_weight = this.style.font_weight ?? 0,
            font = this.style.font ?? default_font,
            margin_top = this.style.margin_top ?? 2,
            margin_left = this.style.margin_left ?? 2,
        } = collide ? this.style_hover : this.style;
        canvas.fill(background);
        canvas.stroke(border_color);
        canvas.strokeWeight(border_width);
        canvas.rect(x, y, width, height, border_radius);
        canvas.fill(color);
        canvas.strokeWeight(font_weight);
        canvas.textAlign(LEFT, TOP);
        canvas.textSize(size);
        if (font) canvas.textFont(font);
        canvas.text(this.text, x + margin_left, y + margin_top);
    }
}

class Div extends Element {
    getWidth(text) {
        if (text === "") return 0;
        const collide = this.hover;
        const {
            size = this.style.size ?? 20,
            font_weight = this.style.font_weight ?? 0,
            font = this.style.font ?? default_font,
            margin_left = this.style.margin_left ?? 2,
        } = collide ? this.style_hover : this.style;
        Shell.gl.canvas.strokeWeight(font_weight);
        Shell.gl.canvas.textAlign(LEFT, TOP);
        Shell.gl.canvas.textSize(size);
        if (font) Shell.gl.canvas.textFont(font);
        return Shell.gl.canvas.textWidth(text) + margin_left * 2;
    }
    getHeight(text) {
        const collide = this.hover;
        const {
            size = this.style.size ?? 20,
            margin_top = this.style.margin_top ?? 2,
        } = collide ? this.style_hover : this.style;
        return size * text.split("\n").length + margin_top * 2;
    }
    _default() {
        this.rect = {
            autosize: true,
            absolute: true,
            x: 0,
            y: 0,
            width: this.getWidth(this.text),
            height: this.getHeight(this.text),
        };
    }
    render(canvas = Shell.gl.canvas) {
        let { x, y, width, height } = this.getRect();

        const collide = this.hover;
        const {
            background = this.style.background ?? "#00000000",
            color = this.style.color ?? "#000000",
            size = this.style.size ?? 20,
            border_radius = this.style.border_radius ?? 0,
            border_width = this.style.border_width ?? 2,
            border_color = this.style.border_color ?? "#000000",
            font_weight = this.style.font_weight ?? 0,
            font = this.style.font ?? default_font,
            margin_top = this.style.margin_top ?? 2,
            margin_left = this.style.margin_left ?? 2,
        } = collide ? this.style_hover : this.style;
        canvas.fill(background);
        canvas.stroke(border_color);
        canvas.strokeWeight(border_width);
        canvas.rect(x, y, width, height, border_radius);
        canvas.fill(color);
        canvas.strokeWeight(font_weight);
        canvas.textAlign(LEFT, TOP);
        canvas.textSize(size);
        if (font) canvas.textFont(font);
        canvas.text(this.text, x + margin_left, y + margin_top);
    }
}

class TextInput extends Element{
    _default() {
        this.rect = {
            autosize: false,
            absolute: true,
            x: 0,
            y: 0,
            width: 400,
            height: this.getHeight(this.text),
        };
    }
    getHeight(text) {
        const collide = this.hover;
        const {
            size = this.style.size ?? 20,
            margin_top = this.style.margin_top ?? 2,
        } = collide ? this.style_hover : this.style;
        return size * text.split("\n").length + margin_top * 2;
    }
    render(canvas = Shell.gl.canvas) {
        if(!this.canvas) return;
        let { x, y, width, height } = this.getRect();
        const collide = this.hover;
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.resizeCanvas(width, height);
        }
        const {
            border_width = this.style.border_width ?? 2,
            border_color = this.style.border_color ?? "#000000",
            background = this.style.background ?? "#ffffff",
            size = this.style.size ?? 20,
            font_weight = this.style.font_weight ?? 0,
            font = this.style.font ?? default_font,
            margin_left = this.style.margin_left ?? 2,
            margin_top = this.style.margin_top ?? 2,
            color = this.style.color ?? "#000000",
            cursor_color = this.style.cursor_color ?? "#000000",
            cursor_width = this.style.cursor_width ?? 2,
        } = collide ? this.style_hover : this.style
        this.canvas.background(background);
        canvas.fill(border_color);
        if (border_width !== 0)
            canvas.rect(
                x,
                y,
                width + border_width * 2,
                height + border_width * 2,
            );
        this.canvas.fill(color);
        this.canvas.strokeWeight(font_weight);
        this.canvas.textAlign(LEFT, TOP);
        this.canvas.textSize(size);
        if (font) this.canvas.textFont(font);
        this.ticks++;
        if(this.keys>0) {
            this.keys--;
            this.show_cursor = true;
        } else if(this.ticks % Math.floor(480 / Shell.deltaTime) === 0) {
            this.show_cursor = !this.show_cursor;
            this.ticks = 0;
        }
        if(this.focused&&this.show_cursor) {
            this.canvas.fill(cursor_color);
            const p = this.canvas.textWidth(this.text.slice(0, this.cursor_index)) + margin_left;
            this.canvas.rect(p, 0, cursor_width, height)
        }
        this.canvas.text(this.text, margin_left, margin_top);

        canvas.image(this.canvas, x+border_width, y+border_width, width, height)
    } 
    getWidth(text) {
        if (text === "") return 0;
        const collide = this.hover;
        const {
            size = this.style.size ?? 20,
            font_weight = this.style.font_weight ?? 0,
            font = this.style.font ?? default_font,
            margin_left = this.style.margin_left ?? 2,
        } = collide ? this.style_hover : this.style;
        Shell.gl.canvas.strokeWeight(font_weight);
        Shell.gl.canvas.textAlign(LEFT, TOP);
        Shell.gl.canvas.textSize(size);
        if (font) Shell.gl.canvas.textFont(font);
        return Shell.gl.canvas.textWidth(text) + margin_left;
    }
    _start() {
        let {width, height } = this.getRect();
        this.canvas = Shell.gl.createGraphics(width, height);
        this.cursor_index = 0;
        this.ticks = 0;
        this.keys = 0;
        this.show_cursor = true;
        this.on(Event.keyPressed, (code, key) => {
            this.keys++;
            if (key.length === 1) {
                this.text = 
                    this.text.slice(0, this.cursor_index) + 
                    key + 
                    this.text.slice(this.cursor_index);
                this.cursor_index++;
            }
            switch (code) {
                case ESCAPE:
                    this.unfocus();
                    break;
                case LEFT_ARROW:
                    this.cursor_index--;
                    if(this.cursor_index < 0) this.cursor_index = 0;
                    break
                case RIGHT_ARROW:
                    this.cursor_index++;
                    if(this.cursor_index > this.text.length) this.cursor_index = this.text.length;
                    break
                case 36://HOME
                    this.cursor_index = 0;
                    break;
                case 35: //END
                    this.cursor_index = this.text.length;
                    break;
                case BACKSPACE:
                    if(this.cursor_index === 0) break;
                    this.text = this.text.slice(0, this.cursor_index-1) + this.text.slice(this.cursor_index);
                    this.cursor_index--;
                    if(this.cursor_index < 0) this.cursor_index = 0;
                    break;
            }
        });
        this.on(Event.removed, () => {
            this.canvas.remove();
            this.canvas = null;
        });
        this.on(Event.mousePressed, () => {
            this.cursor_index = this.cursor_pos();
            this.keys++;
        });
        //TODO highlighting
        //TODO handle scrolling
    }
    cursor_pos() {
        if(this.text.length === 0) return 0;
        const mx = Shell.gl.mouse.x;
        const {x} = this.getRect();
        const {
            border_width = this.style.border_width ?? 2,
        } = this.hover ? this.style_hover : this.style
        if(mx>x+border_width+this.getWidth(this.text)) {
            return this.text.length;
        }
        let l = 0;
        let n = 0;
        for(let i = 0; i < this.text.length; i++) {
            const w = x+border_width+this.getWidth(this.text.slice(0, i));
            if(mx>w) {
                n=i;
                l = w;
            } else {
                const distL = Math.abs(mx - l);
                const distW = Math.abs(mx - w);
                n = distW < distL ? i : n;
                break;
            }
        }
        return n;
    }
}

class Img extends Element {
    _default() {
        this.rect = {
            autosize: false,
            absolute: true,
            x: 0,
            y: 0,
            width: 400,
            height: 400,
        };
    }
    render(canvas = Shell.gl.canvas) {
        let { x, y, width, height } = this.getRect();
        const collide = this.hover;
        const {
            border_width = this.style.border_width ?? 2,
            border_color = this.style.border_color ?? "#000000",
        } = collide ? this.style_hover : this.style;
        canvas.fill(border_color);
        if (border_width !== 0)
            canvas.rect(
                x,
                y,
                width + border_width * 2,
                height + border_width * 2,
            );
        if (this.props.image) {
            canvas.image(
                this.props.image,
                x + border_width,
                y + border_width,
                width,
                height,
            );
        }
    }
}

const root = new RootElement();

focus.push(root);

Shell.gl.draw = (cc = false) => {
    root.tick(cc);
    root._render();
};

Shell.gl.new();

Shell.windowResized = () => {
    Shell.gl.resize();
    root.windowResized();
};

Shell.keyPressed = (keyCode, key) => {
    root.keyPressed(keyCode, key);
};
Shell.keyReleased = (keyCode, key) => {
    root.keyReleased(keyCode, key);
};
Shell.mouseClicked = (mouseButton) => {
    root.mouseClicked(mouseButton);
};
Shell.mouseDragged = () => {
    root.mouseDragged();
};
Shell.mousePressed = (mouseButton) => {
    root.mousePressed(mouseButton);
};
Shell.mouseReleased = (mouseButton) => {
    root.mouseReleased(mouseButton);
};
Shell.mouseMoved = () => {
    root.mouseMoved();
};
Shell.mouseWheel = (x, y) => {
    root.mouseWheel(x, y);
};

function vw(a, elt = root) {
    if (Array.isArray(a)) a = a[0];
    return (elt.rect.width ?? 0) * (parseFloat(a) / 100);
}

function vh(a, elt = root) {
    if (Array.isArray(a)) a = a[0];
    return (elt.rect.height ?? 0) * (parseFloat(a) / 100);
}

return {
    Element,
    Button,
    Div,
    root,
    vw,
    vh,
    Event,
    Img,
    TextInput,
    default_font,
};
