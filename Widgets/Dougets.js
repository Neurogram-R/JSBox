/*

Dougets by Neurogram

 - Medium widget only
 - Tap image to open movie web page of Douban

*/

let resp = await $http.get({
    url: `https://frodo.douban.com/api/v2/calendar/today?apikey=0ab215a8b1977939201640fa14c66bab&date=${timefmt(new Date(), "yyyy-MM-dd")}&alt=json&_sig=tuOyn%2B2uZDBFGAFBLklc2GkuQk4%3D&_ts=1610703479`,
    header: {
        "User-Agent": "api-client/0.1.3 com.douban.frodo/6.50.0"
    }
})

let movie_data = resp.data

$widget.setTimeline({
    render: ctx => {
        //$widget.family = 1
        const family = ctx.family;
        const width = $widget.displaySize.width
        const height = $widget.displaySize.height

        let poster_view = {
            type: "image",
            props: {
                uri: movie_data.comment.poster,
                resizable: true,
                scaledToFill: true,
                link: movie_data.subject.url
            }
        }

        let medium_widget = {
            type: "zstack",
            props: {
                alignment: $widget.alignment.center
            },
            views: [
                poster_view,
                {
                    type: "color",
                    props: {
                        color: "black",
                        opacity: 0.2
                    }
                },
                {
                    type: "vstack",
                    props: {
                        alignment: $widget.horizontalAlignment.leading,
                        spacing: 5,
                        frame: {
                            width: width - 20,
                            height: height
                        }
                    },
                    views: [
                        spacerMaker(height * 70 / 155, width - 20),
                        {
                            type: "hstack",
                            props: {
                                alignment: $widget.verticalAlignment.center,
                                spacing: 0
                            },
                            views: [
                                {
                                    type: "text",
                                    props: {
                                        text: `《${movie_data.subject.title}》`,
                                        font: $font("bold", 15),
                                        color: $color("white"),
                                        minimumScaleFactor: 0.5,
                                        lineLimit: 1
                                    }
                                },
                                {
                                    type: "zstack",
                                    props: {
                                        alignment: $widget.alignment.center,
                                        frame: {
                                            width: 70,
                                            height: 15
                                        }
                                    },
                                    views: [
                                        {
                                            type: "color",
                                            props: {
                                                color: $color("#FEAC2D"),
                                                cornerRadius: 7.5
                                            }
                                        },
                                        {
                                            type: "text",
                                            props: {
                                                text: `豆瓣评分 ${movie_data.subject.rating == null ? "无" : movie_data.subject.rating.value}`,
                                                font: $font("bold", 10),
                                                color: $color("black"),
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
                                text: `❝ ${movie_data.comment.content}`,
                                font: $font("bold", 12),
                                color: $color("white"),
                                minimumScaleFactor: 0.5,
                                lineLimit: 2
                            }
                        }
                    ]
                }
            ]
        }
        return family == 1 ? medium_widget : ""
    }
})

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

function timefmt(time, fmt) {
    var o = {
        "M+": time.getMonth() + 1,                 //月份 
        "d+": time.getDate(),                    //日 
        "h+": time.getHours(),                   //小时 
        "m+": time.getMinutes(),                 //分 
        "s+": time.getSeconds(),                 //秒 
        "q+": Math.floor((time.getMonth() + 3) / 3), //季度 
        "S": time.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (time.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}
