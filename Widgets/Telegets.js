/*

Telegets by Neurogram

 - Fill Telegram channel link path in Input Value of widget (separated by commas)
 - Tap to open Channel

*/

const inputValue = $widget.inputValue;

if (inputValue) {
    let usernames = inputValue.split(",")
    let username = usernames[Random(0, usernames.length - 1)]
    let resp = await $http.get("https://t.me/s/" + username)
    let data = resp.data.match(/tgme_channel_info_header">(.|\n)+tgme_channel_download_telegram"/)[0]
    let logo = data.match(/https.+jpg/)[0]
    let title = data.match(/header_title"><span dir="auto">(.+)<\/span>/)[1]
    let entities = title.match(/&#\d{2,3};/g)
    if (entities) {
        for (var k in entities) {
            let rExp = new RegExp(entities[k], "g")
            title = title.replace(rExp, entityToString(entities[k]))
        }
    }
    let counters = data.match(/counter_value">.+?<\/span>/g)
    let type = data.match(/counter_type">.+?<\/span>/g)
    let counter_view = []
    let type_view = []

    for (var i in counters) {
        counter_view.push({
            type: "text",
            props: {
                text: counters[i].match(/>(.+)</)[1],
                font: $font("bold", 18),
                light: "#282828",
                dark: "white",
                minimumScaleFactor: 0.5,
                lineLimit: 1
            }
        })
        type_view.push({
            type: "text",
            props: {
                text: type[i].match(/>(.+)</)[1],
                font: $font(10),
                color: $color("#aaaaaa"),
                minimumScaleFactor: 0.5,
                lineLimit: 1
            }
        })
    }

    $widget.setTimeline({
        render: ctx => {
            //$widget.family = 0
            const family = ctx.family;
            const width = $widget.displaySize.width
            const height = $widget.displaySize.height

            const logo_view = {
                type: "image",
                props: {
                    uri: logo,
                    frame: {
                        width: family == 6 ? height - 8 : 60,
                        height: family == 6 ? height - 8 : 60
                    },
                    resizable: true,
                    cornerRadius: 15
                }
            }

            const title_view = {
                type: "text",
                props: {
                    text: title,
                    font: family == 0 ? $font("bold", 20) : $font("bold", 25),
                    light: "#282828",
                    dark: "white",
                    minimumScaleFactor: 0.5,
                    lineLimit: 1
                }
            }

            const path_view = {
                type: "text",
                props: {
                    text: "@" + username,
                    font: $font(10),
                    color: $color("#2481cc"),
                    minimumScaleFactor: 0.5,
                    lineLimit: 1
                }
            }

            const inline_widget = [counter_view[0]]

            const rectangular_widget = [
                {
                    type: "hstack",
                    props: {
                        alignment: $widget.verticalAlignment.center,
                        frame: {
                            width: family == 6 ? width - 20 : width - 30,
                            height: 60
                        },
                        spacing: 0
                    },
                    views: [
                        logo_view,
                        {
                            type: "vstack",
                            props: {
                                alignment: $widget.horizontalAlignment.center,
                                frame: {
                                    maxWidth: Infinity,
                                    maxHeight: Infinity
                                },
                                spacing: 0
                            },
                            views: [
                                counter_view.concat(type_view)[0],
                                counter_view.concat(type_view)[counter_view.concat(type_view).length / 2]
                            ]
                        }
                    ]
                }
            ]

            const small_widget = [
                rectangular_widget[0],
                spacerMaker(18, width - 30),
                title_view,
                spacerMaker(3, width - 30),
                path_view
            ]

            const medium_widget = [
                {
                    type: "hstack",
                    props: {
                        alignment: $widget.verticalAlignment.center,
                        spacing: 0,
                        frame: {
                            width: width - 30,
                            height: 60
                        }
                    },
                    views: [
                        logo_view,
                        spacerMaker(60, 8),
                        {
                            type: "vstack",
                            props: {
                                alignment: $widget.horizontalAlignment.leading,
                                spacing: 0,
                                frame: {
                                    width: width - 98,
                                    height: 60
                                }
                            },
                            views: [
                                spacerMaker(0, width - 98),
                                title_view,
                                path_view
                            ]
                        }

                    ]
                },
                spacerMaker(18, width - 30),
                {
                    type: "vgrid",
                    props: {
                        columns: Array(counter_view.concat(type_view).length / 2).fill({
                            flexible: {
                                minimum: 10,
                                maximum: Infinity
                            },
                            spacing: 0
                        }),
                        spacing: 0
                    },
                    views: counter_view.concat(type_view)
                }
            ]

            let current_view = small_widget
            if (family == 1) current_view = medium_widget
            if (family == 5 || family == 7) current_view = inline_widget
            if (family == 6) current_view = rectangular_widget

            return {
                type: "vstack",
                props: {
                    alignment: $widget.horizontalAlignment.leading,
                    frame: {
                        width: family == 5 || family == 7 ? width : family == 6 ? width - 20 : width - 30,
                        height: height
                    },
                    spacing: 0,
                    widgetURL: "tg://resolve?domain=" + username
                },
                views: current_view
            }
        }
    })
}

function spacerMaker(height, width) {
    return {
        type: "spacer",
        props: {
            frame: {
                width: width,
                height: height
            }
        }
    }
}

function entityToString(entity) {
    let entities = entity.split(';')
    entities.pop()
    let tmp = entities.map(item => String.fromCharCode(
        item[2] === 'x' ? parseInt(item.slice(3), 16) : parseInt(item.slice(2)))).join('')
    return tmp
}

function Random(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
}
