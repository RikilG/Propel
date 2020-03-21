let menuToggle = false
let menuItems = ["reminder", "event", "notes", "todo", "goal"] // same as what's in databaseZ
/*
reminder - set something to be reminded of - google calendar? - onetime
event - events like bday's etc - can occor repetitively
notes - short notes to look into on that day
todo - list of things to perform on that day
goal - like todo but spans over many days
*/

String.prototype.capitalize = function() { // a captalize function
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
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

function dateToText(date) {
    if(date>10 && date<20) return date + "th"
    else if(date%10 == 1) return date + "st"
    else if(date%10 == 2) return date + "nd"
    else if(date%10 == 3) return date + "rd"
    else return date + "th"
}

function dateSelected(mouseEvent, month, year) {
    let dateItem = mouseEvent.target
    document.querySelector("#iDate").innerHTML = dateToText(dateItem.date) + " " + monthToText(month)
    window.localStorage.setItem('selectedDate', `${year}-${month}-${dateItem.date}`)
    window.localStorage.setItem('date', dateItem.date)
    window.localStorage.setItem('month', month)
    window.localStorage.setItem('year', year)
}

function buildCalendar(datetime) {
    let month = datetime.getMonth()
    let year = datetime.getFullYear()
    let initialDate = new Date(year, month, 1)
    let calendar = document.querySelector(".calendar-container")
    let day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    calendar.innerHTML = ""
    for(var x=0;x<7;x++) {
        let temp = document.createElement('div')
        temp.classList.add('calendar-header')
        if(x == 0) temp.style.borderLeft = "0"
        temp.innerHTML = day[x]
        calendar.append(temp)
    }
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
        temp.date = i
        temp.onclick = (mouseEvent) => dateSelected(mouseEvent, month, year)
        if(new Date(year, month, i).getDay() == 0) {// if sunday, paint orange, remove left border
            temp.style.backgroundColor = "rgb(255, 175, 84)"
            temp.style.borderLeft = "0"
        }
        temp.innerHTML = i
        calendar.append(temp)
    }
    for(;i<=35 - initialDate.getDay();i++) {
        let emptyDate = document.createElement("div")
        emptyDate.classList.add("calendar-item")
        emptyDate.style.cursor = "auto"
        calendar.append(emptyDate)
    }
    window.localStorage.setItem('year', year)
    window.localStorage.setItem('month', month)
    let d = new Date(window.localStorage.getItem('today'))
    if(month == d.getMonth() && year == d.getFullYear())
        document.querySelector(".date-"+d.getDate()).style.backgroundColor = "lightgreen"
    document.querySelector(".calendar-year").innerHTML = year
    document.querySelector(".calendar-month").innerHTML = monthToText(month)
}

// function showOverlay(z) {
//     var overlay = document.getElementById('overlay')
//     var specialBox = document.getElementById('specialBox');
//     overlay.style.display = "block"
// 	// overlay.style.opacity = .2
//     overlay.style.zIndex = z
//     specialBox.style.display = "block"
// }

// function hideOverlay() {
//     var overlay = document.getElementById('overlay')
//     var specialBox = document.getElementById('specialBox');
//     overlay.style.display = "none"
//     specialBox.style.display = "none"
// }

function toggleNewMenu(action) { // called in html by plus button
    if(action == "close" && menuToggle == false) return;
    else if(action == "open" && menuToggle == true) return;

    floating_actions = document.querySelector(".floating-actions")

    if (menuToggle) { // menu is open, close it
        document.querySelector(".floating-main .tooltip").innerHTML = "New"
        let menu_icon = document.querySelector(".floating-main .floating-icon")
        menu_icon.style.transform = "rotate(0deg)"
        let menu_list = document.querySelectorAll(".floating-item")
        for(let i=1;i<menu_list.length;i++) {
            menu_list[i].parentNode.removeChild(menu_list[i])
        }

        if(!action) hideOverlay()
        menuToggle = false
    }
    else { // menu is closed, open it
        document.querySelector(".floating-main .tooltip").innerHTML = "Close"
        let menu_icon = document.querySelector(".floating-main .floating-icon")
        menu_icon.style.transform = "rotate(135deg)"
        showOverlay(3)
        for(let i=0;i<menuItems.length;i++) {
            let temp1 = document.createElement('div')
            temp1.classList.add("floating-item")
            temp1.taskName = menuItems[i]
            let temp1img = document.createElement('img')
            temp1img.classList.add("floating-icon")
            temp1img.src = "icons/" + menuItems[i] + ".png"
            temp1.append(temp1img)
            let temp1tooltip = document.createElement('div')
            temp1tooltip.classList.add('tooltip')
            temp1tooltip.innerHTML = menuItems[i].capitalize()
            temp1.append(temp1tooltip)
            temp1.onclick = () => {
                toggleNewMenu()
                showOverlay(5)
                document.getElementById(temp1.taskName + "Box").style.display = "block"
                // if(temp1.taskName == "reminder") 
            }
            floating_actions.append(temp1)
        }
        
        menuToggle = true // user toggled menu
    }
}

function prevMonth() {
    let month = parseInt(window.localStorage.getItem('month'))
    let year = parseInt(window.localStorage.getItem('year'))
    if(month == 0) {
        year = year-1
        month = 12
    }
    month = month-1
    let datetime = new Date(year, month, window.localStorage.getItem('date'))
    buildCalendar(datetime)
}

function nextMonth() {
    let month = parseInt(window.localStorage.getItem('month'))
    let year = parseInt(window.localStorage.getItem('year'))
    if(month == 11) {
        year = year+1
        month = -1
    }
    month = month+1
    let datetime = new Date(year, month, window.localStorage.getItem('date'))
    buildCalendar(datetime)
}

function changeMonth() {
    let calendar = document.querySelector(".calendar-container")
    calendar.innerHTML = ""
    for(var i=0;i<7;i++) {
        let temp1 = document.createElement('div')
        temp1.classList.add('calendar-item')
        calendar.append(temp1)
    }
    for(var x=0;x<12;x++) {
        let temp = document.createElement('div')
        temp.classList.add('calendar-item')
        temp.innerHTML = monthToText(x)
        temp.style.fontSize = "21px"
        temp.month = x
        temp.onclick = (mouseEvent) => {
            let monthEvent = mouseEvent.target
            datetime = new Date(window.localStorage.getItem('year'), monthEvent.month, 1)
            buildCalendar(datetime)
        }
        calendar.append(temp)
    }
    for(var i=0;i<2;i++) {
        let temp1 = document.createElement('div')
        temp1.classList.add('calendar-item')
        calendar.append(temp1)
    }
}

function changeYear() {
    let calendar = document.querySelector(".calendar-container")
    calendar.innerHTML = ""
    
}

var datetime = new Date() // get todays date
window.localStorage.setItem('today', datetime)
window.localStorage.setItem('selectedDate', `${datetime.getFullYear()}-${datetime.getMonth()}-${datetime.getDate()}`)

// renderCalendar()
buildCalendar(datetime)

document.getElementById("iDate").innerHTML = "Today is " 
    + dateToText(datetime.getDate()) + " of " + monthToText(datetime.getMonth())