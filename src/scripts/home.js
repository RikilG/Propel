const dbManager = require('./scripts/database')
const database = dbManager.getDatabase()

/* Set the width of the side navigation to 250px and the left margin of the page content to 
250px and add a black background color to body */
function openSidebar() {
    document.getElementById("iSideBar").style.width = "250px";
    if ( document.querySelector(".side-push") )
        document.querySelector(".side-push").style.marginLeft = "250px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, 
and the background color of body to white */
function closeSidebar() {
    document.getElementById("iSideBar").style.width = "0";
    if ( document.querySelector(".side-push") )
        document.querySelector(".side-push").style.marginLeft = "0";
    document.body.style.backgroundColor = "white";
}

function monthToDays(month, year) {
    switch(month) {
        case 0: return 31
        case 1: // feb
            if ( year%4==0 ) {
                if ( year%100==0 && year%400!=0 ) return 28
                return 29
            }
            else return 28
        case 2: return 31
        case 3: return 30
        case 4: return 31
        case 5: return 30
        case 6: return 31
        case 7: return 31
        case 8: return 30
        case 9: return 31
        case 10: return 30
        case 11: return 31
    }
}

function monthToText(month) {
    switch(month) {
        case 0: return "January"
        case 1: return "February"
        case 2: return "March"
        case 3: return "April"
        case 4: return "May"
        case 5: return "June"
        case 6: return "July"
        case 7: return "August"
        case 8: return "September"
        case 9: return "October"
        case 10: return "November"
        case 11: return "December"
    }
}

function buildCalendar(datetime) {
    var month = datetime.getMonth()
    var year = datetime.getFullYear()
    var initialDate = new Date(year, month, 1)
    var calendar = document.querySelector(".calendar-container")
    var i;
    for(var j=0;j<initialDate.getDay();j++) {
        let emptyDate = document.createElement("div")
        emptyDate.classList.add("calendar-item")
        emptyDate.style.cursor = "auto"
        calendar.append(emptyDate)
    }
    for(i=1;i<=monthToDays(month, year);i++) {
        let temp = document.createElement("div")
        temp.classList.add("calendar-item")
        temp.classList.add("date-"+i)
        temp.innerHTML = i
        calendar.append(temp)
    }
    for(;i<=35 - initialDate.getDay();i++) {
        let emptyDate = document.createElement("div")
        emptyDate.classList.add("calendar-item")
        emptyDate.style.cursor = "auto"
        calendar.append(emptyDate)
    }
    document.querySelector(".date-"+datetime.getDate()).style.backgroundColor = "lightgreen"
    document.querySelector(".calendar-year").innerHTML = year
    document.querySelector(".calendar-month").innerHTML = monthToText(month)
}

// renderCalendar()
var datetime = new Date() // get todays date
buildCalendar(datetime)
closeSidebar()

document.getElementById("today").innerHTML = "Today is " + datetime.getDate()