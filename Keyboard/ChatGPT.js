/*

ChatGPT Keyboard by Neurogram

 - Support appending or overwriting prompts with generated result
 - Support custom roles.
 - Support prompts templates.
 - Support multi round of dialogue
 - Support displaying length of prompts
 - Support displaying tokens usage reminder

 Manual: https://neurogram.notion.site/ChatGPT-Keyboard-af8f7c74bc5c47989259393c953b8017

*/


const api_key = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Your API key
const model = "gpt-3.5-turbo"
const user_gesture = { // Generated results: 0: auto-wrap 1: overwrite selected/all prompts  
    tap: 1,
    long_press: 0
}
const usage_toast = true // Display usage toast

const role_data = [ // ["Role Name", "System Content", "Prompts Template", Multi-round] 
    ["🤖 Assistant", "You are a helpful assistant.", "", 1],
    ["📖 Explainer", "", "Explain the following content:", 0],
    ["🗂️ Summarizer", "", "Summarize the following content:", 0],
    ["📑 Expander", "", "{USER_CONTENT}\n\nExpand the above content", 0],
    ["🇨🇳 Translator", "Translate content into Chinese.", "", 0],
    ["🇺🇸 Translator", "Translate content into English.", "", 0]
]

$app.theme = "auto"
$ui.render({
    props: {
        title: "ChatGPT",
        navBarHidden: $app.env == $env.keyboard,
        pageSheet: $app.env == $env.keyboard
    },
    views: [{
        type: "matrix",
        props: {
            columns: 2,
            spacing: 5,
            itemHeight: 40,
            bgcolor: $color({ light: "#D0D3D9", dark: "#2D2D2D" }),
            data: dataPush(role_data),
            template: {
                props: {},
                views: [{
                    type: "label",
                    props: {
                        id: "label",
                        radius: 10,
                        bgcolor: $color({ light: "#FFFFFF", dark: "#6B6B6B" }),
                        align: $align.center
                    },
                    layout: $layout.fill
                }]
            },
            footer: {
                type: "label",
                props: {
                    height: 20,
                    text: "ChatGPT Keyboard by Neurogram",
                    textColor: $color("#AAAAAA"),
                    align: $align.center,
                    font: $font(10)
                },
                events: {
                    tapped: async (sender) => {
                        const popover = $ui.popover({
                            sourceView: sender,
                            sourceRect: sender.bounds,
                            directions: $popoverDirection.any,
                            size: $size(320, 200),
                            views: [
                                {
                                    type: "scroll",
                                    layout: function (make, view) {
                                        make.edges.insets($insets(20, 10, 10, 10))
                                    },
                                    views: [{
                                        type: "label",
                                        props: {
                                            text: await get_content(1),
                                            font: $font(15),
                                            lines: 0
                                        },
                                        layout: function (make, view) {
                                            make.width.equalTo(300)
                                        },
                                        events: {
                                            tapped: () => {
                                                popover.dismiss()
                                            }
                                        }
                                    }]
                                }
                            ]
                        })
                    }
                }
            }
        },
        layout: function (make, view) {
            make.edges.insets($insets(0, 0, 0, 0))
        },
        events: {
            didSelect: function (sender, indexPath, data) {
                gpt(indexPath.row, "tap")
            },
            didLongPress: function (sender, indexPath, data) {
                gpt(indexPath.row, "long_press")
            }
        }
    }]
})

function dataPush(data) {
    let role_name = []
    for (let i in data) {
        role_name.push({
            label: {
                text: data[i][0]
            }
        })
    }
    return role_name
}

let generating = false

async function gpt(index, gesture) {
    $keyboard.playInputClick()
    if ($app.env != $env.keyboard) return $ui.warning("Please Run In Keyboard")

    let multi_turn = role_data[index][3]

    if (generating) return $ui.warning("In Generating")
    let user_content = await get_content(0)
    if (!user_content && !multi_turn) return $ui.warning("No Prompts Found")

    generating = true

    let messages = []

    if (multi_turn) {
        if (!user_content.match(/⚙️ SYSTEM:[^🔚]+/)) {
            $ui.warning("No Dialogue Found")
            $keyboard.moveCursor(1)
            $keyboard.insert(`\n⚙️ SYSTEM:\n${role_data[index][1] || "-"}🔚\n\n👨‍💻 USER:\n`)
            generating = false
            return
        }

        let contents = user_content.match(/(👨‍💻 USER|🤖 ASSISTANT):\n([^🔚]+)/g)

        if (contents) {
            for (let i in contents) {
                if (contents[i].match(/👨‍💻 USER:\n([^🔚]+)/)) messages.push({ "role": "user", "content": contents[i].match(/👨‍💻 USER:\n([^🔚]+)/)[1] })
                if (contents[i].match(/🤖 ASSISTANT:\n([^🔚]+)/)) messages.push({ "role": "assistant", "content": contents[i].match(/🤖 ASSISTANT:\n([^🔚]+)/)[1] })
            }
        }

        if (!contents || messages[messages.length - 1].role != "user") {
            $ui.warning("No User Content Found")
            generating = false
            return
        }

        let system_content = user_content.match(/⚙️ SYSTEM:\n([^🔚]+)/)[1]
        if (system_content != "-") messages = [{ "role": "system", "content": system_content }].concat(messages)
        $keyboard.moveCursor(1)
    }

    if (!multi_turn) {
        if (!user_gesture[gesture]) {
            $keyboard.moveCursor(1)
            $keyboard.insert("\n")
        }

        if (user_gesture[gesture] && !$keyboard.selectedText) {
            for (let i = 0; i < user_content.length; i++) {
                $keyboard.delete()
            }
        }

        if (role_data[index][1]) messages.push({ "role": "system", "content": role_data[index][1] })

        let preset_prompt = role_data[index][2]
        if (preset_prompt && !preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt + "\n" + user_content
        if (preset_prompt && preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt.replace(/{USER_CONTENT}/g, user_content)

        messages.push({ "role": "user", "content": user_content })
    }

    let openai = await $http.post({
        url: "https://api.openai.com/v1/chat/completions",
        header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`
        },
        body: {
            "model": model,
            "messages": messages
        }
    })

    generating = false
    if (openai.data.error) return $ui.error(openai.data.error.message)

    if (!multi_turn) $keyboard.insert(openai.data.choices[0].message.content)
    if (multi_turn) $keyboard.insert(`🔚\n\n🤖 ASSISTANT:\n${openai.data.choices[0].message.content}🔚\n\n👨‍💻 USER:\n`)

    if (!usage_toast) return
    let usage = openai.data.usage
    $ui.toast(`Usage: P${usage.prompt_tokens} + C${usage.completion_tokens} = T${usage.total_tokens}`)
}

async function get_content(length) {
    let content = $keyboard.selectedText || await $keyboard.getAllText()
    if (length) content = `Length: ${content.replace(/(⚙️ SYSTEM|👨‍💻 USER|🤖 ASSISTANT):\n|🔚/g, "").replace(/\n+/g, "\n").length}\n${content}`
    return content
}
