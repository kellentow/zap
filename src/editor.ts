class Editor {
    element:Element
    theme:string
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
        modifier_bar.style.backgroundColor = theme == "light" ? "#f0f0f0" : "#2e2e2e"
        modifier_bar.style.display = "flex"
        modifier_bar.style.alignItems = "center"
        modifier_bar.style.padding = "0 10px"
        modifier_bar.style.boxSizing = "border-box"
        this.element.appendChild(modifier_bar)

        let file_picker = document.createElement("input")
        file_picker.type = "file"
        file_picker.accept = "image/*"
        file_picker.style.display = "none"
        file_picker.onchange = () => {
            let file = file_picker.files[0]
            let reader = new FileReader()
            reader.onload = (e) => {
                let img = document.createElement("img")
                img.src = e.target.result as string
                img.style.maxWidth = "100%"
                img.style.height = "auto"
                this.element.querySelector("#textinput").appendChild(img)
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

        let text_input = document.createElement("div")
        text_input.contentEditable = "true"
        text_input.id = "textinput"
        text_input.style.width = "100%"
        text_input.style.height = "90%"
        text_input.style.outline = "none"
        text_input.style.overflowY = "auto"
        text_input.style.padding = "10px"
        text_input.style.boxSizing = "border-box"
        text_input.style.backgroundColor = theme == "light" ? "white" : "#1e1e1e"
        text_input.style.color = theme == "light" ? "black" : "white"
        text_input.style.fontFamily = "Arial, sans-serif"
        text_input.style.fontSize = "14px"
        this.element.appendChild(text_input)
    }

    addButton(innerHTML:string,onclick:(this: HTMLButtonElement, ev: PointerEvent)=>any) {
        let button = document.createElement("button")
        button.innerHTML = innerHTML
        button.style.background = this.theme == "light" ? "#EEE" : "#111"
        button.style.color = this.theme == "light" ? "#111" : "#EEE"
        button.style.marginRight = "10px"
        button.addEventListener("click", onclick)
        this.element.querySelector("#mod_bar").appendChild(button)
        return button
    }

    getHTML () {
        return this.element.querySelector("#textinput").innerHTML
    }

    setHTML (html:string) {
        this.element.querySelector("#textinput").innerHTML = html
    }

    destroy () {
        this.element.innerHTML = ""
    }
}

export {Editor}