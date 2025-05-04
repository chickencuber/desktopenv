const { Event, Button, Div, Element, root, vw, vh, Img } = await use(
    "~/ui.exe"
);

Shell.name = "Tube Rush";

Shell.icon = loadImage(getFile("~/icons/game.png"))

const canvas = Shell.gl.createGraphics(vw(100), vh(100), WEBGL);

const egg = [
    [UP_ARROW, 87],
    [UP_ARROW, 87],
    [DOWN_ARROW, 83],
    [DOWN_ARROW, 83],
    [LEFT_ARROW, 65],
    [RIGHT_ARROW, 68],
    [LEFT_ARROW, 65],
    [RIGHT_ARROW, 68],
];

let eggi = 0;

const game = new Img();
game.rect.x = 0;
game.rect.y = 0;
game.rect.width = vw(100);
game.rect.height = vh(100);
game.props.image = canvas;
game.style.border_width = 0;

let best = parseInt(FS.getFromPath("/user/desktop/game_best"));

game.child(
    new Div({ text: "Best Score: " + best, style: { color: "white", border_width: 0 } })
);

function scene(scene) {
    if (scene === game) setup();
    root.children = [];
    root.child(scene);
}

const menu = new Div();
menu.rect.autosize = false;
menu.rect.absolute = false;
menu.rect.width = 0;
menu.rect.height = 0;
menu.style.border_width = 0;

const name = new Div({
    text: "Tube Rush",
    style: {
        color: "white",
        size: 30,
    },
});

name.rect.y = 50;
name.rect.x = vw(50) - name.rect.width / 2;

const start = new Button({
    text: "START",
    style: {
        color: "white",
        background: "#00000000",
        size: 30,
        border_color: "white",
    },
    style_hover: {
        background: "#FFFFFFC1",
        color: "black",
    },
});

start.on(Event.mousePressed, () => {
    scene(game);
});

start.rect.width = 100;
start.rect.height = 31;

start.rect.y = 100;
start.rect.x = vw(50) - start.rect.width / 2;

const exit = new Button({
    text: "EXIT",
    style: {
        color: "white",
        background: "#00000000",
        size: 30,
        border_color: "white",
    },
    style_hover: {
        background: "#FFFFFFC1",
        color: "black",
    },
});

exit.rect.width = 72;
exit.rect.height = 31;

exit.rect.y = 150;
exit.rect.x = vw(50) - exit.rect.width / 2;

menu.child(name, start, exit);

scene(menu);

root.on(Event.windowResized, () => {
    game.rect.width = vw(100);
    game.rect.height = vh(100);
    canvas.resizeCanvas(vw(100), vh(100));
    name.rect.x = vw(50) - name.rect.width / 2;
    start.rect.x = vw(50) - start.rect.width / 2;
    exit.rect.x = vw(50) - exit.rect.width / 2;
});

menu.child(game.children[0]);

const ammo = new Div({
    text: "Ammo: 0",
    style: {
        border_width: 0,
        color: "white",
    },
});
ammo.rect.y = 20;
game.child(ammo);

const gameData = {};

function movement() {
    if (Shell.keyIsDown(LEFT_ARROW) || Shell.keyIsDown("A".charCodeAt(0)))
        gameData.player.r += 0.05;
    if (Shell.keyIsDown(RIGHT_ARROW) || Shell.keyIsDown("D".charCodeAt(0)))
        gameData.player.r -= 0.05;
    gameData.player.r = gameData.player.r % 6.28319;
    if (gameData.player.r < 0) gameData.player.r += 6.28319;
}

const Types = {
    red: "red",
    _1: "red",
    _2: "red",
    _3: "red",
    _4: "red",
    _7: "red",
    _11: "red",
    yellow: "yellow",
    _8: "yellow",
    _10: "yellow",
    _5: "none",
    none: "none",
    green: "green",
    purple: "purple",
    _6: "purple",
    _9: "purple",
    purple2: "purple2",
    gun: "#00FFFF",
};

class Item {
    constructor(z) {
        this.r = random(0, 6.28319);
        this.z = z;
        this.scored = false;
        this.isPower = false;
        this.canScore = true;
        this.type = Types.red;
        const dir = random() > 0.5 ? 1 : -1;
        this.speed = random(0.01, 0.05) * dir;
    }
}

let egg_a = false;

game.on(Event.keyPressed, (keyCode, key) => {
    if (egg[eggi].includes(keyCode)) {
        if (egg_a) return;
        eggi++;
        if (eggi === egg.length) {
            egg_a = true;
            eggi = 0;
        }
    } else {
        eggi = 0;
    }
    if(key === "q") {
        egg_a = false;
    }
    if (key === " ") {
        if (gameData.player.ammo === 0) return;
        gameData.player.ammo--;
        for (let items of gameData.items) {
            if (items[0].scored) continue;
            for (let item of items) {
                if (item.type === Types.none) continue;
                const c = Math.atan(48 / 150);
                let a = (item.r - gameData.player.r) % 6.28319;
                if (a < 0) a += 6.28319;
                if (c > a || a > 6.28319 - c) {
                    item.type = Types.none;
                    item.isPower = true;
                    return;
                }
            }
        }
    }
});

function add() {
    const arr = [];
    const type = Types[random(Array.from(Object.keys(Types)))];
    switch (type) {
        case Types.red:
            for (let _ = 0; _ < random(1, 4); _++) {
                arr.push(new Item(gameData.az));
            }
            break;
        case Types.green:
            const green = new Item(gameData.az);
            green.isPower = true;
            green.canScore = false;
            green.type = type;
            arr.push(green);
            break;
        case Types.none:
            const none = new Item(gameData.az);
            none.isPower = true;
            none.canScore = false;
            none.type = type;
            arr.push(none);
            break;
        case Types.yellow:
            for (let _ = 0; _ < random(1, 3); _++) {
                const yellow = new Item(gameData.az);
                yellow.type = type;
                arr.push(yellow);
            }
            break;
        case Types.purple:
            const purple = new Item(gameData.az);
            purple.type = type;
            arr.push(purple);
            break;
        case Types.purple2:
            const purple21 = new Item(gameData.az);
            const purple22 = new Item(gameData.az);
            purple21.type = Types.purple;
            purple22.type = Types.purple;
            purple21.speed = -0.05;
            purple22.speed = 0.05;
            arr.push(purple21, purple22);
            break;
        case Types.gun:
            const gun = new Item(gameData.az);
            gun.isPower = true;
            gun.canScore = false;
            gun.type = type;
            arr.push(gun);
            break;
    }
    gameData.items.push(arr);
    gameData.az += 400;
}

function setup() {
    game.focus();
    egg_a = false;
    eggi = 0;
    gameData.player = { r: 0, speed: 5, powered: false, ammo: 0 };
    gameData.items = [];
    gameData.az = 400;
    gameData.z = 0;
    for (let _ = 0; _ < 10; _++) {
        add();
    }
    gameData.score = 0;
}


Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};


Shell.onExit = () => {
    FS.addFile("/user/desktop/game_best", best.toString()); 
    canvas.remove();
}

function draw() {
    if (egg_a){
        gameData.player.powered = true;
        gameData.player.ammo = 100;
    }
    game.children[0].text = `Score: ${gameData.score}`;
    ammo.text = `Ammo: ${gameData.player.ammo}`;
    movement();
    canvas.background(0);
    canvas.stroke("black");
    canvas.fill("blue");
    canvas.push();
    canvas.translate(0, 0, -5000);
    canvas.rotateX(1.5708);
    canvas.rotateY(-gameData.player.r);
    canvas.cylinder(5000);
    canvas.pop();
    canvas.fill(gameData.player.powered ? "rgb(0,255,0)" : 255);
    canvas.push();
    canvas.translate(0, 150);
    canvas.box(50);
    canvas.pop();
    let point = false;
    for (const c of gameData.items) {
        for (const i of c) {
            if (i.type === Types.none) continue;
            canvas.fill(i.type);
            canvas.stroke("black");

            canvas.push();
            canvas.rotateZ(i.r - gameData.player.r);
            if (i.type === Types.yellow && -i.z + gameData.z < -50) {
                canvas.rotateZ(Math.PI);
            }
            canvas.push();
            canvas.translate(0, 150, -i.z + gameData.z);
            canvas.box(50);
            canvas.pop();
            canvas.pop();
            if (i.type === Types.purple) {
                i.r += i.speed;
            }
        }
    }

    if (-gameData.items[0][0].z + gameData.z > -30) {
        if (
            gameData.items[0].some((v) => {
                const c = Math.atan(48 / 150);
                let a = (v.r - gameData.player.r) % 6.28319;
                if (a < 0) a += 6.28319;
                return (c > a || a > 6.28319 - c) && !v.isPower;
            }) &&
            !gameData.items[0][0].scored
        ) {
            if (gameData.player.powered) {
                gameData.items.shift();
                add();
                gameData.player.speed = (gameData.player.speed / 2).clamp(5, 600);
                gameData.player.powered = false;
                return;
            }
            if (gameData.score > best) best = gameData.score;
            game.children[0].text = `Best Score: ${best}
            Last Score: ${gameData.score}`;
            scene(menu);
            return;
        }
    }

    if (-gameData.items[0][0].z + gameData.z > -30) {
        if (
            gameData.items[0].some((v) => {
                const c = Math.atan(48 / 150);
                let a = (v.r - gameData.player.r) % 6.28319;
                if (a < 0) a += 6.28319;
                return c > a || a > 6.28319 - c;
            }) &&
            !gameData.items[0][0].scored
        ) {
            const t = gameData.items.shift()[0];
            add();
            switch (t.type) {
                case Types.green:
                    gameData.player.powered = true;
                    break;
                case Types.gun:
                    gameData.player.ammo += 5;
                    break;
            }
            return;
        }
    }

    if (-gameData.items[0][0].z + gameData.z > 10) {
        if (!gameData.items[0][0].scored && gameData.items[0][0].canScore) {
            gameData.score++;
            gameData.player.speed = (gameData.player.speed + 0.5).clamp(5, 600);
            gameData.items[0][0].scored = true;
        } else {
            gameData.items[0][0].scored = true;
        }
    }
    if (-gameData.items[0][0].z + gameData.z > 200) {
        add();
        gameData.items.shift();
    }
    gameData.z += gameData.player.speed;
}

game.on(Event.tick, () => {
    draw();
});

await run((r) => {
    exit.on(Event.mousePressed, () => {
        r();
    });
});
