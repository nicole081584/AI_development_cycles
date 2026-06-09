 /** 
 * This is the code to connect to the taxi service API provided seprately.
 * 
 * The following routes are supported:
 *  getBookingSlots - GET /bookingSlots
 *  makeBooking - POST /makeBooking
 *  checkUserType - GET /userType
 *  getBooking - POST /bookings/search
 *  searchVouchers - POST /vouchers/search
 * redeemVoucher - POST /vouchers/redeem
 * 
 **/

import { giftVoucher } from "./giftVoucher";
import { booking } from "./booking";


const apibase = "http://192.168.4.39:3001/"; //Home
//const apibase = "http://192.168.178.30:3001/"; //Anton
//const apibase = "http://192.168.1.23:3001/"; // Oma
//change to server address once installed on a separat server



/**
 * A helper function to parse gift Vouchers from a JSON object.
 * Convert data to a list of gift Vouchers by parsing the string date into Date objects.
 * 
 * @param permits returns a list of pased Vouchers.
 */
function parseVoucher(vouchers: any): giftVoucher[] {
  const result = vouchers.map((voucher:any) => {
    const gv = new giftVoucher (
      voucher.title,
      voucher.firstName,
      voucher.lastName, 
      voucher.phoneNumber,
      voucher.email,
      voucher.value,
      voucher.date, 
      voucher.voucherNumber);
    return gv;
  });

  return result;
}

/**
 * Checks the JSON response for errors and handles them
 *
 * @param  response  the JSON object recived from the service
 * @return processes response
 */
function checkResponse(response:any):any {
  if (response.status!="success") {
    throw(response.message);
  }
  else if (response.data) {
    return response.data;
  }
  else {
    return response;
  }
}

/**
 * Retrieves available Booking slots for a given date
 * 
 * error handling: throws an error if the service returns an error
 * 
 * @param   date            the date the user wants to book a table 
 * @param numberOfGuests    number of Guests in teh party to be booked
 * @returns bookingslots    all available time slots or that day
 */
export async function getBookingSlots(date:string, numberOfGuests: number)
            :Promise<string[]> {

    if (numberOfGuests == 0){
      console.log("Number of guests is 0.");
      alert ("Please select the number of Guests.");
      return [];
    }

    else {
  
   console.log("Requesting booking slots for: ", {date}, " and ",{numberOfGuests}, " Guests");

   const url = `${apibase}bookingSlots?date=${encodeURIComponent(date)}&numberOfGuests=${numberOfGuests}`;


  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

     // Check for success based on the actual API response, not HTTP status
    if (json.status !== "success") {
        console.log("Slots: " + json.message);
        return [json.message]; // Return the error message in an array
      }
    else {
      console.log("Slots: " + json.data.join(", "));
      return json.data;
    } 

  } 
  catch (error: any) {
    console.error("Fetch failed:", error);
    alert("Error sending retrieving booking slots: " + (error.message || String(error)));
    return []; // return an empty array so the app doesn't crash
  }
}

            }

/**
 * Makes a booking for a given date and time and obtain a booking number 
 * 
 * error handling: throws an error if the service returns an error
 * 
 * @param title           customers title
 * @param lastName        customers last name
 * @param firstName       customers first Name
 * @param phoneNumber     the contact phone number for the customer
 * @param email           the email address of the customer
 * @param numberOfGuests  number of guests in the party
 * @param date            Date of the booking
 * @param time            time of the booking
 * @param comment         any comment the guest would like to leave
 * @returns               the booking fully filled in, including number
 */
export async function makeBooking(
    title: string,
    firstName: string,
    lastName:string, 
    phoneNumber: string, 
    email: string, 
    numberOfGuests:number,
    date : string,
    time: string,
    comment: string)
            :Promise<booking[]> {
  
   console.log("Sending request body:", {
    title,
    firstName,
    lastName,
    phoneNumber,
    email,
    numberOfGuests,
    date,
    time,
    comment
  });

  try {
    const response = await fetch(apibase + "makeBooking", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        firstName,
        lastName,
        phoneNumber,
        email,
        numberOfGuests,
        date,
        time,
        comment
      }),
      
    });
    const json = await response.json();
    const data = checkResponse(json);
    console.log ("Booking made: " +JSON.stringify(data))
    return data;
    

  } 
  catch (error: any) {
    console.error("Fetch failed:", error);
    alert("Error making booking: " + (error.message || String(error)));
    return []; // return an empty array so the app doesn't crash
  }
}

/**
 * Retrieves userType for given Email/Username and Booking Number/Password
 * 
 * error handling: throws an error if the service returns an error
 * 
 * @param   Email/Username            The Email/Username of the User 
 * @param   Booking Number/Password   The Booking Number/Password of the User
 * @returns userType                  The Type of user either 'booking' or 'admin'
 */
export async function checkUserType(emailUsername: string, bookingNumberPassword:string)
            :Promise<string> {

   const url = `${apibase}userType?emailUsername=${emailUsername}&bookingNumberPassword=${bookingNumberPassword}`;


  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

     // Check for success based on the actual API response, not HTTP status
    if (json.status !== "success") {
        console.log("User Type: " + json.message);
        return json.message; // Return the error message in an array
      }
    else {
      console.log("User Type: " + json.data);
      return json.data;
    } 

  } 
  catch (error: any) {
    console.error("Fetch failed:", error);
    alert("Error sending retrieving user Type: " + (error.message || String(error)));
    return ''; // return an empty string so the app doesn't crash
  }
}

/**
 * Searches bookings using flexible filters (e.g. date range)
 * 
 * @param filter   type of search filter (e.g. 'date')
 * @param from     start date (YYYY-MM-DD)
 * @param to       end date (YYYY-MM-DD)
 * @returns bookings   array of booking data
 */
export async function searchBookings(
  filter: string,
  from?: string,
  to?: string
): Promise<booking[]> {

  console.log("Requesting booking search with:", {
    filter,
    from,
    to
  });

  const url = `${apibase}bookings/search`;

  // ✅ BUILD BODY (no ISO conversion!)
  const body: any = {
    filter
  };

  if (from) body.from = from;
  if (to) body.to = to;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();
    const data = checkResponse(json);

    console.log("Bookings retrieved:", data);

    return data;

  } catch (error: any) {
    console.error("Fetch failed:", error);
    alert("Error retrieving booking data: " + (error.message || String(error)));
    return [];
  }
}
/**
 * Retrieves voucher(s) based on provided filters
 * 
 * error handling: throws an error if the service returns an error
 * 
 * @param filters   object containing optional search fields:
 *                  reference, email, phone, name, purchaseDate, from Date, to Date, status (sold/redeemed)
 * @returns vouchers   array of voucher data matching the filters
 */
export async function searchVouchers(filters: {
  reference?: string;
  email?: string;
  phone?: string;
  name?: string;
  purchaseDate?: string;
  fromDate?: string;
  toDate?: string;
  status?: 'sold' | 'redeemed';
}): Promise<any[]> {

  if (filters.reference && filters.reference.length !== 18) {
    console.log("Invalid voucher reference");
    alert("Voucher reference must be exactly 18 characters.");
    return [];
  }

  console.log("Requesting voucher data with filters:", filters);

  const url = `${apibase}vouchers/search`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters }),
    });

    const json = await response.json();
    const data = checkResponse(json);

    console.log("Vouchers retrieved: " + JSON.stringify(data));

    return data;

  } catch (error: any) {
    console.error("Fetch failed:", error);
    alert("Error retrieving voucher data: " + (error.message || String(error)));
    return [];
  }
}

/**
 * Redeems a voucher (full or partial)
 * 
 * @param reference   voucher reference
 * @param amount      optional amount for partial redemption
 * @returns           updated voucher data
 */
export async function redeemVoucher(
  reference: string,
  amount?: string
): Promise<any> {

  if (reference.length !== 18) {
    console.log("Invalid voucher reference");
    alert("Voucher reference must be exactly 18 characters.");
    return null;
  }

  console.log("Redeeming voucher:", reference, "amount:", amount);

  const url = `${apibase}vouchers/redeem`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference,
        amount
      }),
    });

  
   const text = await response.text();
    // try to parse it as JSON, if it fails log the error and show an alert, then return null
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse failed:", e);
      alert("Server did not return valid JSON");
      return null;
    }
   const data = checkResponse(json);

    console.log("Redeem result:", data);

    return data;

  } catch (error: any) {
    console.error("Redeem failed:", error);
    alert("Error redeeming voucher: " + (error.message || String(error)));
    return null;
  }
}