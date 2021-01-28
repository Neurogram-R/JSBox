/*

Netgets by Neurogram

 - medium widget only
 - Fill Netflix country name in Input Value of widget.(default USA)
 - Support countries list in line 16 of the script
 - Tap image to open movie web page of Netflix

*/

const inputValue = $widget.inputValue;

const default_country = "USA"

const country_list = {
    "Australia": "australia",
    "Austria": "austria",
    "Bangladesh": "bangladesh",
    "Belgium": "belgium",
    "Brazil": "brazil",
    "Canada": "canada",
    "CostaRica": "costa-rica",
    "Denmark": "denmark",
    "Egypt": "egypt",
    "Finland": "finland",
    "France": "france",
    "Germany": "germany",
    "HongKong": "hong-kong",
    "India": "india",
    "Ireland": "ireland",
    "Israel": "israel",
    "Italy": "italy",
    "Japan": "japan",
    "Luxembourg": "luxembourg",
    "Mexico": "mexico",
    "Netherlands": "netherlands",
    "NewZealand": "new-zealand",
    "Norway": "norway",
    "Pakistan": "pakistan",
    "Panama": "panama",
    "Philippines": "philippines",
    "Portugal": "portugal",
    "Russia": "russia",
    "Singapore": "singapore",
    "SouthAfrica": "south-africa",
    "SouthKorea": "south-korea",
    "Spain": "spain",
    "Sweden": "sweden",
    "Switzerland": "switzerland",
    "Taiwan": "taiwan",
    "Thailand": "thailand",
    "USA": "usa",
    "UnitedKingdom": "united-kingdom"
}

let resp = await $http.get(`https://whatsnewonnetflix.com/${inputValue ? country_list[inputValue] : country_list[default_country]}`)

let resp_data = resp.data.match(/<div class="card card--md layout-2 (movie|season|show)(.|\n)*social-sharing/g)

let movie_data = []
for (var i in resp_data) {
    let title = resp_data[i].match(/card__title.+title="([^"]+)/)
    let poster = resp_data[i].match(/http.+\.(jpg|png)/)[0]
    let type = resp_data[i].match(/card card--md layout-2\s[^"]+/)[0]
    let description = resp_data[i].match(/truncate">.+/)[0]
    let link = resp_data[i].match(/https:\/\/netflix.com[^"]+/)[0]

    let entities = description.match(/&#\d{2,3};/g)
    if (entities) {
        for (var k in entities) {
            let rExp = new RegExp(entities[k], "g")
            description = description.replace(rExp, entityToString(entities[k]))
        }
    }

    movie_data.push([title[1], poster, type.replace(/card card--md layout-2\s/, "").toUpperCase(), html_decode(description.replace(/truncate">/, "")), link])
}
movie_data = movie_data[Random(0, movie_data.length - 1)]

$widget.setTimeline({
    render: ctx => {
        //$widget.family = 1
        const family = ctx.family;
        const width = $widget.displaySize.width
        const height = $widget.displaySize.height

        let poster_view = {
            type: "image",
            props: {
                uri: movie_data[1],
                resizable: true,
                scaledToFill: true,
                link: movie_data[4]
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
                        opacity: 0.3
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
                                        text: `${movie_data[0]}  `,
                                        font: $font("bold", 15),
                                        color: $color("white"),
                                        minimumScaleFactor: 0.8,
                                        lineLimit: 1
                                    }
                                },
                                {
                                    type: "zstack",
                                    props: {
                                        alignment: $widget.alignment.center,
                                        frame: {
                                            width: 50,
                                            height: 15
                                        }
                                    },
                                    views: [
                                        {
                                            type: "color",
                                            props: {
                                                color: $color("#e50914"),
                                                cornerRadius: 7.5
                                            }
                                        },
                                        {
                                            type: "text",
                                            props: {
                                                text: `${movie_data[2]}`,
                                                font: $font("bold", 10),
                                                color: $color("white"),
                                                minimumScaleFactor: 0.8,
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
                                text: `${movie_data[3]}`,
                                font: $font("bold", 12),
                                color: $color("white"),
                                minimumScaleFactor: 0.5,
                                lineLimit: 3
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

function Random(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
}

function entityToString(entity) {
    let entities = entity.split(';')
    entities.pop()
    let tmp = entities.map(item => String.fromCharCode(
        item[2] === 'x' ? parseInt(item.slice(3), 16) : parseInt(item.slice(2)))).join('')
    return tmp
}

function html_decode(str) {
    if (str.length == 0) return ""
    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&acute;/g, "\'").replace(/&quot;/g, "\"");
}
