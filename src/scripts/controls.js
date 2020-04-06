toggleNewMenu = (x) => {/* function declaration */}

function showOverlay(z) {
	var overlay = document.getElementById('overlay')
	overlay.style.opacity = .6
    overlay.style.display = "block"
    overlay.style.zIndex = z
}

function hideOverlay() {
    var overlay = document.getElementById('overlay')
    let closeList = document.querySelectorAll('.specialBox')
    // close popuups
    closeList.forEach((value, index) => {
        value.style.display = "none"
    })
    toggleNewMenu("close")
    // close side menu
    document.getElementById("iSideBar").style.width = "0";
    if ( document.querySelectorAll(".side-push").length > 0 )
        document.querySelectorAll(".side-push").forEach((value, index) => value.style.marginLeft = "0")
    // hide overlay
    overlay.style.display = "none"
    // convert buttons back to normal
    if (document.getElementById('btnEntryEdit')) document.getElementById('btnEntryEdit').style.display = "block"
    if (document.getElementById('btnEntrySave')) document.getElementById('btnEntrySave').style.display = "none"
}

/* Set the width of the side navigation to 250px and the left margin of the page content to 
250px and add a black background color to body */
function openSidebar() {
    document.getElementById("iSideBar").style.width = "250px";
    if ( document.querySelectorAll(".side-push").length > 0 )
        document.querySelectorAll(".side-push").forEach((value, index) => value.style.marginLeft = "250px")
    // document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
    showOverlay(7)
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, 
and the background color of body to white */
function closeSidebar() {
    hideOverlay()
}

function hideNotification() {
    document.getElementById("notification").style.display = "none";
}

function notify(text, color) {
    let n = document.getElementById("notification")
    n.innerHTML = text
    if(color == "red") {
        n.style.backgroundColor = "rgba(199, 68, 35, 0.8)"
    }
    else {
        n.style.backgroundColor = "rgba(32, 108, 179, 0.9)"
    }
    // console.log(text)
    n.style.display = "block"
    setTimeout(() => {
        n.style.display = "none"
    }, 5000)
}

closeSidebar()