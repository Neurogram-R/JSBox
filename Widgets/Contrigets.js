/*

Contrigets by Neurogram

 - Fill items in Input Value of widget (separated by commas)
   - username 
   - username,green or username,blue (small widget & medium widget)
   - username,today
   - username,cube (rectangular widget)
 - Tap to open user GitHub page

*/

const inputValue = $widget.inputValue;
const theme_colors = {
    green: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    blue: ["#ebedf0", "#79B8FE", "#2188FF", "#005CC5", "#044289"]
}

if (inputValue) {
    let username = inputValue.split(",")[0]
    let theme = inputValue.split(",")[1] && theme_colors[inputValue.split(",")[1]] ? theme_colors[inputValue.split(",")[1]] : theme_colors.green
    let url = "https://github.com/" + username
    let resp = await $http.get(url)

    let avatar = resp.data.match(/og:image" content="([^"]+)/)[1]
    let title = resp.data.match(/<title>.+\((.+)\).*<\/title>/)[1]

    $widget.setTimeline({
        render: ctx => {
            //$widget.family = 1
            const family = ctx.family;
            const width = $widget.displaySize.width
            const height = $widget.displaySize.height

            let contributions_data = resp.data.match(/data-date="\d{4}-\d\d-\d\d".+data-level="\d+".+\n.+/g).join('\n')
            let contributions = contributions_data.replace(/(data-date="[^"]+").+(data-level="[^"]+").+\n.+>(\d+|No) contributions* on.+/g, `$1 $2 data-count="$3"`).split('\n')
            contributions.sort()

            let day_left = 6 - new Date(contributions[contributions.length - 1].match(/data-date="(\d{4}-\d\d-\d\d)/)[1]).getDay();
            contributions = contributions.slice(-((family == 1 ? 20 : family == 6 ? 15 : 9) * 7 - day_left))

            let counter = contributions.join("\n").replace(/data-count="No/g, 'data-count="0').match(/data-count="\d+/g).join("\n")
            counter = counter.replace(/data-count="/g, "").split("\n")

            let colors_data = contributions.join("\n").match(/data-level="\d+/g).join("\n")
            colors_data = colors_data.replace(/data-level="/g, "").split("\n")

            let colors_row_spacing = family == 0 ? 2 : family == 6 ? 1 : 2 // row spacing (small : rectangular : medium)
            let colors_column_spacing = family == 0 ? 4 : family == 6 ? 1 : 5.05 // column spacing (small : rectangular : medium)

            let colors_view = []
            let colors_square_width = (width - 30 - 8 * colors_row_spacing) / 9 // family == 0
            if (family == 1) colors_square_width = (width - 30 - 19 * colors_row_spacing) / 20
            if (family == 6) colors_square_width = (height - 6) / 7

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

            let inline_widget = {
                type: "text",
                props: {
                    text: family < 5 ? `(${counter_sum(counter)} CONTRIBUTIONS)` : inputValue.split(",")[1] == "today" ? colors_data[colors_data.length - 1] : `${counter_sum(counter)}`,
                    font: family > 4 ? $font("bold", 20) : $font(10),
                    color: family > 4 ? $color("white") : $color("#9A9AA1"),
                    minimumScaleFactor: 0.5,
                    lineLimit: 1
                }
            }

            let rectangular_cube_widget = {
                type: "hgrid",
                props: {
                    rows: Array(7).fill({
                        flexible: {
                            minimum: family == 6 ? 1 : 10,
                            maximum: Infinity
                        },
                        spacing: colors_column_spacing
                    }),
                    spacing: colors_row_spacing
                },
                views: colors_view
            }

            let rectangular_avatar_widget = {
                type: "hstack",
                props: {
                    alignment: $widget.verticalAlignment.center
                },
                views: [
                    {
                        type: "image",
                        props: {
                            uri: avatar,
                            frame: {
                                width: height - 8,
                                height: height - 8
                            },
                            cornerRadius: {
                                value: (height - 8) / 2,
                                style: 0
                            },
                            resizable: true
                        }
                    },
                    {
                        type: "vstack",
                        props: {
                            alignment: $widget.horizontalAlignment.leading
                        },
                        views: [
                            inline_widget,
                            {
                                type: "text",
                                props: {
                                    text: "Contributions",
                                    font: $font(10),
                                    color: $color("#9A9AA1"),
                                    minimumScaleFactor: 0.5,
                                    lineLimit: 1
                                }
                            }
                        ]
                    }
                ]
            }

            if (family == 6) return inputValue.split(",")[1] == "cube" ? rectangular_cube_widget : rectangular_avatar_widget
            if (family == 5 || family == 7) return inline_widget

            if (family < 2) return {
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
                            family == 0 ? null : inline_widget
                        ]
                    },
                    rectangular_cube_widget
                ]
            }
        }
    })
}

function counter_sum(arr) {
    let total = 0
    for (var i = 0; i < arr.length; i++) {
        total += parseFloat(arr[i])
    }
    return total
}
