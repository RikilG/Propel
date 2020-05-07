const crypto = require(process.cwd() + '/src/scripts/cryptoUtils')
const diarydb = process.cwd() + '/database/diaries'

const fs = require('fs')
const os = require('os')
const rimraf = require('rimraf')
const sep = (os.platform()==='win32')?`\\`:`/`;

let diaryList = []
let selectedDiaryProps = {}
let selectedDiaryPass = null
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

function loadDiaryProps() {
    try {
        selectedDiaryProps = JSON.parse(fs.readFileSync(diarydb+sep+selectedDiary+sep+"props.json"))
    } catch(err) {
        notify(err, "red")
    }
}

function diarySelected(diaryDiv) {
    let diaryName = selectedDiary
    if(diaryDiv) {
        diaryName = diaryDiv.innerText
        document.querySelectorAll('.yellow-bg').forEach((element, index) => element.classList.remove('yellow-bg'))
        diaryDiv.classList.add('yellow-bg')
    }
    document.getElementById('diary-entries-content').innerHTML = ""
    document.getElementById('diary-entries-header').innerHTML = diaryName
    selectedDiary = diaryName
    loadDiaryProps()
    if (selectedDiaryProps.passwordProtected && (selectedDiaryPass == null || !crypto.verifyHash(selectedDiaryProps.passwordHash, selectedDiaryPass))) {
        showOverlay(5)
        document.querySelector("#diaryPasswdBox .title").innerHTML = "Enter Password for " + selectedDiary
        document.getElementById('diaryPasswdBox').style.display = "block"
        document.getElementById('diary-entries-content').innerHTML = ""
        return
    }
    if (selectedDiaryPass != null && !crypto.verifyHash(selectedDiaryProps.passwordHash, selectedDiaryPass)) selectedDiaryPass = null
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
        temp.onclick = (mouseEvent) => diarySelected(mouseEvent.target)
        let gear = document.createElement('div')
        gear.classList.add('diary-entry-settings')
        gear.addEventListener('click', (me) => {
            showOverlay(5)
            document.getElementById('diarySettingsBox').style.display = "block"
            selectedDiary = me.target.parentNode.innerText
            document.getElementById('tbDiaryGearName').value = me.target.parentNode.innerText
            diarySelected()
            me.stopPropagation()
        })
        temp.append(gear)
        diaryListViewer.appendChild(temp)
        diaryList.push(dirname)
    })
}

function listEntries(diaryname) {
    let entries = getFiles(diarydb + sep + diaryname).filter((value, index) => {return value != "props.json"})
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
    let encrypted = document.getElementById('chkEncryptedNew').checked
    let chkPasswd = document.getElementById('chkPasswordNew')
    let passwd = document.getElementById('tbPassNew')
    let passwdR = document.getElementById('tbPassNewR')
    let passwdHash = crypto.hash("propel")
    if (name.value == "") return notify("Invalid diary name", "red")
    if(encrypted && chkPasswd.checked && passwd.value != passwdR.value) return notify("Passwords do not match")
    if(encrypted && chkPasswd.checked && passwd.value == "") return notify("I can't encrypt with an empty password!")
    if(encrypted && chkPasswd.checked && passwd.value != "") passwdHash = crypto.hash(passwd.value)
    if(fs.existsSync(diarydb+sep+name.value.capitalize())) return notify('Already a diary exists with the same name.', "red")
    fs.mkdir(diarydb+sep+name.value.capitalize(), (err) => {
        if(err) notify(err, "red")
        else {
            props = {
                diaryName: name.value.capitalize(),
                encrypted: encrypted,
                passwordProtected: chkPasswd.checked,
                passwordHash: passwdHash
            }
            fs.writeFile(diarydb+sep+name.value.capitalize()+sep+"props.json", JSON.stringify(props), (err) => {
                if (err) notify(err, "red")
                else {
                    notify('Diary Successfully created!')
                    name.value = ""
                    hideOverlay()
                    listDiaries()
                }
            })
        }
    })
}

function deleteDiary() {
    let sanityCheck = document.getElementById('tbDiaryDelConfirm').value
    if(sanityCheck != selectedDiary) return notify("Please enter the correct name to the diary to delete.")
    rimraf.sync(diarydb+sep+selectedDiary)
    hideOverlay()
    listDiaries()
    document.getElementById('diary-entries-content').innerHTML = ""
    document.getElementById('diary-entries-header').innerHTML = "Let's start writing!"
}

function saveDiary() {
    let newName = document.getElementById('tbDiaryGearName').value
    if (newName == "") return notify("You wouldn't leave your dear diary unnamed, do you?")
    document.getElementById('tbDiaryGearName').value = ""
    let props = JSON.parse(fs.readFileSync(diarydb+sep+selectedDiary+sep+"props.json"))
    props.diaryName = newName
    fs.writeFileSync(diarydb+sep+selectedDiary+sep+"props.json", JSON.stringify(props))
    fs.renameSync(diarydb+sep+selectedDiary, diarydb+sep+newName)
    selectedDiary = newName
    hideOverlay()
    listDiaries()
    diarySelected()
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
    let passwd = document.getElementById('tbPassEditEntry')
    
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
            if (selectedDiaryProps.passwordProtected && !crypto.verifyHash(selectedDiaryProps.passwordHash, passwd.value)) return notify("Incorrect Password", "red")
            deleteEntry(true)
            createEntry(title.value, content.value, parseInt(date.value), parseInt(month.value), parseInt(year.value), selectedDiary, passwd.value)
            passwd.value = ""
        }
        return
    }
    
    selectedEntry = filename
    let data = fs.readFileSync(diarydb + sep + selectedDiary + sep + filename).toString()
    //TODO: decrypt data here
    if (selectedDiaryProps.encrypted) {
        if (selectedDiaryProps.passwordProtected) data = crypto.decrypt(data, selectedDiaryPass)
        else data = crypto.decrypt(data, "propel")
    }
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

function createEntry(ptitle, pcontent, pdate, pmonth, pyear, pdiary, pPasswd) {
    let title = ptitle || document.getElementById('user-diary-entry-title').value
    title = title.capitalize()
    let content = pcontent || document.getElementById('user-diary-entry-content').value
    let date = pdate || parseInt(document.getElementById('tbEntryD-new').value)
    let month = pmonth || parseInt(document.getElementById('tbEntryM-new').value)
    let year = pyear || parseInt(document.getElementById('tbEntryY-new').value)
    let diary = pdiary || document.getElementById('diaries-list').value
    let passwd = pPasswd || document.getElementById('tbPassEntry').value

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
    selectedDiary = diary
    loadDiaryProps()
    // TODO: encrypt data here
    console.log
    if (selectedDiaryProps.encrypted) {
        if (selectedDiaryProps.passwordProtected) {
            if(!crypto.verifyHash(selectedDiaryProps.passwordHash, passwd)) {
                return notify("Incorrect Password, gotta keep a tab on that memory of yours!", "red")
            }
            data = crypto.encrypt(data, passwd)
        }
        else {
            data = crypto.encrypt(data, "propel")
        }
    }
    fs.writeFile(filepath, data, (err) => {
        if (err) notify(err, "red")
        else {
            document.getElementById('user-diary-entry-title').value = ""
            document.getElementById('user-diary-entry-content').value = ""
            document.getElementById('tbPassEntry').value = ""
            hideOverlay()
            diarySelected()
            if(ptitle) notify("Entry edited successfully")
            else notify("Entry created successfully.")
        }
    })
}

function toggleNewDiaryEncryption(chkbox) {
    let en = document.getElementById('chkPasswordNew')
    if (chkbox != en)
        en.disabled = !chkbox.checked
    document.getElementById('tbPassNew').disabled = !chkbox.checked || !en.checked
    document.getElementById('tbPassNewR').disabled = !chkbox.checked || !en.checked
}

function verifyDiaryPass() {
    let passwd = document.getElementById('tbPass').value
    if (!crypto.verifyHash(selectedDiaryProps.passwordHash, passwd)) return notify("Incorrect Password! keep tryi'n more", "red")
    document.getElementById('tbPass').value = ""
    hideOverlay()
    selectedDiaryPass = passwd
    listEntries(selectedDiary)
    notify("Password accepted.")
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