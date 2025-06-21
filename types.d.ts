type Menu = {
    text: string
} & ({
    type: "menu",
    items: string[]|Record<string, string>
}|{
    type: "textInput"
});

interface DialogQueueItem {
    returnfn: (value: any) => void,
    menu: Menu, 
}
