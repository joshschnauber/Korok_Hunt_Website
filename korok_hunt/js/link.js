// Checks the username with the server, and creates a user account.
// If invalid, returns false and an account won't be created. Otherwise, return true.
export async function createUser(email, username){
    // Send username to server
    const query_string = "https://8n8fsfczsl.execute-api.us-east-2.amazonaws.com/create_user"
        + "?email=" + email
        + "&username=" + username;
    const result = await fetch(query_string);
    const status = result.status;
    const data = await result.json();
    
    // If the status is 200, the username was added to the database
    return data;
}


// Increments score of player and returns the new korok count, as well as the user's ranking and the korok number
export async function findKorok(email, korok_id){
    // Send username and korok id to server
    const query_string = "https://8n8fsfczsl.execute-api.us-east-2.amazonaws.com/find_korok" 
        + "?email=" + email
        + "&k_id=" + korok_id;
    const result = await fetch(query_string);
    const data = await result.json();

    return data;
}


// Returns the usernames and korok counts associated with every user, in no order
export async function getUserScores() {
    // Send request for user scores
    const query_string = "https://8n8fsfczsl.execute-api.us-east-2.amazonaws.com/get_user_scores";
    const result = await fetch(query_string);
    const status = result.status;
    const data = await result.json();

    if (status == 200) {
        return data;
    } else {
        return null;
    }
}


/**
 * Returns the korok number and number of times scanned for each Korok, as well as if the
 * user with the `email' has scanned the Korok.
 */
export async function getKorokInfo(email) {
    // Send request for user scores
    const query_string = "https://8n8fsfczsl.execute-api.us-east-2.amazonaws.com/get_korok_info"
        + (email != null ? "?email=" + email : "");
    const result = await fetch(query_string);
    const status = result.status;
    const data = await result.json();

    if (status == 200) {
        return data;
    } else {
        return null;
    }
}


// Sets the koroks position
export async function setKorok(korok_id, korok_number, korok_type, description, position, admin_password){
    const lat = position.coords.latitude;
    const long = position.coords.longitude;

    // Send params to server
    const query_string = "https://8n8fsfczsl.execute-api.us-east-2.amazonaws.com/set_korok"
        + "?k_id=" + korok_id
        + "&k_num=" + korok_number
        + "&k_type=" + korok_type
        + "&description=" + description
        + "&lat=" + lat
        + "&long=" + long
        + "&password=" + admin_password;
    const result = await fetch(query_string);
    const status = result.status;

    // Display error
    if (status != 200) {
        console.error(result);
    }

    // If the status is 200, the username was added to the database
    return status == 200;
}


/**
 * Retrieves the cookie with the given `c_name`
 * Returns null if the cookie does not exist
 */
export function getCookie(c_name){
    if (document.cookie.length > 0) {
        var c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            var c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            // Check that the cookie is not an empty string
            if(c_start < c_end) {
                return decodeURI(document.cookie.substring(c_start, c_end));
            }
        }
    }
    return null;
}

/**
 * Sets the cookie with the given `c_name` with the given `data`
 */
export function setCookie(c_name, data){
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
 * Deletes the cookie with the given `c_name`, if it exists
 */
export function deleteCookie(c_name){
    if( getCookie(c_name) != null) {
        document.cookie = c_name + "=" +
          ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
    }
}