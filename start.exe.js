if(!await FS.exists("/user/desktop/game_best")) await FS.addFile("/user/desktop/game_best", "0");
if(!await FS.exists("/user/desktop/wallpaper.png")) await FS.copy("/bin/desktop/wallpapers/default.png", "/user/desktop/wallpaper.png");
if(!await FS.exists("/user/desktop/apps")) await FS.copy("/bin/desktop/apps", "/user/desktop/apps");
if(!await FS.exists("/user/desktop/24hour")) await FS.addFile("/user/desktop/24hour", "0");
if(!await FS.exists("/user/desktop/terminal")) await FS.addDir("/user/desktop/terminal");
if(!await FS.exists("/user/desktop/terminal/.startup.sh")) await FS.copy("/bin/desktop/terminal/.startup.sh", "/user/desktop/terminal/.startup.sh");
if(!await FS.exists("/user/desktop/files/")) await FS.addDir("/user/desktop/files/");
if(!await FS.exists("/user/desktop/files/openwith.sh")) await FS.addFile("/user/desktop/files/openwith.sh", "nano $args");

