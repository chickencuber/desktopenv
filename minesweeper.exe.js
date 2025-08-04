if(!Shell.in_desktop) return "must be launched in a desktop enviroment";
const mines = 40;
const size = 18;
const { Event, Button, Div, Element, root, vw, vh, Img } = await use(
  "~/ui.exe"
);

Shell.name = "MineSweeper";

Shell.icon = loadImage(await getFile("~/icons/minesweeper.png"))


const img = new Img({
    style: {
        border_width: 0,
    }
});

const d = new Div({
    text: "",
    style: {
        border_width: 0,
        color: "white",
    }
})

root.child(d);

const canvas = Shell.gl.createGraphics(200, 200);

root.style.background = "rgb(130, 130, 130)"

img.props.image =  canvas;
const wa = img.props.image.width;
const ha = img.props.image.height;
let boxSize;

const a = wa / ha;
function resize() {
    const w = root.rect.width;
    const h = root.rect.height-20;
    let nw = 0;
    let nh = 0;
    if (w/h<a) {
        nw = w;
        nh = w / a;
    } else {
        nw = a * h;
        nh = h;
    }
    boxSize = nw / size;
    canvas.resizeCanvas(nw, nh);
    img.rect.width = nw;
    img.rect.height = nh;
    img.rect.x = vw(50) - nw / 2;
    d.rect.x = img.rect.x;
    img.rect.y = ((root.rect.height-20)/2 - nh / 2) + 20;
}

resize();

root.child(img);

root.on(Event.windowResized, () => {
    resize();
});



/**
    * @enum {string}
    * format string
    */
const Type = {
    Flag: "⚑",
    Bomb: "🟊",
    None: " ",
    Number: "$1",
}



/**
    * @param {string} str 
    */
function format(str, ...format) {
    return str.replaceAll(/\$([1-9][0-9]*)/g, (m, p) => {
        return format[parseInt(p)-1]
    }) 
}

let ensure_safe = true;

let end = false;
let endText = "";

class Tile {
    constructor(x, y) {
        this.x=x;
        this.y=y;
        this.bomb = false;
        this.flag = false;
        this.open = false;
    }
    get count() {
        let i = 0;
        for(let x = -1; x < 2; x++) {
            for(let y = -1; y < 2; y++) {
                if(x==0&&y==0) continue;
                if(!inside({x: this.x+x, y: this.y+y})) continue;
                if(board[this.x+x][this.y+y].bomb) {
                    i++;
                }
            }
        }
        return i;
    }
    flags() {
        if(this.open) return;
        this.flag = !this.flag;
    }
    remove() {
        if(this.flag) return;
        if(this.open) {
            for(let x = -1; x < 2; x++) {
                for(let y = -1; y < 2; y++) {
                    if(x==0&&y==0) continue;
                    if(!inside({x: this.x+x, y: this.y+y})) continue;
                    if(board[this.x+x][this.y+y].open) continue;
                    board[this.x+x][this.y+y].remove();
                }
            }
            return;
        };
        this.open=true;
        if(this.bomb) {
            end = true;
            endText = "You Lose"
            return
        };
        if(this.count == 0) {
            for(let x = -1; x < 2; x++) {
                for(let y = -1; y < 2; y++) {
                    if(x==0&&y==0) continue;
                    if(!inside({x: this.x+x, y: this.y+y})) continue;
                    if(board[this.x+x][this.y+y].open) continue;
                    board[this.x+x][this.y+y].remove();
                }
            }
        }
    }
    render() {
        if (isMouse(this.x, this.y) && ! this.flag) {
            canvas.fill(180);
        } else {
            canvas.fill(200);
        }                
        if(this.open) {
            canvas.fill(220);
        }
        canvas.rect(this.x * boxSize, this.y * boxSize, boxSize);
        canvas.fill(0);
        if(this.flag) {
            canvas.text(format(Type.Flag, this.count), this.x * boxSize + boxSize / 4, this.y * boxSize)
        }
        if(this.open) {
            if(this.bomb) {
                canvas.text(format(Type.Bomb, this.count), this.x * boxSize + boxSize / 4, this.y * boxSize);
                return;
            }
            if(this.count == 0) {
                canvas.text(format(Type.None, this.count), this.x * boxSize + boxSize / 4, this.y * boxSize);
                return;
            }
            canvas.text(format(Type.Number, this.count), this.x * boxSize + boxSize / 4, this.y * boxSize);
        }
    }
}

function isMouse(x, y) {
  const pos = getMouse();
  return pos.x === x && pos.y === y;
}

function inside(pos) {
  return pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size;
}

function inScreen() {
  const pos = getMouse();
  return inside(pos);
}

function getMouse() {
  return {x: Math.floor((Shell.gl.mouse.x-img.rect.x)/ boxSize), y: Math.floor((Shell.gl.mouse.y-img.rect.y)/ boxSize)};
}

let board = Array(size).fill().map((_, x)=>Array(size).fill().map((_, y)=>new Tile(x, y)));

root.on(Event.mousePressed, (c) => {
    if(end) {
        board = Array(size).fill().map((_, x)=>Array(size).fill().map((_, y)=>new Tile(x, y)));
        placeBombs();
        end = false;
        ensure_safe = true;
        return;
    }
    if(c === LEFT) {
        if(!inScreen()) return;
        const {x, y} = getMouse(); 
        if(ensure_safe) {
            for(let x2 = -1; x2 < 2; x2++) {
                for(let y2 = -1; y2 < 2; y2++) {
                    if(!inside({x:x+x2, y:y+y2}));
                    board[x+x2][y+y2].bomb=false;
                }
            }
        }
        board[x][y].remove();

        ensure_safe = false;
    } else if(c===RIGHT) {
        if(!inScreen()) return;
        const {x, y} = getMouse();        
        board[x][y].flags();
    }
})

function draw() {
    canvas.background(230)
    canvas.textSize(boxSize);
    canvas.textAlign(LEFT, TOP);
    const c= count();
    d.text=`Spaces Left: ${c}`
    if(c == 0) {
        end = true;
        endText = "You Win"
    }
    for(const _ of board) {
        for(const i of _) {
            i.render();
        }
    }
    if(end) {
        canvas.fill("red");
        canvas.textSize(boxSize*3);
        canvas.text(endText, boxSize*3, boxSize*3);
    }
}

function count() {
    let ii = 0;
    for(const _ of board) {
        for(const i of _) {
            if(!i.bomb && !i.open) ii++;
        }
    }
    return ii;
}

function placeBombs() {
    const size = board.length;
    let placed = 0;
    while (placed < mines) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        const tile = board[y][x];
        if (!tile.bomb) {
            tile.bomb=true;
            placed++;
        }
    }
}

placeBombs();

root.on(Event.tick, draw);

return await run();
