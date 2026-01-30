//import Showdown from "showdown";
import {parseMarkdown, charsToHtml} from './mdparser';

async function urlToHtmlElement(url:string): Promise<HTMLElement> {
    let response = await fetch(url);
    let element = document.createElement('div');
    element.classList.add('attachment');
    if (!response.ok) {
        element.innerHTML = `Failed to load ${url}: ${response.status} ${response.statusText}`;
        return element;
    }
    let mime = response.headers.get("Content-Type");
    if (!mime) {
        element.innerHTML = `Failed to determine content type of ${url}`;
    } else if (mime.includes("text/html")) {
        let iframe = document.createElement('iframe');
        iframe.srcdoc = await response.text();
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        element.appendChild(iframe);
    } else if (mime.startsWith("image/")) {
        let img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        element.appendChild(img);
    } else if (mime.startsWith("text/")) {
        let pre = document.createElement('pre');
        pre.textContent = await response.text();
        element.appendChild(pre);
    } else if (mime === "application/pdf") {
        let embed = document.createElement('embed');
        embed.src = url;
        embed.type = "application/pdf";
        embed.style.width = "100%";
        embed.style.height = "100%";
        element.appendChild(embed);
    } else if (mime.startsWith("video/")) {
        let video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.style.width = "100%";
        video.style.height = "auto";
        element.appendChild(video);
    } else if (mime.startsWith("audio/")) {
        let audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        element.appendChild(audio);
    } else {
        let downloader = document.createElement('a');
        downloader.textContent = `Download file`;
        downloader.href = url;
        downloader.download = '';

        element.innerHTML = `Unsupported content type: ${mime}`;
        element.appendChild(downloader);
    }
    return element;
}

//let formatter = new Showdown.Converter();

class Editor {
    element:Element
    theme:string
    text:string
    textinput:HTMLDivElement
    constructor (selector:string | Element, theme = "light") {
        if (typeof selector == "string") {
            this.element = document.querySelector(selector)
        } else {
            this.element = selector
        }
        this.theme = theme

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
            let file = file_picker.files[0]
            let reader = new FileReader()
            reader.onload = (e) => {
                let img = document.createElement("img")
                img.src = e.target.result as string
                urlToHtmlElement(img.src).then((element) => {
                    this.textinput.appendChild(element)
                })
            }
            reader.readAsDataURL(file)
        }
        modifier_bar.appendChild(file_picker)

        this.addButton("<b>B</b>", () => {
            document.execCommand("bold")
        })

        this.addButton("<i>I</i>", () => {
            document.execCommand("italic")
        })

        this.addButton("<u>U</u>", () => {
            document.execCommand("underline")
        })

        this.addButton("<s>S</s>", () => {
            document.execCommand("strikeThrough")
        })

        this.addButton("📷", () => {
            file_picker.click()
        })

        this.text = "Type shit or smth";

        let text_input = document.createElement("div")
        text_input.id = "textinput"
        text_input.contentEditable = "true";
        this.textinput = text_input;
        this.element.appendChild(text_input)
        let timeout_id: number | null = null;

        this.textinput.addEventListener("keydown", (e: KeyboardEvent) => {
            window.zap_global.status = "typing"
            if (timeout_id) {
                clearTimeout(timeout_id);
            }
            timeout_id = setTimeout(() => {
                if (window.zap_global.status  == "typing") {
                    window.zap_global.status = "online"
                }
            }, 3000) as unknown as number;

            let cursor_range = document.getSelection().getRangeAt(0)
            if (cursor_range.startOffset !== cursor_range.endOffset) {
                this.text = this.text.substring(0, cursor_range.startOffset) + this.text.substring(cursor_range.endOffset);
            }
            let cursor_pos = cursor_range.startOffset;
            let inputting = "";
            if (e.key === "Enter" && e.shiftKey) {
                inputting += "\n";
            } else if (e.key.length === 1) {
                inputting += e.key;
            }
            this.text = this.text.substring(0, cursor_pos) + inputting + this.text.substring(cursor_pos);
        });
    }

    update() {
        let replaced = this.text
        replaced = replaced.replaceAll("\n", "<br/>")
        replaced.match("<(.*?)>/g").forEach((match) => {
            let user_id = match.replaceAll("<", "").replaceAll(">", "")
            let user = window.zap_global.online[window.zap_global.room].find((u) => u.account.id == user_id)
            if (user) {
                replaced = replaced.replaceAll(match, `<span style="color: var(--palette-accent)">@${user.account.name}</span>`)
            } else {
                return
            }
        });
        //let formatted = formatter.makeHtml(replaced);
        let formatted = charsToHtml(parseMarkdown(replaced));
        this.textinput.innerHTML = formatted

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

    getHTML () {
        return this.textinput.innerHTML
    }

    setHTML (html:string) {
        this.textinput.innerHTML = html
    }

    destroy () {
        this.element.innerHTML = ""
    }
}

export {Editor}