/** 
 * This is the code to connect to the taxi service API provided seprately.
 * 
 * The following routes are supported:
 *  getBookingSlots - GET /bookingSlots
 *  makeBooking - POST /bookings
 *  checkUserType - GET /userType
 *  getBooking - POST /bookings/search
 *  searchVouchers - POST /vouchers/search
 *  redeemVoucher - POST /vouchers/redeem
 *  purchaseVoucher - POST /vouchers
 * 
 **/

import { giftVoucher } from "./giftVoucher";
import { booking } from "./booking";

const apibase = "http://192.168.4.39:3001/";

type BookingSlotsResult = {
  success: boolean;
  slots: string[];
  message: string;
};

type MakeBookingResult = {
  success: boolean;
  data: booking | null;
  message: string;
};

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

function formatDateForBookingBackend(dateValue: string): string {
  if (dateValue.includes('-')) {
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  }

  return dateValue;
}

export async function getBookingSlots(
  date: string,
  numberOfGuests: number
): Promise<BookingSlotsResult> {

  const formattedDate = formatDateForBookingBackend(date);

  console.log("Requesting booking slots from backend:", {
    originalDate: date,
    formattedDate,
    numberOfGuests,
  });

  const url = `${apibase}bookingSlots?date=${encodeURIComponent(formattedDate)}&numberOfGuests=${encodeURIComponent(numberOfGuests)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await response.json();

    console.log("Raw booking slots response from backend:", json);

    if (json.status === "success") {
      return {
        success: true,
        slots: json.data,
        message: '',
      };
    }

    return {
      success: false,
      slots: [],
      message: json.message || "Available booking slots could not be retrieved.",
    };

  } catch (error: any) {
    console.error("Fetch failed when retrieving booking slots:", error);

    return {
      success: false,
      slots: [],
      message: "Error retrieving available booking slots: " + (error.message || String(error)),
    };
  }
}

/**
 * Function to create a booking through the backend.
 * This contacts the existing booking endpoint and sends the customer
 * and booking details in the request body.
 *
 * If the booking is successful, the backend response is mapped into the
 * frontend booking object before being returned.
 *
 * @param title           the selected customer title
 * @param firstName       the customer's first name
 * @param lastName        the customer's last name
 * @param phoneNumber     the customer's phone number
 * @param email           the customer's email address
 * @param numberOfGuests  the selected number of guests
 * @param date            the selected booking date
 * @param time            the selected booking time
 * @param comment         optional customer comments or special requirements
 * @returns               success status, mapped booking object, and feedback message
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
): Promise<MakeBookingResult> {

  const formattedDate = formatDateForBookingBackend(date);

  console.log("Submitting booking to backend:", {
    title,
    firstName,
    lastName,
    phoneNumber,
    email,
    numberOfGuests,
    originalDate: date,
    formattedDate,
    time,
    comment,
  });

  const url = `${apibase}makeBooking`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        firstName,
        lastName,
        phoneNumber,
        email,
        numberOfGuests,
        date: formattedDate,
        time,
        comment,
      }),
    });

    const json = await response.json();

    console.log("Raw make booking response from backend:", json);

    if (json.status === "success") {
      if (!json.data || !json.data[0]) {
        console.log("Booking response was successful but data was missing:", json);

        return {
          success: false,
          data: null,
          message: "Booking was created but booking details could not be read.",
        };
      }

      const bookingData = json.data[0];

      console.log("Booking data returned from backend:", bookingData);

      const createdBooking = new booking(
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

      console.log("Booking object created in frontend backendService:", createdBooking);

      return {
        success: true,
        data: createdBooking,
        message: '',
      };
    }

    console.log("Make booking request returned failure:", json.message);

    return {
      success: false,
      data: null,
      message: json.message || "Booking could not be completed.",
    };

  } catch (error: any) {
    console.error("Fetch failed when making booking:", error);

    return {
      success: false,
      data: null,
      message: "Error making booking: " + (error.message || String(error)),
    };
  }
}

export async function checkUserType(emailUsername: string, bookingNumberPassword:string): Promise<string> {
  const url = `${apibase}userType?emailUsername=${emailUsername}&bookingNumberPassword=${bookingNumberPassword}`;

  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const json = await response.json();

    if (json.status !== "success") {
      console.log("User Type: " + json.message);
      return json.message;
    }

    console.log("User Type: " + json.data);
    return json.data;

  } catch (error: any) {
    console.error("Fetch failed:", error);
    alert("Error sending retrieving user Type: " + (error.message || String(error)));
    return '';
  }
}

export async function searchBookings(filter: string, from?: string, to?: string): Promise<booking[]> {
  console.log("Requesting booking search with:", { filter, from, to });

  const body: any = { filter };
  if (from) body.from = from;
  if (to) body.to = to;

  try {
    const response = await fetch(`${apibase}bookings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  try {
    const response = await fetch(`${apibase}vouchers/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

export async function purchaseVoucher(
  title: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  email: string,
  value: number
): Promise<giftVoucher> {
  console.log('Purchasing voucher:', { title, firstName, lastName, phoneNumber, email, value });

  try {
    const response = await fetch(`${apibase}vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, firstName, lastName, phoneNumber, email, value }),
    });

    const json = await response.json();
    const data = checkResponse(json);

    if (!data || !data[0]) {
      throw new Error('Invalid response format: voucher data not found');
    }

    const voucherData = data[0];

    return new giftVoucher(
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

  } catch (error: any) {
    console.error('Purchase voucher failed:', error);
    throw error;
  }
}

export async function redeemVoucher(reference: string, amount?: string): Promise<any> {
  if (reference.length !== 18) {
    console.log("Invalid voucher reference");
    alert("Voucher reference must be exactly 18 characters.");
    return null;
  }

  console.log("Redeeming voucher:", reference, "amount:", amount);

  try {
    const response = await fetch(`${apibase}vouchers/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, amount }),
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