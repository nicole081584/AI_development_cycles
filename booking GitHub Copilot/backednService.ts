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
 *  purchaseVoucher - POST /vouchers
 * 
 **/

import { giftVoucher } from "./giftVoucher";
import { booking } from "./booking";


const apibase = "http://192.168.4.39:3001/"; //Home
//const apibase = "http://192.168.178.30:3001/"; //Anton
//const apibase = "http://192.168.1.23:3001/"; // Oma
//change to server address once installed on a separat server

/**
 * A helper function to format dates for the booking backend.
 * Converts a date string from "YYYY-MM-DD" to "DD/MM/YYYY" format if it contains dashes.
 * 
 * @param dateValue the date string to format
 * @returns the formatted date string
 */
function formatDateForBookingBackend(dateValue: string): string {
  if (dateValue.includes('-')) {
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }

  return dateValue;
}

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
 * Retrieves available booking slots for a given date and number of guests.
 *
 * @param date           the selected date in YYYY-MM-DD format
 * @param numberOfGuests number of guests for the booking
 * @returns              object containing request status, slots, and optional message
 */
export async function getBookingSlots(
  date: string,
  numberOfGuests: number
): Promise<{ success: boolean; slots: string[]; message?: string }> {
  const formattedDate = formatDateForBookingBackend(date);

  console.log('Requesting booking slots with:', {
    date,
    formattedDate,
    numberOfGuests,
  });

  const url = `${apibase}bookingSlots?date=${encodeURIComponent(formattedDate)}&numberOfGuests=${encodeURIComponent(
    String(numberOfGuests)
  )}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();
    console.log('Booking slots raw response:', json);

    if (json.status === 'success') {
      const slots = Array.isArray(json.data) ? json.data : [];
      if (!Array.isArray(json.data)) {
        console.warn('Booking slots response contained unexpected data:', json.data);
      }
      console.log('Booking slots retrieved:', slots);
      return { success: true, slots, message: json.message || 'Booking slots retrieved successfully.' };
    }

    console.warn('Booking slots request failed:', json.message);
    return { success: false, slots: [], message: json.message || 'No booking slots available.' };
  } catch (error: any) {
    console.error('Fetch failed for booking slots:', error);
    alert('Error retrieving booking slots: ' + (error.message || String(error)));
    return { success: false, slots: [], message: 'Unable to retrieve booking slots.' };
  }
}

/**
 * Creates a new booking via POST request to /makeBooking endpoint.
 *
 * @param title        customer title
 * @param firstName    customer first name
 * @param lastName     customer last name
 * @param phoneNumber  customer phone number
 * @param email        customer email address
 * @param numberOfGuests number of guests
 * @param date         booking date in DD/MM/YYYY format
 * @param time         booking time slot
 * @param comment      optional booking comments
 * @returns            object containing success status and message
 */
export async function makeBooking(
  title: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  email: string,
  numberOfGuests: number,
  date: string,
  time: string,
  comment: string
): Promise<{ success: boolean; message: string; booking?: booking }> {
  const formattedDate = formatDateForBookingBackend(date);

  console.log('Submitting booking with:', {
    title,
    firstName,
    lastName,
    phoneNumber,
    email,
    numberOfGuests,
    date,
    formattedDate,
    time,
    comment,
  });

  const url = `${apibase}makeBooking`;
  const bookingPayload = {
    title,
    firstName,
    lastName,
    phoneNumber,
    email,
    numberOfGuests,
    date: formattedDate,
    time,
    comment,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    });

    const json = await response.json();
    console.log('Booking response:', json);

    if (json.status === 'success') {
      // Backend may return the booking as an object or an array with one element
      const data = Array.isArray(json.data) ? json.data[0] : json.data;

      // Map returned data into the frontend `booking` class
      const bookingData = {
        title: data?.title || title,
        firstName: data?.firstName || firstName,
        lastName: data?.lastName || lastName,
        phoneNumber: data?.phoneNumber || phoneNumber,
        email: data?.email || email,
        numberOfGuests: data?.numberOfGuests ?? numberOfGuests,
        dateOfBooking: data?.dateOfBooking || data?.date || formattedDate,
        time: data?.time || time,
        comment: data?.comment || comment || '',
        bookingNumber: data?.bookingNumber || data?.booking_number || 'N/A',
        dateBookingWasMade: data?.dateBookingWasMade || data?.dateMade || new Date().toISOString(),
      };

      const bookingObj = new booking(
        bookingData.title,
        bookingData.firstName,
        bookingData.lastName,
        bookingData.phoneNumber,
        bookingData.email,
        bookingData.numberOfGuests,
        bookingData.dateOfBooking,
        bookingData.time,
        bookingData.comment,
        bookingData.bookingNumber,
        bookingData.dateBookingWasMade
      );

      console.log('Mapped booking object:', bookingObj);

      return {
        success: true,
        message: json.message || 'Booking created successfully.',
        booking: bookingObj,
      };
    }

    console.warn('Booking creation failed:', json.message);
    return { success: false, message: json.message || 'Failed to create booking.' };
  } catch (error: any) {
    console.error('Fetch failed for booking creation:', error);
    alert('Error creating booking: ' + (error.message || String(error)));
    return { success: false, message: 'Unable to create booking. Please try again later.' };
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
 * Purchases a new voucher.
 *
 * @param title        customer title
 * @param firstName    customer first name
 * @param lastName     customer last name
 * @param phoneNumber  customer phone number
 * @param email        customer email address
 * @param value        value of the voucher
 * @returns            giftVoucher object containing the purchased voucher details
 */
export async function purchaseVoucher(
  title: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  email: string,
  value: number
): Promise<giftVoucher> {
  console.log('Purchasing voucher:', {
    title,
    firstName,
    lastName,
    phoneNumber,
    email,
    value,
  });

  const url = `${apibase}vouchers`;

  try {
    const response = await fetch(url, {
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
        value,
      }),
    });

    const json = await response.json();
    const data = checkResponse(json);

    console.log('Voucher purchase response:', data);

    if (!data || !data[0]) {
      throw new Error('Invalid response format: voucher data not found');
    }

    const voucherData = data[0];
    const voucher = new giftVoucher(
      voucherData.title,
      voucherData.firstName,
      voucherData.lastName,
      voucherData.phoneNumber,
      voucherData.email,
      voucherData.value,
      voucherData.date,
      voucherData.voucherNumber,
      voucherData.adjustedValue,
      voucherData.dateUsed
    );

    console.log('Voucher object created:', {
      title: voucher.title,
      firstName: voucher.firstName,
      lastName: voucher.lastName,
      phoneNumber: voucher.phoneNumber,
      email: voucher.email,
      value: voucher.value,
      date: voucher.date,
      voucherNumber: voucher.voucherNumber,
    });

    return voucher;
  } catch (error: any) {
    console.error('Purchase voucher failed:', error);
    throw error;
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