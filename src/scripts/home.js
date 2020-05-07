let menuToggle = false
let menuItems = ["reminder", "event", "notes", "todo", "goal"] // same as what's in databaseZ
let yearSelection = false
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

function buildCalendar(datetime) {
    yearSelection = false
    let month = datetime.getMonth()
    let year = datetime.getFullYear()
    let initialDate = new Date(year, month, 1)
    let calendar = document.querySelector(".calendar-dates")
    document.querySelector(".calendar-week-days").style.display = "flex"
    calendar.innerHTML = ""
    let rowLen = 0;
    let row = document.createElement('div')
    row.classList.add('calendar-row')
    for(var j=0;j<initialDate.getDay();j++) {
        let emptyDate = document.createElement("div")
        emptyDate.classList.add("calendar-item")
        emptyDate.style.cursor = "auto"
        row.append(emptyDate)
        rowLen += 1
    }
    for(i=1;i<=monthToDays(month, year);i++) {
        if (rowLen != 0 && rowLen % 7 == 0) {
            calendar.append(row)
            row = document.createElement('div')
            row.classList.add('calendar-row')
        }
        let temp = document.createElement("div")
        temp.classList.add("calendar-item")
        temp.classList.add("date-"+i)
        temp.date = i
        temp.onclick = (mouseEvent) => {
            let temp = document.querySelector('.yellow-bg')
            if (temp) temp.classList.remove('yellow-bg')
            mouseEvent.target.classList.add('yellow-bg')
            dateSelected(year, month, mouseEvent.target.date)
        }
        if(new Date(year, month, i).getDay() == 0) {// if sunday, paint orange, remove left border
            temp.classList.add('orange-bg')
            temp.style.borderLeft = "0"
        }
        let tempDateDiv = document.createElement('div')
        tempDateDiv.innerHTML = i
        tempDateDiv.style.textAlign = "center"
        tempDateDiv.style.pointerEvents = "none"
        temp.append(tempDateDiv)
        fetchTasks(year, month, i, true, (rows) => {
            let todoAdded = false
            rows.forEach((row, value) => {
                let x = document.createElement('div')
                x.innerHTML = row.t_name
                x.classList.add('label-task')
                if (row.t_type == types.REMINDER) x.classList.add('blue-bg')
                if (row.t_type == types.EVENT) x.classList.add('brown-bg')
                if (row.t_type == types.TODO) {
                    if (todoAdded) return
                    todoAdded = true
                    x.innerHTML = "Todo list"
                    x.classList.add('red-bg')
                }
                temp.append(x)
            })
        })
        row.append(temp)
        rowLen += 1
    }
    for(;i<=42 - initialDate.getDay();i++) {
        if (rowLen % 7 == 0) {
            calendar.append(row)
            row = document.createElement('div')
            row.classList.add('calendar-row')
        }
        let emptyDate = document.createElement("div")
        emptyDate.classList.add("calendar-item")
        emptyDate.style.cursor = "auto"
        row.append(emptyDate)
        rowLen += 1
    }
    calendar.append(row)
    window.localStorage.setItem('year', year)
    window.localStorage.setItem('month', month)
    let d = new Date(window.localStorage.getItem('today'))
    if(month == d.getMonth() && year == d.getFullYear()) {
        document.querySelector(".date-"+d.getDate()).classList.add('green-bg')
        document.querySelector(".date-"+d.getDate()).classList.remove('orange-bg')
    }
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
            temp1.classList.add("tooltip-parent")
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
                document.getElementById("new" + temp1.taskName.capitalize() + "Box").style.display = "block"
                if(temp1.taskName == "reminder") initReminderOverlay()
                else if(temp1.taskName == "event") initEventOverlay()
                else if(temp1.taskName == "notes") initNotesOverlay()
                else if(temp1.taskName == "todo") initTodoOverlay()
                else if(temp1.taskName == "goal") initGoalOverlay()
            }
            floating_actions.append(temp1)
        }
        
        menuToggle = true // user toggled menu
    }
}

function prevMonth() {
    if (yearSelection) {
        window.localStorage.setItem('year', parseInt(window.localStorage.getItem('year'))-34)
        return changeYear()
    }
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
    if (yearSelection) {
        window.localStorage.setItem('year', parseInt(window.localStorage.getItem('year'))+34)
        return changeYear()
    }
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
    yearSelection = false
    let calendar = document.querySelector(".calendar-dates")
    document.querySelector(".calendar-week-days").style.display = "none"
    let currentMonth = window.localStorage.getItem('month')
    calendar.innerHTML = ""
    let row = document.createElement('div')
    row.classList.add('calendar-row')
    for(let x=0;x<12;x++) {
        if (x == 7) {
            calendar.append(row)
            row = document.createElement('div')
            row.classList.add('calendar-row')
        }
        let temp = document.createElement('div')
        temp.classList.add('calendar-item')
        temp.innerHTML = monthToText(x)
        temp.style.fontSize = "21px"
        temp.style.textAlign = "center"
        temp.month = x
        if(x == currentMonth) temp.classList.add('green-bg')
        temp.onclick = (mouseEvent) => {
            let monthEvent = mouseEvent.target
            datetime = new Date(window.localStorage.getItem('year'), monthEvent.month, 1)
            yearSelection = false
            buildCalendar(datetime)
        }
        row.append(temp)
    }
    for(let i=0;i<2;i++) {
        let temp1 = document.createElement('div')
        temp1.classList.add('calendar-item')
        row.append(temp1)
    }
    calendar.append(row)
}

function changeYear() {
    yearSelection = true
    document.querySelector(".calendar-week-days").style.display = "none"
    let calendar = document.querySelector(".calendar-dates")
    calendar.innerHTML = ""
    let currentYear = window.localStorage.getItem('year')
    let startYear = currentYear - 17
    let row = document.createElement('div')
    row.classList.add('calendar-row')
    for(let i=startYear;i<startYear+35;i++) {
        if ((i - startYear) % 7 == 0 && (i-startYear) != 0) {
            calendar.append(row)
            row = document.createElement('div')
            row.classList.add('calendar-row')
        }
        let temp = document.createElement('div')
        temp.classList.add('calendar-item')
        if (i==new Date().getFullYear()) temp.classList.add('green-bg')
        temp.innerHTML = i
        temp.style.fontSize = "21px"
        temp.style.textAlign = "center"
        temp.year = i
        temp.onclick = (mouseEvent) => {
            let yearEvent = mouseEvent.target
            datetime = new Date(yearEvent.year, 0, 1)
            window.localStorage.setItem('year', i)
            window.localStorage.setItem('selectedDate', `${i}-${1}-${1}`)
            document.querySelector(".calendar-year").innerHTML = i
            changeMonth()
        }
        row.append(temp)
    }
    calendar.append(row)
}

var datetime = new Date() // get todays date
window.localStorage.setItem('today', datetime)
window.localStorage.setItem('selectedDate', `${datetime.getFullYear()}-${datetime.getMonth()+1}-${datetime.getDate()}`)
window.localStorage.setItem('date', datetime.getDate())
window.localStorage.setItem('month', datetime.getMonth())
window.localStorage.setItem('year', datetime.getFullYear())

// renderCalendar()
buildCalendar(datetime)
dateSelected(datetime.getFullYear(), datetime.getMonth(), datetime.getDate())

document.getElementById("iDate").innerHTML = "Today is " 
    + dateToText(datetime.getDate()) + " of " + monthToText(datetime.getMonth())