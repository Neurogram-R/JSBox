/*

ChatGPT Keyboard by Neurogram

 - Support editing tools
 - Support appending or overwriting prompts with generated result
 - Support custom roles.
 - Support prompts templates.
 - Support multi round of dialogue
 - Support displaying length of prompts
 - Support displaying tokens usage reminder
 - Support DeepL and Google translate
 - Support shortcut key to run

 Manual: https://neurogram.notion.site/ChatGPT-Keyboard-af8f7c74bc5c47989259393c953b8017

*/

const api_key = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Your API key
const model = "gpt-4o"
const openai_proxy_url = "" // Optional

const deepl_api_key = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
const deepl_api_url = "" // Optional

const user_gesture = { // Generated results: 0: auto-wrap 1: overwrite selected/all prompts  
    tap: 1,
    long_press: 0
}
const usage_toast = true // Display usage toast

const shortcut = true // false: off, true: on
const shortcut_action = "tap" // tap, long_press
const auto_switch_kbd = true // false: off, true: on

const keyboard_sound = true
const keyboard_vibrate = -1 // -1: no vibration, 0~2: vibration level
const edit_tool_columns = 5
const chatgpt_role_columns = 3
const keyboard_spacing = 5
const keyboard_height = 40
const keyboard_total_height = 0
$keyboard.barHidden = false

const heartbeat = 2 // -1: no heartbeat, 0~2: heartbeat level
const heartbeat_interval = 1.2 // seconds

const role_data = {
    "🤖 Assistant": {
        "type": "GPT",
        "messages": [
            { "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": `{USER_CONTENT}` }
        ],
        "shortcut": "="
    },
    "🗂️ Summarizer": {
        "type": "GPT",
        "messages": [
            { "role": "system", "content": "" },
            { "role": "user", "content": `Please summarize the following content:{USER_CONTENT}` }
        ],
        "shortcut": ""
    },
    "📑 Expander": {
        "type": "GPT",
        "messages": [
            { "role": "system", "content": "" },
            { "role": "user", "content": `{USER_CONTENT}\n\nExpand the above content` }
        ],
        "shortcut": ""
    },
    "🇺🇸 GPT": {
        "type": "GPT",
        "messages": [
            { "role": "user", "content": `Please translate content into English: {USER_CONTENT}` }
        ],
        "shortcut": ""
    },
    "🇺🇸 DeepL": {
        "type": "DeepL",
        "target_lang": "EN",
        "shortcut": ""
    },
    "🇺🇸 Google": {
        "type": "Google",
        "target_lang": "en",
        "shortcut": ""
    },
}

const edit_tool = {
    "Start": "arrow.left.to.line",
    "Left": "arrow.left",
    "Right": "arrow.right",
    "End": "arrow.right.to.line",
    "Return": "return",
    "Copy": "doc.on.doc",
    "Paste": "doc.on.clipboard",
    "Cut": "scissors",
    "Empty": "trash",
    "Dismiss": "keyboard.chevron.compact.down"
}

const edit_tool_amount = Object.keys(edit_tool).length
let dialogue = $cache.get("dialogue")
let multi_turn = false
if (dialogue) multi_turn = dialogue.mode

$app.theme = "auto"
$ui.render({
    props: {
        title: "ChatGPT",
        navBarHidden: $app.env == $env.keyboard,
        pageSheet: $app.env == $env.keyboard,
        bgcolor: $color("#D0D3D9", "#2D2D2D"),
    },
    views: [{
        type: "matrix",
        props: {
            spacing: keyboard_spacing,
            bgcolor: $color("clear"),
            data: dataPush(Object.keys(edit_tool).concat(Object.keys(role_data))),
            template: {
                props: {},
                views: [{
                    type: "button",
                    props: {
                        id: "button",
                        radius: 10,
                        titleColor: $color("black", "white"),
                        tintColor: $color("black", "white"),
                        bgcolor: $color("#FFFFFF", "#6B6B6B"),
                        align: $align.center
                    },
                    layout: $layout.fill,
                    events: {
                        tapped: function (sender, indexPath, data) {
                            handler(sender, "tap")
                        },
                        longPressed: function (info, indexPath, data) {
                            handler(info.sender, "long_press")
                        }
                    }
                }]
            },
            footer: {
                type: "button",
                props: {
                    id: "footer",
                    height: 20,
                    title: " ChatGPT Keyboard by Neurogram",
                    titleColor: $color("#AAAAAA"),
                    bgcolor: $color("clear"),
                    symbol: multi_turn ? "bubble.left.and.bubble.right" : "bubble.left",
                    tintColor: $color("#AAAAAA"),
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
                                        make.edges.insets($insets(10, 10, 10, 10))
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
                    },
                    longPressed: function (info) {
                        multi_turn = multi_turn ? false : true
                        set_bubble()
                        $ui.toast("Dialogue Mode " + (multi_turn ? "On" : "Off"))
                        $cache.set("dialogue", { mode: multi_turn })
                    }
                }
            }
        },
        layout: $layout.fill,
        events: {
            itemSize: function (sender, indexPath) {
                let keyboard_columns = indexPath.item < edit_tool_amount ? edit_tool_columns : chatgpt_role_columns
                return $size(($device.info.screen.width - (keyboard_columns + 1) * keyboard_spacing) / keyboard_columns, keyboard_height);
            }
        }
    }],
    events: {
        appeared: function () {
            if (keyboard_total_height) $keyboard.height = keyboard_total_height
        },
        disappeared: function () {
            $keyboard.barHidden = false
        }
    }
})

function dataPush(data) {
    let key_title = []
    for (let i = 0; i < data.length; i++) {
        key_title.push({
            button: {
                title: i < edit_tool_amount ? "" : data[i],
                symbol: i < edit_tool_amount ? edit_tool[data[i]] : "",
                info: { action: i < edit_tool_amount ? data[i] : "" }
            }
        })
    }
    return key_title
}

function handler(sender, gesture, is_shorcut) {
    if (keyboard_sound) $keyboard.playInputClick()
    if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate)
    if ($app.env != $env.keyboard) return $ui.warning("Please Run In Keyboard")
    if (sender.info.action) return edit(sender.info.action, gesture)
    gpt(sender.title, gesture, is_shorcut)
}

async function edit(action, gesture) {

    let before = $keyboard.textBeforeInput ? $keyboard.textBeforeInput.length : 0
    let after = $keyboard.textAfterInput ? $keyboard.textAfterInput.length : 0

    if (action == "Start") return $keyboard.moveCursor(-before)
    if (action == "Left") return $keyboard.moveCursor(-1)
    if (action == "Right") return $keyboard.moveCursor(1)
    if (action == "End") return $keyboard.moveCursor(after)
    if (action == "Return") return $keyboard.insert("\n")
    if (action == "Paste") return $keyboard.insert($clipboard.text || "")
    if (action == "Dismiss") return gesture == "tap" ? $app.close() : $keyboard.dismiss()
    if (action == "Empty" && gesture == "tap") return $keyboard.delete()

    let content = await get_content(0)
    if (action != "Empty") $clipboard.text = content

    if (action == "Copy") return $ui.success("Done")

    if (action == "Cut" || action == "Empty") {
        if (!$keyboard.selectedText) {
            $keyboard.moveCursor(after)
            delete_content(content.length)
        }
        if ($keyboard.selectedText) $keyboard.delete()
    }

}

let generating = false
let timer = ""
let generating_icon = 0

async function gpt(role, gesture, is_shorcut) {

    if (generating) return $ui.warning("In Generating")
    let user_content = await get_content(0)
    if (!user_content && !multi_turn) return $ui.warning("No Prompts Found")

    let shortcut_length = 0
    if (is_shorcut) {
        let shortcut_data = get_shortcut_data()
        let patt = new RegExp(`(${shortcut_data.keys.join("|")})$`)
        shortcut_length = user_content.match(patt)[1].length
        user_content = user_content.replace(patt, "")
    }

    generating = true

    let messages = []

    if (multi_turn) {
        if (role_data[role].type != "GPT") {
            generating = false
            return $ui.warning("Multi-round Are NOT Supported")
        }

        if ($keyboard.selectedText) $keyboard.moveCursor(1)

        if (!user_content.match(/⚙️ SYSTEM:[^🔚]+/)) {
            $ui.warning("No Dialogue Found")
            $keyboard.insert(`\n⚙️ SYSTEM:\n${role_data[role][0] || "-"}🔚\n\n👨‍💻 USER:\n`)
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
    }

    if (!multi_turn) {
        if (!user_gesture[gesture]) {
            $keyboard.moveCursor(1)
            $keyboard.insert("\n")
        }

        if (user_gesture[gesture] && !$keyboard.selectedText) delete_content(user_content.length + shortcut_length)

        if (role_data[role].type == "GPT") {

            let preset_prompt = role_data[role].messages

            for (let i in preset_prompt) {
                messages.push({ "role": preset_prompt[i].role, "content": preset_prompt[i].content.replace(/{USER_CONTENT}/g, user_content) })
            }
        }

    }

    if (heartbeat != -1) {
        timer = $timer.schedule({
            interval: heartbeat_interval,
            handler: async () => {
                $device.taptic(heartbeat)
                $("footer").symbol = "ellipsis.bubble.fill"
                await $wait(0.2)
                $device.taptic(heartbeat)
                $("footer").symbol = "ellipsis.bubble"
            }
        })
    }

    if (heartbeat == -1) {
        timer = $timer.schedule({
            interval: heartbeat_interval / 2,
            handler: async () => {
                if (generating_icon) {
                    generating_icon = 0
                    $("footer").symbol = "ellipsis.bubble"
                } else {
                    generating_icon = 1
                    $("footer").symbol = "ellipsis.bubble.fill"
                }
            }
        })
    }

    if (role_data[role].type == "GPT") {
        let openai = await $http.post({
            url: openai_proxy_url || "https://api.openai.com/v1/chat/completions",
            header: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`
            },
            body: {
                "model": model,
                "messages": messages
            }
        })
        timer.invalidate()
        set_bubble()
        generating = false
        generating_icon = 0
        if (openai.data.error) return $ui.error(openai.data.error.message)

        if (!multi_turn) $keyboard.insert(openai.data.choices[0].message.content)
        if (multi_turn) $keyboard.insert(`🔚\n\n🤖 ASSISTANT:\n${openai.data.choices[0].message.content}🔚\n\n👨‍💻 USER:\n`)

        if (!usage_toast) return
        let usage = openai.data.usage
        $ui.toast(`Usage: P${usage.prompt_tokens} + C${usage.completion_tokens} = T${usage.total_tokens}`)
    }

    if (role_data[role].type == "DeepL") {
        let deepl = await $http.post({
            url: deepl_api_url || "https://api-free.deepl.com/v2/translate",
            header: {
                "Content-Type": "application/json",
                "Authorization": `DeepL-Auth-Key ${deepl_api_key}`
            },
            body: {
                "text": [user_content],
                "target_lang": role_data[role].target_lang
            }
        })
        timer.invalidate()
        set_bubble()
        generating = false
        generating_icon = 0
        if (typeof deepl.data == "string") return $ui.error("DeepL Error: " + deepl.data)
        if (typeof deepl.data == "object" && !deepl.data.translations) return $ui.error("DeepL Error: " + deepl.data.message)
        let translations = []

        for (let t in deepl.data.translations) {
            translations.push(deepl.data.translations[t].text)
        }

        $keyboard.insert(translations.join("\n"))
    }

    if (role_data[role].type == "Google") {
        let google = await $http.get({
            url: `https://translate.google.com/translate_a/single?client=it&dt=qca&dt=t&dt=rmt&dt=bd&dt=rms&dt=sos&dt=md&dt=gt&dt=ld&dt=ss&dt=ex&otf=2&dj=1&hl=en&ie=UTF-8&oe=UTF-8&sl=auto&tl=${role_data[role].target_lang}&q=${encodeURIComponent(user_content)}`,
            header: {
                "User-Agent": "GoogleTranslate/6.29.59279 (iPhone; iOS 15.4; en; iPhone14,2)"
            }
        })
        timer.invalidate()
        set_bubble()
        generating = false
        generating_icon = 0
        if (!google.data.sentences) return $ui.error("Google Error: " + JSON.stringify(google.data))
        let translations = []

        for (let s in google.data.sentences) {
            if (google.data.sentences[s].trans) translations.push(google.data.sentences[s].trans)
        }

        $keyboard.insert(translations.join("\n"))
    }

    if (is_shorcut && auto_switch_kbd) $keyboard.next()
}

async function get_content(length) {
    let content = $keyboard.selectedText || await $keyboard.getAllText()
    if (length) content = `Length: ${content.replace(/(⚙️ SYSTEM|👨‍💻 USER|🤖 ASSISTANT):\n|🔚/g, "").replace(/\n+/g, "\n").length}\n\n${content}`
    return content
}

function delete_content(times) {
    for (let i = 0; i < times; i++) {
        $keyboard.delete()
    }
}

function set_bubble() {
    $("footer").symbol = multi_turn ? "bubble.left.and.bubble.right" : "bubble.left"
}

$delay(0.3, async () => {
    if (shortcut) {
        let user_content = await get_content(0)
        let shortcut_data = get_shortcut_data()
        if (shortcut_data.keys.length > 0) {
            let patt = new RegExp(`(${shortcut_data.keys.join("|")})$`)
            let shortcut_match = user_content.match(patt)
            if (shortcut_match && shortcut_data.role[shortcut_match[1]]) handler({ "title": shortcut_data.role[shortcut_match[1]], "info": {} }, shortcut_action, true)
        }
    }
})

function get_shortcut_data() {
    let shortcut_key = []
    let role = {}
    for (let i in role_data) {
        if (role_data[i].shortcut) {
            shortcut_key.push(role_data[i].shortcut)
            role[role_data[i].shortcut] = i
        }
    }
    return {
        keys: shortcut_key,
        role: role
    }
}
