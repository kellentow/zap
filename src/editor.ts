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
        modifier_bar.style.width = "100%"
        modifier_bar.style.height = "10%"
        modifier_bar.style.backgroundColor = theme == "light" ? "#f0f0f0" : "#2e2e2e"
        modifier_bar.style.display = "flex"
        modifier_bar.style.alignItems = "center"
        modifier_bar.style.padding = "0 10px"
        modifier_bar.style.boxSizing = "border-box"
        this.element.appendChild(modifier_bar)

        let bold_button = document.createElement("button")
        bold_button.innerHTML = "<b>B</b>"
        bold_button.style.marginRight = "10px"
        bold_button.onclick = () => {
            document.execCommand("bold")
        }
        modifier_bar.appendChild(bold_button)

        let italic_button = document.createElement("button")
        italic_button.innerHTML = "<i>I</i>"
        italic_button.style.marginRight = "10px"
        italic_button.onclick = () => {
            document.execCommand("italic")
        }
        modifier_bar.appendChild(italic_button)

        let underline_button = document.createElement("button")
        underline_button.innerHTML = "<u>U</u>"
        underline_button.style.marginRight = "10px"
        underline_button.onclick = () => {
            document.execCommand("underline")
        }
        modifier_bar.appendChild(underline_button)

        let strike_button = document.createElement("button")
        strike_button.innerHTML = "<s>S</s>"
        strike_button.style.marginRight = "10px"
        strike_button.onclick = () => {
            document.execCommand("strikeThrough")
        }
        modifier_bar.appendChild(strike_button)

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

        let photo_button = document.createElement("button")
        photo_button.innerHTML = "📷"
        photo_button.style.marginRight = "10px"
        photo_button.onclick = () => file_picker.click()
        modifier_bar.appendChild(photo_button)

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