import * as elements from './elements';
import { zapGlobals } from './main.d';

interface ContextMenuOptionList {
    [key: string]: ((target:HTMLElement,e:Event) => void) | ContextMenuOptionList;
}

let contextMenuOptions: ContextMenuOptionList = {}

function init(globals: zapGlobals) {
    contextMenuOptions = {
        "Block": (target:HTMLElement,e:Event) => {
            globals.blocked.push(target.getAttribute("data-account")!);
        }
    }
}

elements.chat_div.addEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const account = target.getAttribute("data-account");
    if (!account) return;
    
    let menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    menu.style.backgroundColor = "#333";
    menu.style.color = "#fff";
    menu.style.padding = "10px";
    menu.style.borderRadius = "5px";
    menu.style.zIndex = "1000";

    for (const [option, action] of Object.entries(contextMenuOptions)) {
        let optionElement = document.createElement("div");
        optionElement.innerText = option;
        optionElement.style.padding = "5px 0";
        optionElement.style.cursor = "pointer";
        optionElement.addEventListener("click", () => {
            if (typeof action === "function") {
                action(target, e);
            }
            document.body.removeChild(menu);
        });
        menu.appendChild(optionElement);
    }

    document.body.appendChild(menu);

    document.addEventListener("click", function onClickOutside() {
        if (document.body.contains(menu)) {
            document.body.removeChild(menu);
        }
        document.removeEventListener("click", onClickOutside);
    });

    menu.addEventListener("mouseleave", () => {
        if (document.body.contains(menu)) {
            document.body.removeChild(menu);
        }
    });
});

export { init }