/*

Contrigets by Neurogram

 - Fill GitHub username and theme color in Input Value of widget (separated by commas)
 - Support theme color: green, blue
 - Tap to open user GitHub page

*/

const inputValue = $widget.inputValue;
const theme_colors = {
    green: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    blue: ["#ebedf0", "#79B8FE", "#2188FF", "#005CC5", "#044289"]
}

if (inputValue) {
    let username = inputValue.split(",")[0]
    let theme = inputValue.split(",")[1] ? theme_colors[inputValue.split(",")[1]] : theme_colors.green
    let url = "https://github.com/" + username
    let resp = await $http.get(url)

    let avatar = resp.data.match(/og:image" content="([^"]+)/)[1]
    let title = resp.data.match(/<title>.+\((.+)\).*<\/title>/)[1]
    let counter = resp.data.match(/\d{1,},*\d* contributions/)[0]

    $widget.setTimeline({
        render: ctx => {
            //$widget.family = 1
            const family = ctx.family;
            const width = $widget.displaySize.width
            const height = $widget.displaySize.height

            let contributions = resp.data.match(/<g transform="translate(.|\n)+?<\/g>/g)
            contributions = family == 0 ? contributions.slice(-9).join("\n") : contributions.slice(-20).join("\n")
            let colors_data = contributions.match(/data-level="\d+/g).join("\n")
            colors_data = colors_data.replace(/data-level="/g, "").split("\n")

            let colors_view = []
            let colors_square_width = family == 0 ? (width - 30 - 8 * 2.5) / 9 : (width - 30 - 19 * 2.5) / 20

            for (var i = 0; i < colors_data.length; i++) {
                colors_view.push({
                    type: "color",
                    props: {
                        light: theme[colors_data[i]],
                        dark: colors_data[i] == "0" ? "#3E3E41" : theme[colors_data[i]],
                        frame: {
                            width: colors_square_width,
                            height: colors_square_width
                        },
                        cornerRadius: 2
                    }
                })
            }

            let counter_view = {
                type: "text",
                props: {
                    text: `(${counter.toUpperCase()})`,
                    font: $font(10),
                    color: $color("#9A9AA1"),
                    minimumScaleFactor: 0.5,
                    lineLimit: 1
                }
            }

            return {
                type: "vstack",
                props: {
                    alignment: $widget.horizontalAlignment.leading,
                    spacing: 10,
                    frame: {
                        width: width - 30,
                        height: height
                    },
                    widgetURL: url
                },
                views: [
                    {
                        type: "hstack",
                        props: {
                            alignment: $widget.verticalAlignment.center,
                            spacing: 3
                        },
                        views: [
                            {
                                type: "image",
                                props: {
                                    uri: avatar,
                                    frame: {
                                        width: 20,
                                        height: 20
                                    },
                                    cornerRadius: {
                                        value: 10,
                                        style: 0
                                    },
                                    resizable: true
                                }
                            },
                            {
                                type: "text",
                                props: {
                                    text: title.toUpperCase(),
                                    font: $font("bold", 13),
                                    color: $color("#9A9AA1"),
                                    minimumScaleFactor: 0.5,
                                    lineLimit: 1
                                }
                            },
                            family == 0 ? null : counter_view
                        ]
                    },
                    {
                        type: "hgrid",
                        props: {
                            rows: Array(7).fill({
                                flexible: {
                                    minimum: 10,
                                    maximum: Infinity
                                },
                                spacing: 4
                            }),
                            spacing: 2.5
                        },
                        views: colors_view
                    }
                ]
            }
        }
    })
}
