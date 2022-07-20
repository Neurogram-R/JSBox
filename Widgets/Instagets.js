/*

Instagets by Neurogram

 - Fill Instagram web login header in line 16 of the script
 - Fill Instagram usernames in Input Value of widget (separated by commas)
 - Tap image to open post
 - Tap profile to open user profile (medium widget only)
 - Set language in line 20 of the script
 - Set random post in line 21 of the script
 - Set random children post in line 22 of the script

*/

const inputValue = $widget.inputValue;
const header = {
    "Cookie": ``,
    "X-IG-App-ID": ""
}
const language = "en" // en or cn
let random_post_max = 1 // max range, 1 for lastest post
const random_children_post = true // true or false

const edge_type_label = {
    "en": ["Posts", "Followers", "Following"],
    "cn": ["帖子", "粉丝", "关注"]
}

if (inputValue) {
    let usernames = inputValue.split(",")
    let instagram_url = "https://i.instagram.com/api/v1/users/web_profile_info/?username=" + usernames[Random(0, usernames.length - 1)]
    let resp = await $http.get({
        url: instagram_url,
        header: header
    })
    let share_data = resp.data.data.user

    let counters = [numFormatter(share_data.edge_owner_to_timeline_media.count, 1), numFormatter(share_data.edge_followed_by.count, 1), numFormatter(share_data.edge_follow.count, 1)]
    let type = edge_type_label[language]

    let counter_view = []
    let type_view = []

    for (var i = 0; i < counters.length; i++) {
        counter_view.push({
            type: "text",
            props: {
                text: counters[i],
                font: $font("bold", 13),
                light: "#282828",
                dark: "white",
                minimumScaleFactor: 0.5,
                lineLimit: 1
            }
        })
        type_view.push({
            type: "text",
            props: {
                text: type[i],
                font: $font(10),
                color: $color("#aaaaaa"),
                minimumScaleFactor: 0.5,
                lineLimit: 1
            }
        })
    }

    $widget.setTimeline({
        render: ctx => {
            //$widget.family = 1
            const family = ctx.family;
            const width = $widget.displaySize.width
            const height = $widget.displaySize.height
            let share_total = share_data.edge_owner_to_timeline_media.edges

            if (random_post_max > share_total.length) random_post_max = share_total.length

            let current_share = share_total[Random(0, random_post_max - 1)].node
            let display_url = current_share.display_url

            if (random_children_post && current_share.edge_sidecar_to_children) {
                let children = current_share.edge_sidecar_to_children.edges
                display_url = children[Random(0, children.length - 1)].node.display_url
            }

            let small_widget = {
                type: "zstack",
                props: {
                    alignment: $widget.alignment.center,
                    frame: {
                        width: height,
                        height: height
                    },
                    clipped: true
                },
                views: [
                    {
                        type: "image",
                        props: {
                            uri: display_url,
                            resizable: true,
                            scaledToFill: true,
                            widgetURL: "https://www.instagram.com/p/" + current_share.shortcode
                        }
                    },
                    {
                        type: "vstack",
                        props: {
                            alignment: $widget.horizontalAlignment.leading,
                            spacing: 0
                        },
                        views: [
                            spacerMaker(family == 2 ? height * 310 / 345 : height * 130 / 155, height),
                            {
                                type: "text",
                                props: {
                                    text: `${family == 2 ? "     " : "    "}♥️ ${numFormatter(current_share.edge_liked_by.count, 1)} 💬 ${numFormatter(current_share.edge_media_to_comment.count, 1)}`,
                                    font: family == 2 ? $font(13) : $font(9),
                                    color: $color("white"),
                                    minimumScaleFactor: 0.5,
                                    lineLimit: 1
                                }
                            }
                        ]
                    }
                ]
            }

            let inline_widget = {
                type: "text",
                props: {
                    text: family < 5 ? share_data.full_name : counters[1],
                    font: $font("bold", 20),
                    light: "#282828",
                    dark: "white",
                    minimumScaleFactor: 0.5,
                    lineLimit: 1
                }
            }

            let rectangular_widget = {
                type: "hstack",
                props: {
                    alignment: $widget.verticalAlignment.center
                },
                views: [
                    {
                        type: "image",
                        props: {
                            uri: share_data.profile_pic_url_hd,
                            frame: {
                                width: family < 5 ? 35 : height - 8,
                                height: family < 5 ? 35 : height - 8
                            },
                            cornerRadius: {
                                value: family < 5 ? 17.5 : (height - 8) / 2,
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
                                    text: family < 5 ? "@" + share_data.username : type[1],
                                    font: $font(10),
                                    color: $color("#2481cc"),
                                    minimumScaleFactor: 0.5,
                                    lineLimit: 1
                                }
                            }
                        ]
                    }
                ]
            }

            let medium_widget = {
                type: "hstack",
                props: {
                    alignment: $widget.verticalAlignment.center,
                    spacing: 7.5
                },
                views: [
                    small_widget,
                    {
                        type: "vstack",
                        props: {
                            alignment: $widget.horizontalAlignment.leading,
                            spacing: 13,
                            frame: {
                                width: width - height - 15,
                                height: height
                            },
                            link: "https://www.instagram.com/" + instagram_url.match(/username=(.+)/)[1]
                        },
                        views: [
                            rectangular_widget,
                            {
                                type: "text",
                                props: {
                                    text: share_data.biography,
                                    font: $font(10),
                                    light: "#282828",
                                    dark: "white",
                                    minimumScaleFactor: 0.5,
                                    lineLimit: 3
                                }
                            },
                            {
                                type: "vgrid",
                                props: {
                                    columns: Array(counter_view.concat(type_view).length / 2).fill({
                                        flexible: {
                                            minimum: 10,
                                            maximum: Infinity
                                        }
                                    })
                                },
                                views: counter_view.concat(type_view)
                            }
                        ]
                    },
                    spacerMaker(height, 0)
                ]
            }

            if (family == 0 || family == 2) return small_widget
            if (family == 1) return medium_widget
            if (family == 5 || family == 7) return inline_widget
            if (family == 6) return rectangular_widget
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

function numFormatter(num, digits) {
    const si = [
        { value: 1, symbol: "" },
        { value: 1E3, symbol: "K" },
        { value: 1E6, symbol: "M" },
        { value: 1E9, symbol: "G" },
        { value: 1E12, symbol: "T" },
        { value: 1E15, symbol: "P" },
        { value: 1E18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}

function Random(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
}
