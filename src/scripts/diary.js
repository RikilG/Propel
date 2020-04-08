// const crypto = require(process.cwd() + '/src/scripts/cryptoUtils')
const diarydb = process.cwd() + '/database/diaries'

const fs = require('fs')
const os = require('os')
const sep = (os.platform()==='win32')?`\\`:`/`;

let diaryList = []
let selectedDiary = ""
let selectedEntry = ""

String.prototype.capitalize = function() { // a captalize function
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

function getDirs(source) {
    return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

function getFiles(source) {
    return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() == false)
    .map(dirent => dirent.name)
}

function diarySelected(diaryDiv) {
    let diaryName = selectedDiary
    if(diaryDiv) diaryName = diaryDiv.innerHTML
    document.getElementById('diary-entries-content').innerHTML = ""
    document.getElementById('diary-entries-header').innerHTML = diaryName
    selectedDiary = diaryName
    if(diaryDiv) {
        document.querySelectorAll('.yellow-bg').forEach((element, index) => element.classList.remove('yellow-bg'))
        diaryDiv.classList.add('yellow-bg')
    }
    listEntries(diaryName)
}

function listDiaries() {
    let diaries = getDirs(diarydb)
    let diaryListViewer = document.getElementById('diary-list-content')
    diaryListViewer.innerHTML = ""
    diaryList = []
    diaries.forEach((dirname, index) => {
        let temp = document.createElement('div')
        temp.classList.add('diary-list-item')
        temp.classList.add('green-bg')
        temp.innerHTML = dirname
        temp.onclick = (mouseEvent) => diarySelected(mouseEvent.target);
        diaryListViewer.appendChild(temp)
        diaryList.push(dirname)
    })
}

function listEntries(diaryname) {
    let entries = getFiles(diarydb + sep + diaryname)
    let container = document.getElementById('diary-entries-content')
    container.innerHTML = ""
    entries.sort((a,b) => {
        a = parseInt(a.split('-')[2])
        b = parseInt(b.split('-')[2])
        if(a>b) return -1
        else return 1
    })
    entries.forEach((entry, index) => {
        let temp = document.getElementById('diary-entry-template').cloneNode(true)
        temp.classList.add('diary-entry-item')
        temp.classList.add('orange-bg')
        let namesplit = entry.split('-')
        let title = namesplit[3] || entry
        let date = (title)?`${namesplit[0]}-${namesplit[1]}-${namesplit[2]}`:entry
        temp.children[0].innerHTML = title // title
        temp.children[1].innerHTML = date // date
        temp.filename = entry
        temp.onclick = () => viewEntry(temp.filename)
        container.appendChild(temp)
    })
}

function createDiary() {
    let name = document.getElementById('tbDiaryTitleNew')
    if (name.value == "") {
        notify("Invalid diary name", "red")
        return
    }
    if(fs.existsSync(diarydb+sep+name.value.capitalize())) {
        notify('Already a diary exists with the same name.', "red")
        return
    }
    fs.mkdir(diarydb+sep+name.value.capitalize(), (err) => {
        if(err) notify(err, "red")
        else {
            notify('Diary Successfully created!')
            name.value = ""
            hideOverlay()
            listDiaries()
        }
    })
}

function newEntry() {
    showOverlay(5)
    document.getElementById('newEntryBox').style.display = 'block'
    let date = new Date()
    document.getElementById('tbEntryD-new').value = date.getDate()
    document.getElementById('tbEntryM-new').value = date.getMonth()+1
    document.getElementById('tbEntryY-new').value = date.getFullYear()
    let diaryDropDown = document.getElementById('diaries-list')
    diaryDropDown.innerHTML = ""
    diaryList.forEach((diary, index) => {
        let temp = document.createElement('option')
        temp.innerHTML = diary
        temp.value = diary
        temp.setAttribute('value', diary)
        diaryDropDown.appendChild(temp)
        if(diary == selectedDiary) diaryDropDown.selectedIndex = index
    })
    if(selectedDiary == "") diaryDropDown.selectedIndex = "-1"
    if(document.getElementById('user-diary-entry-content').value.trim() == "") 
        document.getElementById('user-diary-entry-content').value = ""
}

function viewEntry(filename) {
    let title = document.getElementById('user-diary-entry-title-edit')
    let content = document.getElementById('user-diary-entry-content-edit')
    let date = document.getElementById('tbEntryD-edit')
    let month = document.getElementById('tbEntryM-edit')
    let year = document.getElementById('tbEntryY-edit')
    
    if(filename == null) {
        title.disabled = false;
        content.disabled = false;
        date.disabled = false;
        month.disabled = false;
        year.disabled = false;
        let btnEdit = document.getElementById('btnEntryEdit')
        let btnSave = document.getElementById('btnEntrySave')
        btnEdit.style.display = "none"
        btnSave.style.display = "block"
        btnSave.onclick = () => {
            deleteEntry(true)
            createEntry(title.value, content.value, parseInt(date.value), parseInt(month.value), parseInt(year.value), selectedDiary)
        }
        return
    }
    
    selectedEntry = filename
    let data = fs.readFileSync(diarydb + sep + selectedDiary + sep + filename)
    // TODO: decode data here
    let entry = JSON.parse(data)
    document.getElementById('editEntryBox').style.display = "block"
    showOverlay(5)

    
    title.value = entry.title; title.disabled = true;
    content.value = entry.content; content.disabled = true
    date.value = entry.date; date.disabled = true;
    month.value = entry.month; month.disabled = true;
    year.value = entry.year; year.disabled = true;
    diary = entry.diary
}

function deleteEntry(nonotify) {
    fs.unlink(diarydb + sep + selectedDiary + sep + selectedEntry, (err) => {
        if (err) notify(err, "red")
        else {
            hideOverlay()
            if(!nonotify) notify("successfully deleted entry.")
            diarySelected()
        }
    })
}

function createEntry(ptitle, pcontent, pdate, pmonth, pyear, pdiary) {
    let title = ptitle || document.getElementById('user-diary-entry-title').value
    title = title.capitalize()
    let content = pcontent || document.getElementById('user-diary-entry-content').value
    let date = pdate || parseInt(document.getElementById('tbEntryD-new').value)
    let month = pmonth || parseInt(document.getElementById('tbEntryM-new').value)
    let year = pyear || parseInt(document.getElementById('tbEntryY-new').value)
    let diary = pdiary || document.getElementById('diaries-list').value

    if(diaryList.length == 0) return notify("You don't have a diary yet! create one to store your entries")
    if(content.trim() == "") return notify("Its a waste of space to store empty entries!")
    if(!diaryList.includes(diary)) return notify("Selected Diary does not exist!", "red")
    if(!date || date>31 || date<1) return notify("Improper date provided.", "red")
    if(!month || month>12 || month<1) return notify("Improper month provided", "red")
    if(!year || year<1) return notify("Aa c'mon, the year is improper!")

    let entry = {title: title, content: content, date: date, month: month, year: year, diary: diary}
    let data = JSON.stringify(entry)
    let filename = (title!="")?`${year}-${month}-${date}-${title}`:`${year}-${month}-${date}`
    let filepath = diarydb + sep + diary + sep + filename

    if (fs.existsSync(filepath)) {
        return notify("A file already exists for the given date and title. consider editing corresponding file")
    }

    // TODO: encrypt data here
    fs.writeFile(filepath, data, (err) => {
        if (err) notify(err, "red")
        else {
            document.getElementById('user-diary-entry-title').value = ""
            document.getElementById('user-diary-entry-content').value = ""
            hideOverlay()
            diarySelected()
            if(ptitle) notify("Entry edited successfully")
            else notify("Entry created successfully.")
        }
    })
}

// create a diary store location if not exists
if(!fs.existsSync(diarydb)) {
    fs.mkdirSync(diarydb, (err) => {
        if(err) notify(err, "red")
        else notify('Diary location: ' + diarydb)
    })
}

listDiaries()
if(document.getElementById('diary-list-content').innerHTML == "") 
    document.getElementById('diary-list-content').innerHTML = "You don't have any diaries yet! create one to store your memories."