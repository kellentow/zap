let state = {
    inCodeBlock: false,
    italics: false,
    bold: false,
    underline: false,
    strikethrough: false,
    size: 6
}

let tokens:{[key:string]: () => void | string} = {
    "```": () => { state.inCodeBlock = !state.inCodeBlock; },
    "**": () => { state.bold = !state.bold; },
    "__": () => { state.underline = !state.underline; },
    "~~": () => { state.strikethrough = !state.strikethrough; },
    "*": () => { state.italics = !state.italics; },
    "#": () => { if (state.size > 0) state.size -= 1; },
    "\n": () => { return "\n"; }
}

interface Char {
    char: string;
    bold: boolean;
    italics: boolean;
    underline: boolean;
    strikethrough: boolean;
    size: number;
}

function parseMarkdown(input: string): Char[] {
    let chars: Char[] = [];
    let i = 0;

    while (i < input.length) {
        let char = input[i];
        if (!state.inCodeBlock) {
            let matched = false;

            for (let token in tokens) {
                if (input.startsWith(token, i)) {
                    char = tokens[token]() || char;
                    i += token.length;
                    break;
                }
            }

            if (!matched) {
                chars.push({
                    char: input[i],
                    bold: state.bold,
                    italics: state.italics,
                    underline: state.underline,
                    strikethrough: state.strikethrough,
                    size: state.size
                });
                i += 1;
            }

        } else {
            if (input.startsWith("```", i)) {
                tokens["```"]();

                i += 3;
                continue;
            } else {
                chars.push({
                    char: input[i],
                    bold: false,
                    italics: false,
                    underline: false,
                    strikethrough: false,
                    size: 6
                });
                i += 1;
            }
        }

    }

    return chars;
}

function charsToMarkdown(chars: Char[]): string {
    let markdown = "";
    /*let prevState = {
        bold: false,
        italics: false,
        underline: false,
        strikethrough: false,
        size: 6
    };*/

    for (let charObj of chars) {
        if (charObj.bold) {
            markdown += "**";
        }
        if (charObj.italics) {
            markdown += "*";
        }
        if (charObj.underline) {
            markdown += "__";
        }
        if (charObj.strikethrough) {
            markdown += "~~";
        }
        for (let s = 6; s > charObj.size; s--) {
            markdown += "#";
        }

        markdown += charObj.char;
    }
    return markdown;
}

function charsToHtml(chars: Char[]): string {
    let html = "";
    /*let prevState = {
        bold: false,
        italics: false,
        underline: false,
        strikethrough: false,
        size: 6
    };*/

    for (let charObj of chars) {
        let openTags = "";
        let closeTags = "";
        if (charObj.bold) {
            openTags += "<b>";
            closeTags = "</b>" + closeTags;
        }
        if (charObj.italics) {
            openTags += "<i>";
            closeTags = "</i>" + closeTags;
        }
        if (charObj.underline) {
            openTags += "<u>";
            closeTags = "</u>" + closeTags;
        }
        if (charObj.strikethrough) {
            openTags += "<s>";
            closeTags = "</s>" + closeTags;
        }
        if (charObj.size < 6) {
            openTags += `<span style="font-size:${Math.max(8, 24 - charObj.size * 2)}px;">`;
            closeTags = "</span>" + closeTags;
        }

        if (charObj.char === "\n") {
            html += "<br/>";
        } else {
            html += openTags + charObj.char + closeTags;
        }
    }
    // clean up tags
    // iterations == replace_calls+1
    // (+1 is just to double check)
    for (let i = 0; i < 5; i++) {
        html = html.replaceAll("</b><b>", "");
        html = html.replaceAll("</i><i>", "");
        html = html.replaceAll("</u><u>", "");
        html = html.replaceAll("</s><s>", "");
    }
    return html;
}

export {
    parseMarkdown,
    charsToMarkdown,
    charsToHtml
}