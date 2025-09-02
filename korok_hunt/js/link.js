// Checks the username with the server, and creates a user account.
// If invalid, return false and an account won't be created. Otherwise, return true.
export async function createUser(email, username){
    // Send username to server
    const query_string = "https://8n8fsfczsl.execute-api.us-east-2.amazonaws.com/create_user" + "?email=" + email + "&username=" + username;
    const result = await fetch(query_string);
    const status = result.status;
    
    // If the status is 200, the username was added to the database
    return status == 200;
}


// Increments score of player and returns the new korok count, as well as the user's ranking and the korok number
export async function findKorok(email, korok_id){
    // Send username and korok id to server
    const query_string = "https://8n8fsfczsl.execute-api.us-east-2.amazonaws.com/find_korok" + "?email=" + email + "&k_id=" + korok_id;
    const result = await fetch(query_string);
    const status = result.status;
    const data = await result.json();

    // If the status is 200, the korok was successfully found
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
        + "&k_type" + korok_type
        + "&description=" + description
        + "&lat=" + lat
        + "&long=" + long
        + "&password=" + admin_password;
    const result = await fetch(query_string);
    const status = result.status;

    // If the status is 200, the username was added to the database
    return status == 200;
}


// Returns the usernames and korok counts associated with the usernames, in no order
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