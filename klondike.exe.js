const { Event, Div, root, vw, vh, ScrollableVert, Button } = await use(
    "~/ui.exe"
);
function start() {
    if(!Shell.in_desktop) return "must be launched in a desktop enviroment";

    function restart() {
        [...root.children].forEach(v=>v.remove());
        start();
    }
    const debug = true;


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const suit = [
        {
            s: "♠",
            red: false,
        }, 
        {
            s: "♥",
            red: true,
        }, 
        {
            s: "♦",
            red: true,
        }, 
        {
            s: "♣",
            red: false,
        }
    ];
    const types = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    function gen_deck(deck = []) {
        deck.length = 0; 

        for(const t of types) for(const s of suit) deck.push({t, s: s.s, c: s.red})
        return shuffleArray(deck);
    }

    /**
        * @type {Array<{t: string, s: string, c: bool}>}
        */
        const deck = gen_deck();

    root.style.background = "#00aa00";

    let x = 10;

    let selected = null;

    function isP(p, c) {
        if(p === c) return true;
        if(p.children.length > 0) return isP(p.children[0], c);
        return false;
    }

    function show(b, block) {
        if(b.shown || b.card===undefined) return;
        b.style.background = "white";
        b.block = block;
        b.text = b.card;  
        b.shown = true;
        b.style.color = b.red ? 'red': "black"
        b.on(Event.mousePressed, () => {
            if(selected == null) {
                selected = b;
            } else {
                if(b.children.length === 0 && selected !== b) { 
                    if(!isP(selected, b) && !b.block) {
                        if(types.indexOf(selected.t) === types.indexOf(b.t) -1 && selected.red !== b.red) {
                            show(selected.parent);
                            selected.remove();
                            if(selected.block) {
                                l = null;
                                selected.rect.x = 0;
                                selected.rect.y = 50;
                                selected.rect.absolute = false;
                                selected.block = false;
                                deck.splice(i, 1);
                                if(i>0) {
                                    i--;
                                } else {
                                    i = deck.length - 1;
                                }
                                i = i%deck.length;
                                if(deck.length === 0) {
                                    bc.remove();
                                } else {
                                    s(i);
                                }
                            }
                            b.child(selected);
                        }
                    }
                }
                setTimeout(()=>selected = null);
            }
        })
        b.on(Event.tick, () => {
            if(b === selected) {
                b.style.border_color = "blue"
            } else {
                b.style.border_color = "black"
            }
        })
    }
    const scroll = new ScrollableVert({
        style: {
            border_width: 0,
            background: "#00000000",
        }
    }); 
    scroll.rect.y = 125;
    scroll.rect.width = vw(100);
    scroll.rect.height = vh(100) - 125;
    root.on(Event.windowResized, () => {
        scroll.rect.width = vw(100);
        scroll.rect.height = vh(100) - 125;
    })
    root.child(scroll);

    function bottom(c) {
        if(c.children.length === 0) return c;
        return bottom(c.children[0]);
    }
    for(let _ = 0; _ < 7; _++) {
        const d = new Div(); 
        d.rect.width = 40;
        d.rect.height = 50;
        d.rect.absolute = false;
        d.rect.x = x;
        x+=d.rect.width + 10;
        let last = d;
        d.on(Event.mousePressed, () => {
            if(selected === null) return;
            if(d.children.length > 0) return;
            if(selected.t !== "K") return;
            show(selected.parent);
            selected.remove();
            if(selected.block) {
                l = null;
                selected.rect.x = 0;
                selected.rect.y = 50;
                selected.rect.absolute = false;
                selected.block = false;
                deck.splice(i, 1);
                if(i>0) {
                    i--;
                } else {
                    i = deck.length - 1;
                }
                i = i%deck.length;
                if(deck.length === 0) {
                    bc.remove();
                } else {
                    s(i);
                }
            }
            d.child(selected);
            setTimeout(() => selected = null)
        }) 
        const t = new Div({
            style: {
                border_width: 0,
            }
        });
        t.rect.width = 4;
        t.rect.height = 50;
        d.on(Event.tick, () => {
            t.rect.y = bottom(d).getRect().y+60
        })
        scroll.child(t);
        for(let i = 0; i <=_; i++) {
            const c = deck.pop();
            const b = new Div({style: {
                background: "red",
            }});
            b.rect.autosize = false;
            b.rect.width = 40;
            b.rect.height = 50;
            b.rect.y = 50;
            b.rect.absolute=false;
            b.card = c.t + c.s;
            b.t = c.t;
            b.suit = c.s;
            b.red = c.c;
            b.shown = false;
            if(i === _) {
                show(b);
            }
            last.child(b);
            last = b;
        }
        scroll.child(d);
    }

    let i = 0;
    const bc = new Div({style: {
        background: "red",
    }});
    bc.rect.width = 40;
    bc.rect.height = 50;
    bc.rect.x = 10;
    let l = 0;
    function s(i) {
        try {
            l.remove();
        } catch(e){};
        const c = new Div({style: {
            background: "white",
        }});
        c.card = deck[i].t + deck[i].s
        c.t = deck[i].t;
        c.suit = deck[i].s;
        c.red = deck[i].c;
        c.rect.y = 5;
        c.rect.autosize = false;
        c.rect.x = 60;
        c.rect.width = 40;
        c.rect.height = 50;
        show(c, true);
        l=c;
        root.child(c);
    }
    s(0);
    bc.rect.y = 5;
    bc.on(Event.mousePressed, (mouseButton) => {
        if(mouseButton===RIGHT){
            i--;
            if(i<0) {
                i = deck.length-1;
            }
        } else {
            i++;
            i = i%deck.length;
        }
        s(i);
    })

    let finished = 0;
    x = 150;
    for(let _ = 0; _ < 4; _++) {
        const f = new Div()
        f.rect.width = 40;
        f.rect.autosize = false;
        f.rect.height = 50;
        f.rect.x = x;
        f.rect.y = 5;
        let suit;
        let last;
        f.on(Event.mousePressed, () => {
            if(selected === null) return;
            if(selected.children.length > 0) return;
            if((suit === undefined && selected.t === "A") || (types.indexOf(selected.t)-1 == last && selected.suit === suit) || debug) {
                if(debug) selected.t = "K"
                if(selected.block) {
                    deck.splice(i, 1);
                    if(i>0) {
                        i--;
                    } else {
                        i = deck.length - 1;
                    }
                    i = i%deck.length;
                    if(deck.length === 0) {
                        bc.remove();
                    } else {
                        s(i);
                    }

                } else {
                    show(selected.parent);
                    selected.remove();
                }
                f.text = selected.text;
                f.style = selected.style;
                suit = selected.suit;
                f.style.border_color = "black"
                last = types.indexOf(selected.t);
                if(selected.t === "K") {
                    finished++;
                    if(finished>=4) {
                        Shell.Dialog.alert("you win").then(() => {
                            restart();
                        })
                    }
                }
                setTimeout(() => selected = null);
            }
        })
        x += f.rect.width + 10;
        root.child(f);
    }

    const button = new Button({text: "reset"});
    button.rect.x = x+4;
    button.on(Event.mousePressed, () => restart())
    root.child(bc, button)
}

start();
await run();


