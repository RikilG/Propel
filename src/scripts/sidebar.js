toggleNewMenu = (x) => {/* function declaration */}

function showOverlay(z) {
	var overlay = document.getElementById('overlay')
	overlay.style.opacity = .6
    overlay.style.display = "block"
    overlay.style.zIndex = z
}

function hideOverlay() {
    var overlay = document.getElementById('overlay')
    document.getElementById('reminderBox').style.display = "none";
    document.getElementById('eventBox').style.display = "none";
    document.getElementById('notesBox').style.display = "none";
    document.getElementById('todoBox').style.display = "none";
    document.getElementById('goalBox').style.display = "none";
    toggleNewMenu("close")
    // close side menu
    document.getElementById("iSideBar").style.width = "0";
    if ( document.querySelector(".side-push") )
        document.querySelector(".side-push").style.marginLeft = "0";
    // document.body.style.backgroundColor = "white";
    overlay.style.display = "none"
}

/* Set the width of the side navigation to 250px and the left margin of the page content to 
250px and add a black background color to body */
function openSidebar() {
    document.getElementById("iSideBar").style.width = "250px";
    if ( document.querySelector(".side-push") )
        document.querySelector(".side-push").style.marginLeft = "250px";
    // document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
    showOverlay(7)
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, 
and the background color of body to white */
function closeSidebar() {
    hideOverlay()
}

closeSidebar()