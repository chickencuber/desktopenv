class File {
    constructor(root) {
        if(!root.endsWith("/")) root+="/"
        this.root=root
    }
    async copy(from, to) {
        if(!await FS.exists(this.root+to)) await FS.copy(from, this.root+to);
    }
    async file(path, args = "") {
        if(!await FS.exists(this.root+path)) await FS.addFile(this.root+path, args);       
    }
    async dir(path, fn = async (f) => {}) {
        if(!await FS.exists(this.root + path)) await FS.addDir(this.root + path);
        const temp = new File(this.root + path);
        await fn(temp);
        return temp;
    }
}

const f = new File("/user/desktop")
await f.file("game_best", "0");
await f.copy("/bin/desktop/wallpapers/default.png", "wallpaper.png")
await f.dir("apps", async (fd) => {
    const d = (f) => ["/bin/desktop/apps/" + f, f]
    await fd.copy(...d("files.json"))
    await fd.copy(...d("game.json"))
    await fd.copy(...d("minesweeper.json"))
    await fd.copy(...d("terminal.json"))
    await fd.copy(...d("widget_manager.json"))
    await fd.copy(...d("klondike.json"))
})

await f.file("24hour", "0");
await f.dir("terminal", async (f) => {
    await f.copy("/bin/desktop/terminal/.startup.sh", ".startup.sh")
});
await f.dir("files", async (f) => {
    await f.file("openwith.sh", "nano $args")
})
await f.dir("desktop")
await f.dir("widgets", async (f) => {
    await f.copy("/bin/desktop/widgets/test.json", "test.json")
})

