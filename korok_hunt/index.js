import { createUser, findKorok, setKorok } from "./js/link.js";

const MAX_KOROK_NUMBER = 10;


// Before reloading
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
}

// AWAKE
document.addEventListener('DOMContentLoaded', _ => {
    document.getElementById("admin_button").addEventListener("click", setNewKorokAttempt);
});

// START
window.onload = async function initialize() {    
    // Check the korok from the query parameters
    await checkScannedKorok();

    // Display the user's name and korok count in the corner
    displayUserInfo();


    // TODO: Remove
    displayInfoPopup()
    //displayKorokFoundPopup(1, 4, 2, false, 2);
    //displayUnknownKorokPopup();
    //displayUsernamePopup()
}


/* Korok Management */

let scanned_korok_id;
let scanned_korok_number;
let scanned_korok_type;
/**
 * Checks if the user has reached the website by scanning a Korok and determines how to
 * handle it.
 */
async function checkScannedKorok() {
    // Get Korok data from URL search params
    const url = new URL(window.location);
    var url_params = new URLSearchParams(url.search);
    scanned_korok_id = url_params.get("k_id");
    scanned_korok_number = url_params.get("k_num");
    scanned_korok_type = url_params.get("k_type");
    // Remove the URL search params from the URL
    history.pushState(null, "", location.href.split("?")[0]);

    // Check if there was a korok id to check
    if (scanned_korok_id != null && scanned_korok_number != null && scanned_korok_type != null) {
        // Get the user's email, either from a cookie or querying the user
        var email = await getEmail();
        
        // Tell server we found a korok
        const return_data = await findKorok(email, scanned_korok_id);

        // Check that a valid Korok was found
        if (return_data != null) {
            foundValidKorok(return_data);
        } else {
            foundInvalidKorok();
        }
    }
}

/**
 * Called if an valid Korok was scanned
 */
async function foundValidKorok(return_data) {
    // Get the korok count from the saved cookie if it wasn't returned
    let korok_count;
    if (return_data.already_found) {
        korok_count = getCookie("korok_count");
        // If the cookie doesn't exist for some reason, check if the count was returned
        if (korok_count == "")
            korok_count = return_data.new_korok_count;
        if (korok_count == null)
            korok_count = "???";
        else
            setCookie("korok_count", korok_count);
    }
    else {
        korok_count = return_data.new_korok_count;
        setCookie("korok_count", korok_count);
    }
    
    // Assign Korok number and type
    let korok_number = return_data.korok_number;
    let korok_type = return_data.korok_type;

    // Decrement the count of other players found if this player has already found the korok
    let others_scan_count = return_data.prev_scan_count;
    if(return_data.already_found)
        others_scan_count -= 1;

    // Display UI
    displayKorokFoundPopup(korok_number, korok_type, korok_count, return_data.already_found, others_scan_count);
}

/**
 * Called if an invalid Korok was scanned
 */
function foundInvalidKorok(){    
    displayUnknownKorokPopup();
}


/* User Management */

/**
 * Attempts to find the user's email in cookies, and if that fails, requests the user's
 * email.
 */
async function getEmail() {
    // Check if cookie exists
    let email = getCookie("email");
    if (email == "") {
        // Request username popup underneath
        email = await requestEmail();
    }

    return email;
}

/**
 * Displays the event info popup and requests the user's email and username with a
 * separate popup. Returns the email set by the user.
 */
async function requestEmail() {
    // Never used site before, show explanation
    displayInfoPopup();
    
    // Popup to request the username
    var u_popup = displayUsernamePopup();
    const textareas = u_popup.getElementsByTagName("textarea");

    // Get the user's email and username from the popup
    var set_user_info = false;
    var email;
    var username;

    u_popup.getElementsByTagName("button")[0].onclick = async function() {
        // Check if a valid username was inputted
        email = textareas[0].value;
        username = textareas[1].value;

        // If the username was invalid
        try {
            if (email == "" || username == "") {
                throw new Error("Neither field can be empty")
            }
            if (!email.includes('@') || !email.includes('.')) {
                throw new Error("This email is invalid");
            }
            if (email.length > 32  ||  username.length > 32) {
                throw new Error("The email or username is too long");
            }
            if (!await createUser(email, username)) {
                throw new Error("Server Error: try again or try a different email");
            }
            set_user_info = true;
        }
        catch (err) {
            document.getElementById("invalid_name").style.visibility = "visible";
            document.getElementById("invalid_name").textContent = err.message;
        }
    };

    // Wait for the username to set a valid email and username
    while (!set_user_info) {
        await new Promise(r => setTimeout(r, 100));
    }

    // Cache the user's email and username
    setCookie("email", email);
    setCookie("username", username);

    closePopup(u_popup);

    return email;
}


/* Admin Management */

/**
 * Attempts to retreieve geolocation data and then calls a function to set the scanned
 * Korok into the database.
 */
function setNewKorokAttempt() {
    // Check if a Korok was scanned when opening the website
    if (scanned_korok_id == null || scanned_korok_number == null || scanned_korok_type == null) {
        console.error("A Korok has not been scanned");
        alert("A Korok has not been scanned");
        return;
    }

    // First check location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setNewKorok);
    } else {
        console.error("Geolocation is not supported by this browser");
        alert("Geolocation is not supported by this browser");
    }

}

/**
 * Sets the scanned Korok into the database with the providied geolocation
 * Prompts for the Koroks location description and an admin password
 */
async function setNewKorok(position) {
    // Check if a Korok was scanned when opening the website
    if (scanned_korok_id == null || scanned_korok_number == null || scanned_korok_type == null) {
        console.error("A Korok has not been scanned");
        alert("A Korok has not been scanned")
    }

    // Prompt for the korok location description
    let description = prompt("Location description:");
    if (description == null) {
        alert("Description cannot be empty.");
        return;
    }

    // Prompt for the admin password, if it has not been cached
    let admin_password = getCookie("admin_password");
    if (admin_password == "") {
        admin_password = prompt("Administrator Password:");
        
        if (admin_password == null) {
            alert("Password cannot be empty.");
            return;
        }
    }

    // Save the Korok to the database 
    const set_korok_success = await setKorok(scanned_korok_id, scanned_korok_number, scanned_korok_type, description, position, admin_password)
    
    // If the korok was successfully set, set the admin password as a cookie
    if (set_korok_success) {
        alert("Korok sucessfully added!");
        setCookie("admin_password", admin_password);
    } else {
        alert("Korok not added :(");
        deleteCookie("admin_password");
    }
}


/* UI */

/**
 * Displays the Korok found popup, "kf_popup", using data returned after finding a Korok
 * @returns The displayed element
 */
function displayKorokFoundPopup(korok_num, korok_type, korok_count, already_found, prev_found_count) {
    const kf_popup = document.getElementById("kf_popup");

    openPopup(kf_popup);

    //Add action to button that closes the popup
    kf_popup.getElementsByTagName("button")[0].onclick = function() { closePopup(kf_popup) };
    
    //Load correct Korok image
    document.getElementById('korok_img').src = "/korok_hunt/img/koroks/k_" + korok_type + ".png";

    //Display if this korok has already been found
    if (already_found) {
        kf_popup.getElementsByTagName("found")[0].style.color = "rgb(164, 14, 14)";
        kf_popup.getElementsByTagName("found")[0].textContent = "You've already found me!";
        kf_popup.getElementsByTagName("b_found")[0].textContent = "Ok";
    } else {
        kf_popup.getElementsByTagName("found")[0].style.color = "rgb(168, 212, 9)";
    }

    //Set korok count
    let count_display = korok_count + " Korok";
    if (korok_count != 1) {
        count_display += "s";
    }
    kf_popup.getElementsByTagName('count')[0].textContent = count_display;

    //Set prev found count
    let prev_found_display = prev_found_count + " other player";
    if (prev_found_count != 1) {
        prev_found_display += "s have";
    } else {
        prev_found_display += " has";
    }

    kf_popup.getElementsByTagName('prev_found')[0].textContent = prev_found_display;

    // Set Korok number
    kf_popup.getElementsByTagName('korok_number')[0].textContent = "#" + korok_num;


    return kf_popup;
}

/**
 * Displays the unknown Korok popup, "uk_popup"
 * @returns The displayed element
 */
function displayUnknownKorokPopup() {
    var uk_popup = document.getElementById("uk_popup");

    openPopup(uk_popup);

    // Add action to button that closes the popup
    uk_popup.getElementsByTagName("button")[0].onclick = function() { closePopup(uk_popup) };

    return uk_popup;
}

/**
 * Displays the username prompt popup, "u_popup"
 * @returns The displayed element
 */
function displayUsernamePopup() {
    var u_popup = document.getElementById("u_popup");

    openPopup(u_popup);

    return u_popup;
}

/**
 * Displays the event info popup, "i_popup"
 * @returns The displayed element
 */
function displayInfoPopup() {
    var i_popup = document.getElementById("i_popup");

    openPopup(i_popup);

    // Add action to button that closes the popup
    i_popup.getElementsByTagName("button")[0].onclick = function() { closePopup(i_popup) };

    return i_popup;
}

/**
 * Displays the user info in the "user_display" element
 * @returns The displayed element
 */
function displayUserInfo() {
    const username = getCookie("username");

    if (username != "") {
        let korok_count = getCookie("korok_count");
        if(korok_count == "")
            korok_count = 0;
        
        // Get display
        var user_display = document.getElementById("user_display");

        // Set username and korok count
        user_display.getElementsByTagName("username")[0].textContent = username;
        user_display.getElementsByTagName("count")[0].textContent = korok_count;
        
        // Fade in display
        fadeIn(user_display, 100);

        return user_display
    }

    return null;
}

var popup_set = new Set();
/**
 * Closes the given `popup` and locks the screen to from scrolled
 */
function openPopup(popup) {
    //Display stuff
    fadeIn(popup, 400);

    // Add popup to set
    popup_set.add(popup);

    //Disallow scrolling
    document.getElementById('html').style.overflow = 'hidden';
    document.getElementById('body').style.overflow = 'hidden';
}

/**
 * Closes the given `popup` and unlocks the screen to be scrolled
 */
function closePopup(popup) {
    //Display stuff
    fadeOut(popup, 400);

    // Remove popup from set
    popup_set.delete(popup);

    //Allow scrolling if the popup set is empty
    if (popup_set.size == 0) {
        document.getElementById('html').style.overflow = 'unset';
        document.getElementById('body').style.overflow = 'unset';
    }
}

/**
 * Fades in the element `elem` over the course of `ms` milliseconds
 */
function fadeIn( elem, ms ) {
    if( ! elem )
        return;

    elem.style.opacity = 0;
    elem.style.filter = "alpha(opacity=0)";
    //elem.style.display = "inline-block";
    elem.style.visibility = "visible";

    if( ms )
    {
        var opacity = 0;
        var timer = setInterval( function() {
        opacity += 50 / ms;
        if( opacity >= 1 )
        {
            clearInterval(timer);
            opacity = 1;
        }
        elem.style.opacity = opacity;
        elem.style.filter = "alpha(opacity=" + opacity * 100 + ")";
        }, 50 );
    }
    else
    {
        elem.style.opacity = 1;
        elem.style.filter = "alpha(opacity=1)";
    }
}

/**
 * Fades out the element `elem` over the course of `ms` milliseconds
 */
function fadeOut( elem, ms ) {
    if( ! elem )
        return;

    if( ms )
    {
        var opacity = 1;
        var timer = setInterval( function() {
        opacity -= 50 / ms;
        if( opacity <= 0 )
        {
            clearInterval(timer);
            opacity = 0;
            //elem.style.display = "none";
            elem.style.visibility = "hidden";
        }
        elem.style.opacity = opacity;
        elem.style.filter = "alpha(opacity=" + opacity * 100 + ")";
        }, 50 );
    }
    else
    {
        elem.style.opacity = 0;
        elem.style.filter = "alpha(opacity=0)";
        elem.style.display = "none";
        elem.style.visibility = "hidden";
    }
}


/* Utility */

/**
 * Retrieves the cookie with the given `c_name`
 */
function getCookie(c_name){
    if (document.cookie.length > 0) {
        var c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            var c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return decodeURI(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

/**
 * Sets the cookie with the given `c_name` with the given `data`
 */
function setCookie(c_name, data){
    // Build the expiration date string:
    var expiration_date = new Date();
    var cookie_string = '';
    expiration_date.setFullYear(expiration_date.getFullYear() + 1);
    // Build the set-cookie string:
    cookie_string = c_name + "=" + data + "; expires=" + expiration_date.toUTCString();
    // Create or update the cookie:
    document.cookie = cookie_string;
}

/**
 * Deletes the cookie with the given `c_name`
 */
function deleteCookie(c_name){
    if( getCookie(c_name) != "") {
        document.cookie = c_name + "=" +
          ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
      }
}