// app/(tabs)/menu/bookings.tsx
import { useState } from 'react';
import { Image } from 'expo-image';
import { TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, View, ImageBackground } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import Footer from '@/components/Footer';
import ContainerStyles from '@/components/ContainerStyles';
import ButtonAndInputStyles from '@/components/ButtonAndInputStyles';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import BookingCalendar from '@/libraries/bookingCalender';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isValidEmail, isValidPhoneNumber } from '@/libraries/validationServices';
import { getBookingSlots, makeBooking } from '@/libraries/backendService';
import { booking } from '@/libraries/booking';

export default function BookingsScreen() {
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(0);
  const [dateOfBooking, setDateOfBooking] = useState('');
  const [time, setTime] = useState('');
  const [comment, setComment] = useState('');

  // Time slot state
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Confirmed booking returned from backend — used to display the confirmation view
  const [confirmedBooking, setConfirmedBooking] = useState<booking | null>(null);

  /**
   * Resets all form fields and booking state back to their defaults.
   * Used when the user presses "Back" from the confirmation view to start a new booking.
   */
  const resetForm = () => {
    console.log("resetForm called — clearing form for a new booking");
    setTitle('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setNumberOfGuests(0);
    setDateOfBooking('');
    setTime('');
    setComment('');
    setTimeSlots([]);
    setSlotsMessage('');
    setSlotsLoading(false);
    setSubmitting(false);
    setConfirmedBooking(null);
  };

  /**
   * Fetches available booking slots from the backend for the given date and guest count.
   * Handles success and failure responses and updates UI state accordingly.
   * Resets the currently selected time and any previous slot message before each fetch.
   *
   * @param date     the selected date (YYYY-MM-DD)
   * @param guests   the number of guests
   */
  const fetchTimeSlots = async (date: string, guests: number) => {
    console.log("fetchTimeSlots called — date:", date, "guests:", guests);

    setTime('');
    setTimeSlots([]);
    setSlotsMessage('');
    setSlotsLoading(true);

    const result = await getBookingSlots(date, guests);

    setSlotsLoading(false);

    if (result.success) {
      console.log("fetchTimeSlots — success, slots received:", result.slots);
      setTimeSlots(result.slots);
      setSlotsMessage('');
    } else {
      console.warn("fetchTimeSlots — failed to retrieve slots:", result.message);
      setTimeSlots([]);
      setSlotsMessage(result.message);
    }
  };

  /**
   * Called when the user selects a date from the calendar.
   * Checks that number of guests has been selected first.
   * If not, shows feedback and does not store the date.
   * If guests are already selected, stores the date and fetches available slots.
   */
  const handleDateSelected = (date: string) => {
    if (numberOfGuests === 0) {
      Alert.alert('Please select number of guests before a date.');
      setDateOfBooking('');
      return;
    }
    console.log("Date selected:", date, "— fetching slots for", numberOfGuests, "guest(s)");
    setDateOfBooking(date);
    fetchTimeSlots(date, numberOfGuests);
  };

  /**
   * Validates all required fields when the Make Booking button is pressed.
   * Uses the existing email and phone validation services.
   * Returns true only if all validation passes.
   */
  const validateInputs = (): boolean => {

    if (!title) {
      Alert.alert('Please select a title.');
      return false;
    }

    if (!firstName.trim()) {
      Alert.alert('Please enter your first name.');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Please enter your last name.');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Please enter your email address.');
      return false;
    } else if (!isValidEmail(email)) {
      Alert.alert('Please enter a valid email address.');
      return false;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Please enter your phone number.');
      return false;
    } else if (!isValidPhoneNumber(phoneNumber)) {
      Alert.alert('Please enter a valid UK phone number.');
      return false;
    }

    if (numberOfGuests === 0) {
      Alert.alert('Please select the number of guests.');
      return false;
    }

    if (!dateOfBooking) {
      Alert.alert('Please select a date.');
      return false;
    }

    if (!time) {
      Alert.alert('Please select a time slot.');
      return false;
    }

    return true;
  };

  /**
   * Submits the booking to the backend after the user has confirmed their details.
   * Shows a loading overlay while the request is in flight.
   * On success: stores the returned booking object, which switches the page to the
   * confirmation view.
   * On failure: displays an error message with the restaurant phone number as fallback.
   */
  const submitBooking = async () => {
    console.log("submitBooking called — sending booking to backend");
    setSubmitting(true);

    const result = await makeBooking(
      title,
      firstName,
      lastName,
      phoneNumber,
      email,
      numberOfGuests,
      dateOfBooking,
      time,
      comment
    );

    setSubmitting(false);

    if (result.success && result.booking) {
      console.log("submitBooking — booking confirmed, bookingNumber:", result.booking.bookingNumber);
      setConfirmedBooking(result.booking);
    } else {
      console.warn("submitBooking — booking failed:", result.message);
      Alert.alert(
        'Booking Failed',
        result.message + '\n\nPlease try again or phone us directly on 028 3883 2444.',
      );
    }
  };

  /**
   * Called when the Make Booking button is pressed.
   * Runs validation, then shows a confirmation dialog with the entered details.
   * Only submits the booking if the user confirms.
   */
  const handleMakeBooking = () => {
    console.log("Make Booking pressed — running validation");

    if (!validateInputs()) {
      console.log("Validation failed — booking not submitted");
      return;
    }

    console.log("Validation passed — showing confirmation dialog");

    // Format date for display in the confirmation dialog (DD/MM/YYYY)
    const [year, month, day] = dateOfBooking.split('-');
    const displayDate = `${day}/${month}/${year}`;

    Alert.alert(
      'Confirm Your Booking',
      `Please check your details before confirming:\n\n` +
      `Name:    ${title} ${firstName} ${lastName}\n` +
      `Email:   ${email}\n` +
      `Phone:   ${phoneNumber}\n` +
      `Guests:  ${numberOfGuests}\n` +
      `Date:    ${displayDate}\n` +
      `Time:    ${time}` +
      (comment ? `\n\nComments: ${comment}` : ''),
      [
        {
          text: 'Go Back',
          style: 'cancel',
          onPress: () => console.log("Confirmation cancelled — user returned to form"),
        },
        {
          text: 'Confirm Booking',
          onPress: () => {
            console.log("User confirmed booking — proceeding to submit");
            submitBooking();
          },
        },
      ]
    );
  };

  // ── CONFIRMATION VIEW ──────────────────────────────────────────────
  // Shown in place of the booking form once a booking has been confirmed by the backend.
  if (confirmedBooking) {
    console.log("Rendering booking confirmation view for bookingNumber:", confirmedBooking.bookingNumber);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>
        <ParallaxScrollView>
          <ImageBackground
            source={require('@/assets/images/booking_background.png')}
            style={ContainerStyles.voucherBackground}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <ThemedText
              type="voucherTitle"
              accessibilityRole="header"
              accessible={true}
            >
              Booking
            </ThemedText>

            <ThemedText
              type="voucherValue"
              accessible={true}
              accessibilityLabel={`Booking number ${confirmedBooking.bookingNumber}`}
            >
              Booking Number: {confirmedBooking.bookingNumber}
            </ThemedText>

            <ThemedText
              type="voucher"
              accessible={true}
              accessibilityLabel={`Date of booking: ${confirmedBooking.dateOfBooking}`}
            >
              Date: {confirmedBooking.dateOfBooking}
            </ThemedText>
            <ThemedText
              type="voucher"
              accessible={true}
              accessibilityLabel={`Time of booking: ${confirmedBooking.time}`}
            >
              Time: {confirmedBooking.time}
            </ThemedText>
            <ThemedText
              type="voucher"
              accessible={true}
              accessibilityLabel={`Number of guests: ${confirmedBooking.numberOfGuests}`}
            >
              Number of Guests: {confirmedBooking.numberOfGuests}
            </ThemedText>

            <ThemedText
              type="voucherFineprint"
              accessible={true}
              accessibilityLabel="A confirmation email has been sent. Please check your spam folder if you cannot see it in your inbox. We are looking forward to welcoming you to our award-winning restaurant. You can amend this booking by going to the Login page in the app and using your booking number and email address to log in, or by phoning us directly on 028 3883 2444."
            >
              A confirmation email has been sent. Please check your spam folder if you cannot see it in your inbox. We are looking forward to welcoming you to our award-winning restaurant.{'\n\n'}
              You can amend this booking by going to the Login page in the app and using your booking number and email address to log in, or by phoning us directly on 028 3883 2444.
            </ThemedText>
          </ImageBackground>

          <ThemedView style={ContainerStyles.stepContainer}>
            <TouchableOpacity
              style={ButtonAndInputStyles.button}
              onPress={() => {
                console.log("Back button pressed — returning to booking input screen");
                resetForm();
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Back"
              accessibilityHint="Returns to the booking form to make another booking"
            >
              <ThemedText type="defaultSemiBold" style={{ color: '#ffffff' }}>
                Back
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <Footer />
        </ParallaxScrollView>
      </SafeAreaView>
    );
  }

  // ── BOOKING FORM VIEW ──────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>

      {/* Loading overlay shown while booking submission is in progress */}
      <Modal
        visible={submitting}
        transparent
        animationType="fade"
        accessibilityViewIsModal={true}
      >
        <View
          style={ContainerStyles.loadingOverlay}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel="Submitting your booking, please wait"
        >
          <ActivityIndicator size="large" color="#ffffff" accessibilityLabel="Loading" />
          <ThemedText type="defaultSemiBold" style={{ color: '#ffffff', marginTop: 16 }}>
            Submitting your booking...
          </ThemedText>
        </View>
      </Modal>

      <ParallaxScrollView>

        <Image
          source={require('@/assets/images/bookings.png')}
          style={ContainerStyles.titleImage}
          accessible={false}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />

        <ThemedView style={ContainerStyles.stepContainer}>

          {/* Title */}
          <ThemedText
            type="defaultSemiBold"
            nativeID="titleLabel"
            accessibilityRole="text"
          >
            Title
          </ThemedText>
          <ThemedView
            style={ButtonAndInputStyles.pickerWrapper}
            accessible={true}
            accessibilityLabel={`Title, currently ${title || 'not selected'}`}
            accessibilityHint="Opens a list to choose your title"
          >
            <Picker
              selectedValue={title}
              onValueChange={(value) => setTitle(value)}
              style={ButtonAndInputStyles.picker}
              accessibilityLabel="Title"
            >
              <Picker.Item label="Select title..." value="" />
              <Picker.Item label="Mr" value="Mr" />
              <Picker.Item label="Mrs" value="Mrs" />
              <Picker.Item label="Ms" value="Ms" />
              <Picker.Item label="Miss" value="Miss" />
              <Picker.Item label="Dr" value="Dr" />
              <Picker.Item label="Prof" value="Prof" />
              <Picker.Item label="Rev" value="Rev" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </ThemedView>

          {/* First Name */}
          <ThemedText type="defaultSemiBold">First Name</ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            autoCapitalize="words"
            accessibilityLabel="First name"
            accessibilityHint="Enter your first name"
          />

          {/* Last Name */}
          <ThemedText type="defaultSemiBold">Last Name</ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            autoCapitalize="words"
            accessibilityLabel="Last name"
            accessibilityHint="Enter your last name"
          />

          {/* Email */}
          <ThemedText type="defaultSemiBold">Email Address</ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address"
          />

          {/* Phone Number */}
          <ThemedText type="defaultSemiBold">Phone Number</ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Phone number"
            keyboardType="phone-pad"
            accessibilityLabel="Phone number"
            accessibilityHint="Enter your UK phone number"
          />

          {/* Number of Guests */}
          <ThemedText type="defaultSemiBold">Number of Guests</ThemedText>
          <ThemedView
            style={ButtonAndInputStyles.pickerWrapper}
            accessible={true}
            accessibilityLabel={`Number of guests, currently ${numberOfGuests === 0 ? 'not selected' : numberOfGuests}`}
            accessibilityHint="Opens a list to choose the number of guests, from 1 to 10"
          >
            <Picker
              selectedValue={numberOfGuests}
              onValueChange={(value) => {
                console.log("Number of guests changed to:", value);
                setNumberOfGuests(value);
                if (dateOfBooking && value !== 0) {
                  console.log("Guest count changed with existing date — re-fetching slots");
                  fetchTimeSlots(dateOfBooking, value);
                }
              }}
              style={ButtonAndInputStyles.picker}
              accessibilityLabel="Number of guests"
            >
              <Picker.Item label="Select number of guests..." value={0} />
              {[...Array(10)].map((_, i) => (
                <Picker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
              ))}
            </Picker>
          </ThemedView>
          <ThemedText
            type="small"
            accessibilityRole="text"
          >
            Please count Children and Highchairs into your final number. For bookings of 11 Guests and above please phone the Restuarant directly on: 028 3883 2444
          </ThemedText>

          {/* Date Selection */}
          <ThemedText type="defaultSemiBold">Select a Date</ThemedText>
          <BookingCalendar onDateSelected={handleDateSelected} />
          <ThemedText
            type="small"
            accessibilityLabel="Red dot: Closed"
          >
            🔴 Closed
          </ThemedText>
          <ThemedText
            type="small"
            accessibilityLabel="Green dot: Online booking unavailable, please phone 028 3883 2444 to book a table"
          >
            🟢 Online booking unavailable, please phone 028 3883 2444 to book a table
          </ThemedText>

          {/* Time Slot */}
          <ThemedText type="defaultSemiBold">Select a Time</ThemedText>

          {/* Loading indicator while slots are being fetched */}
          {slotsLoading && (
            <ActivityIndicator
              size="small"
              color="#560324"
              style={{ marginVertical: 10 }}
              accessibilityLabel="Loading available time slots"
              accessibilityLiveRegion="polite"
            />
          )}

          {/* Failure message if slots could not be retrieved */}
          {!slotsLoading && slotsMessage !== '' && (
            <ThemedText
              type="defaultSemiBold"
              style={{ color: '#f84b4b', marginBottom: 6 }}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              {slotsMessage + " Please phone 028 3883 2444 directly to book a table."}
            </ThemedText>
          )}

          {/* Time picker — shown once slots have loaded */}
          {!slotsLoading && (
            <ThemedView
              style={ButtonAndInputStyles.pickerWrapper}
              accessible={true}
              accessibilityLabel={`Time, currently ${time || 'not selected'}`}
              accessibilityHint={
                timeSlots.length > 0
                  ? "Opens a list to choose your booking time"
                  : "No time slots available. Select a date and number of guests first"
              }
            >
              <Picker
                selectedValue={time}
                onValueChange={(value) => {
                  console.log("Time slot selected:", value);
                  setTime(value);
                }}
                style={ButtonAndInputStyles.picker}
                enabled={timeSlots.length > 0}
                accessibilityLabel="Time"
              >
                <Picker.Item
                  label={slotsMessage !== '' ? "No time slots available" : "Select a time..."}
                  value=""
                />
                {timeSlots.map((slot) => (
                  <Picker.Item key={slot} label={slot} value={slot} />
                ))}
              </Picker>
            </ThemedView>
          )}

          {/* Comments */}
          <ThemedText maxFontSizeMultiplier={2}>Comments</ThemedText>
            <TextInput
              style={[ButtonAndInputStyles.input,{minHeight: 100, textAlignVertical: 'top',},]}
              value={comment}
              onChangeText={(text) => setComment(text)}
              placeholder="Add any special requirements or comments"
              multiline={true}
              numberOfLines={4}
              maxLength={150}
              autoCorrect={false}
              spellCheck={false}
              scrollEnabled={false}
              accessibilityLabel="Comments"
              accessibilityHint="Add any special requirements or comments. This field is optional"
              maxFontSizeMultiplier={2}/>

          {/* Make Booking Button */}
          <TouchableOpacity
            style={ButtonAndInputStyles.button}
            onPress={handleMakeBooking}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Make Booking"
            accessibilityHint="Validates your details and asks you to confirm your booking"
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#ffffff' }}>
              Make Booking
            </ThemedText>
          </TouchableOpacity>

        </ThemedView>

        <Footer />
      </ParallaxScrollView>
    </SafeAreaView>
  );
}