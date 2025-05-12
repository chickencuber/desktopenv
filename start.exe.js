if(!await FS.exists("/user/desktop/game_best")) await FS.addFile("/user/desktop/game_best", "0");
if(!await FS.exists("/user/desktop/wallpaper.png")) await FS.copy("/bin/desktop/wallpapers/default.png", "/user/desktop/wallpaper.png")
if(!await FS.exists("/user/desktop/apps")) await FS.copy("/bin/desktop/apps", "/user/desktop/apps")

