import { getKorokInfo, getCookie } from "../js/link.js";

// START
window.onload = function initialize(){    
    populateKorokBoard();
}

/**
 * Gets the list of Korok info, sorts it, and displays it on the page
 */
async function populateKorokBoard() {
    // Get all korok info
    let korok_info = await findKorokInfo();
    if (korok_info == null) {
        console.error("Korok info could not be retrieved");
        return;
    }
        
    // Sort list of Koroks
    sortKorokInfo(korok_info);

    // Display Koroks onto board
    displayKorokInfo(korok_info);
}

/**
 * Attempts to find the user scores in session storage, and if that fails, requests them
 * from the backend
 */
async function findKorokInfo() {
    // Get raw list of names and koroks from session storage
    let korok_info = JSON.parse(sessionStorage.getItem("korok_info"));
    const scores_expiration_date = sessionStorage.getItem("korok_info_expiration_date");

    // If they don't exist in session storage, request them from the backend
    if (korok_info == null  ||  scores_expiration_date < Date.now()) {
        // Get user email
        const email = getCookie("email");

        // Get list from server
        korok_info = await getKorokInfo(email);
        // Check if the scores were returned
        if (korok_info == null) {
            return null;
        }
        // Save it to the session storage, and set it to expire in 1 minute
        sessionStorage.setItem("korok_info", JSON.stringify(korok_info));
        sessionStorage.setItem("korok_info_expiration_date", Date.now() + 1*60000);
    }

    return korok_info;
}

/**
 * Sorts the `korok_info` based on their Korok number
 */
function sortKorokInfo(korok_info) {
    korok_info.sort( function(a, b) {
        return a.korok_number - b.korok_number;
    });
}

/**
 * Displays the `korok_info` in order on the page
 */
function displayKorokInfo(korok_info) {
    // Change nothing if there are no Koroks
    if(korok_info == null || korok_info.length == 0) {
        return;
    }

    let korok_board = document.getElementById("koroks_board");
    const korok_board_element = korok_board.getElementsByClassName("board_item")[0];

    for (let i = 0; i < korok_info.length; i++) {
        // Copy korok_board element and add values to it
        let new_korok_board_element = korok_board_element.cloneNode(true);

        // Set Korok number
        const korok_number_string = "#" + korok_info[i].korok_number.toString().padStart(3, '0');
        new_korok_board_element.getElementsByTagName("korok_number")[0].textContent = korok_number_string;
        // Set image unhidden if user has found that Korok
        if (korok_info[i].user_found_korok) {
            new_korok_board_element.getElementsByTagName("img")[0].style.visibility = "visible";
        }
        // Set number of times scanned
        let times_scanned_string = "Found " + korok_info[i].times_scanned + " time";
        if (korok_info[i].times_scanned != 1) {
            times_scanned_string += 's';
        }
        new_korok_board_element.getElementsByTagName("times_scanned")[0].textContent = times_scanned_string;

        // Append new element to the end of the korok_board
        korok_board.appendChild(new_korok_board_element);
    }

    // Remove the first element
    korok_board.removeChild(korok_board_element);
}