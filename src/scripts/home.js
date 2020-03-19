const dbManager = require(process.cwd() + '/src/scripts/database')
let menuToggle = false
let menuItems = []//["reminder", "event", "notes", "todo", "goal"]
let database;
/*
reminder - set something to be reminded of - google calendar? - onetime
event - events like bday's etc - can occor repetitively
notes - short notes to look into on that day
todo - list of things to perform on that day
goal - like todo but spans over many days
*/

async function connectDatabase(callback) {
    database = await dbManager.getDatabase()
    if (callback) callback()
}

connectDatabase(() => {
    database.each('select ty_name from types;', [], (err, row) => {
        if (err) throw err
        menuItems.push(row.ty_name)
    })
})

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
    switch(date%10) {
        case 1: return date + "st"
        case 2: return date + "nd"
        case 3: return date + "rd"
        default: return date + "th"
    }
}

function dateSelected(mouseEvent, month, year) {
    let dateItem = mouseEvent.target
    document.querySelector("#iDate").innerHTML = dateToText(dateItem.date) + " " + monthToText(month)
    window.localStorage.setItem('selectedDate', `${year}-${month}-${dateItem.date}`)
    
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
        temp.date = i
        temp.onclick = (mouseEvent) => dateSelected(mouseEvent, month, year)
        if(new Date(year, month, i).getDay() == 0) // if sunday, paint orange
            temp.style.backgroundColor = "rgb(255, 175, 84)"
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

function openNewMenu() { // called in html by plus button
    floating_actions = document.querySelector(".floating-actions")

    if (menuToggle) { // menu is open, close it
        let menu_icon = document.querySelector(".floating-main")
        menu_icon.style.transform = "rotate(0deg)"
        let menu_list = document.querySelectorAll(".floating-item")
        for(let i=1;i<menu_list.length;i++) {
            menu_list[i].parentNode.removeChild(menu_list[i])
        }

        hideOverlay()
        menuToggle = false
    }
    else { // menu is closed, open it
        let menu_icon = document.querySelector(".floating-main")
        menu_icon.style.transform = "rotate(135deg)"
        showOverlay(3)
        for(let i=0;i<menuItems.length;i++) {
            let temp1 = document.createElement('div')
            temp1.classList.add("floating-item")
            let temp1img = document.createElement('img')
            temp1img.classList.add("floating-icon")
            temp1img.src = "icons/" + menuItems[i] + ".png"
            temp1.append(temp1img)
            floating_actions.append(temp1)
        }
        
        menuToggle = true // user toggled menu
    }
}

// renderCalendar()
var datetime = new Date() // get todays date
buildCalendar(datetime)

document.getElementById("iDate").innerHTML = "Today is " 
    + dateToText(datetime.getDate()) + " of " + monthToText(datetime.getMonth())