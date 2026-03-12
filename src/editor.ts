import Showdown from "showdown";
//import {parseMarkdown, charsToHtml} from './mdparser';

let formatter = new Showdown.Converter();

class Editor {
    element:Element
    theme:string
    text:string
    textinput:HTMLTextAreaElement
    attachments:Blob[]
    constructor (selector:string | HTMLTextAreaElement, theme = "light") {
        if (typeof selector == "string") {
            this.element = document.querySelector(selector)
        } else {
            this.element = selector
        }
        this.theme = theme
        this.textinput
        this.attachments = []

        let modifier_bar = document.createElement("div")
        modifier_bar.id = "mod_bar"
        modifier_bar.style.width = "100%"
        modifier_bar.style.height = "10%"
        modifier_bar.style.backgroundColor = "var(--palette-4)"
        modifier_bar.style.display = "flex"
        modifier_bar.style.alignItems = "center"
        modifier_bar.style.padding = "0 10px"
        modifier_bar.style.boxSizing = "border-box"
        this.element.appendChild(modifier_bar)

        let file_picker = document.createElement("input")
        file_picker.type = "file"
        file_picker.accept = "image/*,video/*,audio/*,application/pdf,text/*"
        file_picker.style.display = "none"
        file_picker.onchange = () => {
            let file:Blob[] = Array.from(file_picker.files)
            this.attachments.push(...file)
        }
        modifier_bar.appendChild(file_picker)

        this.addButton("📷", () => {
            file_picker.click()
        })

        this.text = "Type shit or smth";

        let text_input = document.createElement("textarea")
        text_input.id = "textinput"
        text_input.contentEditable = "true";
        text_input.ondragover = (e) => {e.preventDefault()};
        text_input.ondragend = (e) => {e.preventDefault()};
        this.textinput = text_input;
        this.element.appendChild(text_input)
        let timeout_id: number | null = null;

        this.textinput.addEventListener("keydown", (e: KeyboardEvent) => {
            //e.preventDefault();
            window.zap_global.status = "typing"
            if (timeout_id) {
                clearTimeout(timeout_id);
            }
            timeout_id = setTimeout(() => {
                if (window.zap_global.status  == "typing") {
                    window.zap_global.status = "online"
                }
            }, 3000) as unknown as number;

            this.text = this.textinput.value
            this.update();
        });
    }

    update() {
        let replaced = this.text
        //replaced = replaced.replaceAll("\n", "<br/>")
        //replaced.match("<(.*?)>/g").forEach((match) => {
        //    let user_id = match.replaceAll("<", "").replaceAll(">", "")
        //    let user = window.zap_global.online[window.zap_global.room].find((u) => u.account.id == user_id)
        //    if (user) {
        //        replaced = replaced.replaceAll(match, `<span style="color: var(--palette-accent)">@${user.account.name}</span>`)
        //    } else {
        //        return
        //    }
        //});
        this.textinput.value = replaced

    }

    addButton(innerHTML:string,onclick:(this: HTMLButtonElement, ev: PointerEvent)=>any) {
        let button = document.createElement("button")
        button.innerHTML = innerHTML
        button.style.background = "var(--palette-1)"
        button.style.color = "var(--palette-text)"
        button.style.marginRight = "10px"
        button.addEventListener("click", onclick)
        this.element.querySelector("#mod_bar").appendChild(button)
        return button
    }

    getMD () {
        let txt = this.text;
        return txt
    }

    setMD (md:string) {
        this.text = md
        this.update()
    }

    getAttachments():Blob[] {
        return this.attachments
    }

    clearAttachments() {
        this.attachments = []
    }

    destroy () {
        this.element.innerHTML = ""
    }
}

export {Editor}