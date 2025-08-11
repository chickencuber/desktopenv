if(!Shell.in_desktop) return "must be launched in a desktop enviroment";
const icon = loadImage(await getFile("~/../icons/files.png"));
Shell.icon = icon;
Shell.name = "Files";
const { Event, Button, Div, Element, root, vw, vh, Img, ScrollableVert } = await use(
    "~/../ui.exe"
);


const t = new Div({
    style: {
        background: "white" 
    }
});


t.rect.width = vw(100);
t.rect.autosize = false;
t.on(Event.tick, () => {
    t.text = Shell.localVars.workingDir
})


const scroll = new ScrollableVert();
scroll.rect.y = vh(100, t) + 5;
scroll.rect.height = vh(100) - vh(100, t) - 5;
scroll.rect.width = vw(100);
root.on(Event.mousePressed, (button) => {
    if(scroll.children.some(v => v.hover)) return;
    if(button===RIGHT) {
        Shell.openContext({
            async ["Create File"](){
                const name = (await Shell.Dialog.prompt("name of file")).trim().split(' ').join("\\ ");
                if(name === "") return
                Shell.runApp(`touch ${getPath(Shell.localVars.workingDir.split(" ").join("\\ ") + "/" + name)}`);
                cd(".");
            },
            async ["Create Folder"](){
                const name = (await Shell.Dialog.prompt("name of folder")).trim().split(' ').join("\\ ");
                if(name === "") {
                    return
                }
                Shell.runApp(`mkdir ${getPath(Shell.localVars.workingDir.split(" ").join("\\ ") + "/" + name)}`)
                cd(".");
            },
            async ["Open in Terminal"]() {
                Shell.runApp("/bin/desktop/terminal/terminal.exe -c cd " + Shell.localVars.workingDir.split(" ").join("\\ "));
            },
        });
    }
})
root.on(Event.windowResized, () => {
    t.rect.width = vw(100);
    scroll.rect.height = vh(100) - vh(100, t) - 5;
    scroll.rect.width = vw(100);   
    scroll.children.forEach(v => v.rect.width = vw(100))
});
root.child(t, scroll);

let y = 0;


async function addButton(dir) {
    try {
    const o = new Button({text: dir});
    o.rect.y = y;
    o.rect.autosize = false;
    o.rect.width = vw(100);
    dir = getPath(dir); 
    const type = (await FS.getMetaFromPath(dir)).type;
    if(type === "dir") {
        o.text += "/";
    }
    o.rect.absolute = false;


    o.on(Event.mousePressed, (button) => {
        if(button === LEFT) {
            switch(type) {
                case "file": {
                    if(dir.endsWith(".exe") | dir.endsWith(".sh")) {
                        //run in terminal by default
                        Shell.runApp("/bin/desktop/terminal/terminal.exe " + dir.split(" ").join("\\ "));
                    } else if(
                        [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((v) =>
                            dir.endsWith(v.toLowerCase())
                        )
                    ) {
                        Shell.runApp("/bin/desktop/image.exe " + dir.split(" ").join("\\ "))
                    } else{
                        //open in nano by default
                        Shell.runApp("/bin/desktop/terminal/terminal.exe /user/desktop/files/openwith.sh " + dir.split(" ").join("\\ "))
                    }
                }
                    break
                case "dir": {
                    cd(dir); 
                }
                    break
            }
        } else if (button === RIGHT) {
            if(o.text === "../") return;
            let options = {
                async Rename() {
                    const name = FS.normalizePath(dir)
                    const n = await Shell.Dialog.prompt("rename file");
                    if(n.trim() === "") {
                        return;
                    }
                    name[name.length - 1] = n;
                    await Shell.runApp(`mv ${dir.split(" ").join("\\ ")} ${("/" + name.join("/")).split(" ").join("\\ ")}`);
                    cd(".");
                },
                async Delete() {
                    const t = await Shell.Dialog.confirm("are you sure?");
                    if(t) {
                        Shell.runApp(`rm ${dir.split(" ").join("\\ ")}`);
                    }
                    cd(".")
                }
            }
            switch(type) {
                case "file": {
                    options["Open With Editor"] = () => {
                        Shell.runApp("/bin/desktop/terminal/terminal.exe /user/desktop/files/openwith.sh " + dir.split(" ").join("\\ "))
                    }
                    if(dir.endsWith(".exe") | dir.endsWith(".sh")) {
                        options = {...options,
                            "Run In Terminal"() {
                                Shell.runApp("/bin/desktop/terminal/terminal.exe " + dir.split(" ").join("\\ "));                               
                            },
                            "Run in GUI"() {
                                Shell.runApp(dir.split(" ").join("\\ "));
                            },
                        }
                    }else if(
                        [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((v) =>
                            dir.endsWith(v.toLowerCase())
                        )
                    ) {
                        option["Open Image"] = function() {
                            Shell.runApp("/bin/desktop/image.exe " + dir.split(" ").join("\\ "))
                        }
                    }
                }
                    break
                case "dir": {
                    options["Open dir"] = function () {
                        cd(dir); 
                    }
                }
                    break;
            }
            Shell.openContext(options);
        }
    })
    y += vh(100, o) + 5;
    scroll.child(o);
    } catch(e) {}
}

async function redraw() {
    [...scroll.children].forEach(v => v.remove());
    const dirs = (await FS.getFromPath(Shell.localVars.workingDir));
    y = 0;
    if(Shell.localVars.workingDir !== "/")
        await addButton("..");
    for(let dir of dirs) {
        dir = "."+dir.slice(dir.lastIndexOf("/"));
        await addButton(dir);
    }
}

async function cd(dir) {
    await Shell.run(`cd ${dir.split(" ").join("\\ ")}`, Shell, false);
    await redraw();
}

root.style.background = "#ffffff";

cd("/");

await run();
