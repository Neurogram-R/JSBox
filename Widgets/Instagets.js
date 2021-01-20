/*

Instagets by Neurogram

 - Fill Instagram web login cookie in line 13 of the script
 - Fill Instagram username in Input Value of widget.
 - Tap image to open post
 - Tap profile to open user profile (medium widget only)

*/

const inputValue = $widget.inputValue;
const cookie = `LOGIN_COOKIE`

if (inputValue) {
    let instagram_url = "https://www.instagram.com/" + inputValue
    let resp = await $http.get({
        url: instagram_url,
        header: {
            "Cookie": cookie
        }
    })
    let share_data = resp.data.match(/window._sharedData = .+?<\/script>/)
    share_data = share_data[0].replace(/window._sharedData = |;<\/script>/g, "")
    share_data = JSON.parse(share_data).entry_data.ProfilePage[0].graphql.user

    let counters = resp.data.match(/og:description" content=".+/)
    counters = counters[0].replace(/og:description" content="|\s-\s.+/g, "").replace(/, /g, " ").split(/ /)

    let counter_view = []
    let type_view = []

    for (var i = 0; i < counters.length; i = i + 2) {
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
                text: counters[i + 1],
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
            const lastest_share = share_data.edge_owner_to_timeline_media.edges[0].node

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
                            uri: lastest_share.display_url,
                            resizable: true,
                            scaledToFill: true,
                            widgetURL: "https://www.instagram.com/p/" + lastest_share.shortcode
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
                                    text: `${family == 2 ? "     " : "    "}♥️ ${lastest_share.edge_liked_by.count} 💬 ${lastest_share.edge_media_to_comment.count}`,
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
                            link: instagram_url
                        },
                        views: [
                            {
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
                                                width: 35,
                                                height: 35
                                            },
                                            cornerRadius: {
                                                value: 17.5,
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
                                            {
                                                type: "text",
                                                props: {
                                                    text: share_data.full_name,
                                                    font: $font("bold", 20),
                                                    light: "#282828",
                                                    dark: "white",
                                                    minimumScaleFactor: 0.5,
                                                    lineLimit: 1
                                                }
                                            },
                                            {
                                                type: "text",
                                                props: {
                                                    text: "@" + share_data.username,
                                                    font: $font(10),
                                                    color: $color("#2481cc"),
                                                    minimumScaleFactor: 0.5,
                                                    lineLimit: 1
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
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
            return family == 1 ? medium_widget : small_widget
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
