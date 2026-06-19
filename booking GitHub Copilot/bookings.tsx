// app/(tabs)/menu/bookings.tsx
import { Image, TouchableOpacity, ImageBackground, Pressable, TextInput, View, Alert, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import Footer from '@/components/Footer';
import ContainerStyles from '@/components/ContainerStyles';
import ButtonAndInputStyles from '@/components/ButtonAndInputStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import BookingCalendar from '@/libraries/bookingCalender';
import { getBookingSlots, makeBooking } from '@/libraries/backendService';
import { booking as Booking } from '@/libraries/booking';
import { isValidEmail, isValidPhoneNumber } from '@/libraries/validationServices';

const titleOptions = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Other'];
const guestOptions = Array.from({ length: 10 }, (_, index) => index + 1);

export default function BookingsScreen() {
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guests, setGuests] = useState(0);
  const [bookingDate, setBookingDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [comments, setComments] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const resetForm = () => {
  setTitle('');
  setFirstName('');
  setLastName('');
  setEmail('');
  setPhoneNumber('');
  setGuests(0);
  setBookingDate('');
  setTimeSlot('');
  setComments('');
  setAvailableSlots([]);
  setSlotsMessage('');
  setErrorMessage('');
  setShowResult(false);
  setConfirmedBooking(null);
};
  const fetchAvailableBookingSlots = async (date: string, numberOfGuests: number) => {
    setErrorMessage('');
    setSlotsMessage('');
    setLoadingSlots(true);
    console.log('Fetching booking slots for date and guests:', { date, numberOfGuests });

    const result = await getBookingSlots(date, numberOfGuests);
    console.log('Available booking slots raw result:', result);

    if (!result.success) {
      setAvailableSlots([]);
      setTimeSlot('');
      setSlotsMessage(result.message || 'Unable to retrieve booking slots. Please try again later.');
      setLoadingSlots(false);
      return;
    }

    if (!result.slots || result.slots.length === 0) {
      setAvailableSlots([]);
      setTimeSlot('');
      setSlotsMessage(result.message || 'No booking slots available for this date and guest count.');
      setLoadingSlots(false);
      return;
    }

    setAvailableSlots(result.slots);
    setSlotsMessage(`${result.slots.length} available time slot(s) found.`);
    if (timeSlot && !result.slots.includes(timeSlot)) {
      setTimeSlot('');
    }
    setLoadingSlots(false);
  };

  const handleDateSelection = (date: string) => {
    if (guests === 0) {
      setErrorMessage('Please select the number of guests before choosing a date.');
      return;
    }

    setErrorMessage('');
    setBookingDate(date);
    fetchAvailableBookingSlots(date, guests);
  };

  const handleGuestSelection = (value: number) => {
    setGuests(value);

    if (bookingDate) {
      fetchAvailableBookingSlots(bookingDate, value);
    }
  };

  const submitBooking = async () => {
    setIsSubmittingBooking(true);
    console.log('Submitting booking after confirmation');

    const result = await makeBooking(
      title,
      firstName,
      lastName,
      phoneNumber,
      email,
      guests,
      bookingDate,
      timeSlot,
      comments
    );

    setIsSubmittingBooking(false);
    console.log('Booking submission result:', result);

    if (result.success && result.booking) {
      const b = result.booking;
      console.log('Booking created on backend:', b);
      // Show confirmation/result view using returned booking
      setConfirmedBooking(b);
      setShowResult(true);
    } else {
      console.warn('Booking failed:', result.message);
      Alert.alert('Booking Failed', result.message || 'Failed to create booking. Please try again.');
    }
  };

  const handleValidateBooking = () => {
    setErrorMessage('');

    if (!title) {
      Alert.alert('Validation Error', 'Title is required.');
      return;
    }

    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required.');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email address is required.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Phone number is required.');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid UK phone number.');
      return;
    }

    if (guests === 0) {
      Alert.alert('Validation Error', 'Please select the number of guests.');
      return;
    }

    if (!bookingDate) {
      Alert.alert('Validation Error', 'Please select a booking date.');
      return;
    }

    if (!timeSlot) {
      Alert.alert('Validation Error', 'Please select a time slot.');
      return;
    }

    console.log('Validation passed, showing confirmation alert with details:', {
      title,
      firstName,
      lastName,
      email,
      phoneNumber,
      guests,
      bookingDate,
      timeSlot,
      comments,
    });

    const confirmationLines = [
      'Please confirm your booking details:\n',
      'Name: ' + title + ' ' + firstName + ' ' + lastName,
      'Email: ' + email,
      'Phone: ' + phoneNumber,
      'Guests: ' + guests,
      'Date: ' + bookingDate,
      'Time: ' + timeSlot,
    ];

    if (comments && comments.trim().length > 0) {
      confirmationLines.push('Comments: ' + comments.trim());
    }

    Alert.alert(
      'Confirm Booking',
      confirmationLines.join('\n'),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: submitBooking,
        },
      ]
    );
  };

  if (showResult && confirmedBooking) {
    const b = confirmedBooking as Booking;
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
              accessibilityLabel={`Booking number ${b.bookingNumber}`}
            >
              Booking Number: {b.bookingNumber}
            </ThemedText>

            <ThemedText
              type="voucher"
              accessible={true}
              accessibilityLabel={`Date of booking: ${b.dateOfBooking}`}
            >
              Date: {b.dateOfBooking}
            </ThemedText>
            <ThemedText
              type="voucher"
              accessible={true}
              accessibilityLabel={`Time of booking: ${b.time}`}
            >
              Time: {b.time}
            </ThemedText>
            <ThemedText
              type="voucher"
              accessible={true}
              accessibilityLabel={`Number of guests: ${b.numberOfGuests}`}
            >
              Number of Guests: {b.numberOfGuests}
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
              accessibilityLabel="Back to booking form"
              accessibilityHint="Returns to the booking form to make another booking"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>
      <ParallaxScrollView>
        <Image
          source={require('@/assets/images/bookings.png')}
          style={ContainerStyles.titleImage}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="Bookings hero image"
        />

        <ThemedView accessible>
          <ThemedText type="title" accessibilityRole="header">
            Book a Table
          </ThemedText>

          <ThemedText>Title</ThemedText>
          <View style={ButtonAndInputStyles.pickerWrapper}>
            <Picker
              selectedValue={title}
              onValueChange={(value) => setTitle(value)}
              style={ButtonAndInputStyles.picker}
              accessibilityLabel="Title"
              accessibilityHint="Choose your booking title"
            >
              {titleOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>

          <ThemedText>First name</ThemedText>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={ButtonAndInputStyles.input}
            placeholder="First name"
            placeholderTextColor="#777"
            autoCapitalize="words"
            textContentType="givenName"
            autoComplete="given-name"
            returnKeyType="next"
            accessibilityLabel="First name"
            accessibilityHint="Enter your first name"
          />

          <ThemedText>Last name</ThemedText>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            style={ButtonAndInputStyles.input}
            placeholder="Last name"
            placeholderTextColor="#777"
            autoCapitalize="words"
            textContentType="familyName"
            autoComplete="family-name"
            returnKeyType="next"
            accessibilityLabel="Last name"
            accessibilityHint="Enter your last name"
          />

          <ThemedText>Email address</ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={ButtonAndInputStyles.input}
            placeholder="Email address"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address"
          />

          <ThemedText>Phone number</ThemedText>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={ButtonAndInputStyles.input}
            placeholder="Phone number"
            placeholderTextColor="#777"
            keyboardType="phone-pad"
            autoCapitalize="none"
            textContentType="telephoneNumber"
            autoComplete="tel"
            returnKeyType="next"
            accessibilityLabel="Phone number"
            accessibilityHint="Enter your phone number"
          />

          <ThemedText>Number of guests</ThemedText>
          <View style={ButtonAndInputStyles.pickerWrapper}>
            <Picker
              selectedValue={guests}
              onValueChange={(value) => handleGuestSelection(value)}
              style={ButtonAndInputStyles.picker}
              accessibilityLabel="Number of guests"
              accessibilityHint="Select number of guests for the booking"
              accessibilityRole="adjustable"
            >
              {guestOptions.map((value) => (
                <Picker.Item key={value} label={`${value}`} value={value} />
              ))}
            </Picker>
          </View>
          <ThemedText type="small">
            Please count Children and Highchairs into your final number.
          </ThemedText>
          <ThemedText type="small">
            For bookings of 11 Guests and above please phone the Restaurant directly on: 028 3883 2444
          </ThemedText>

          <ThemedText accessibilityRole="header">Date selection</ThemedText>
          <View
            accessible
            accessibilityLabel="Date selection calendar"
            accessibilityHint="Choose the date for your booking"
          >
            <BookingCalendar onDateSelected={handleDateSelection} />
          </View>
          {errorMessage ? (
            <ThemedText
              type="small"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {errorMessage}
            </ThemedText>
          ) : null}
          <ThemedText type="small" accessibilityLiveRegion="polite">
            🔴 Closed
          </ThemedText>
          <ThemedText type="small" accessibilityLiveRegion="polite">
            🟢 Online booking unavailable, please phone 028 3883 2444 to book a table
          </ThemedText>

          <ThemedText accessibilityRole="header">Time slot</ThemedText>
          <View style={ButtonAndInputStyles.pickerWrapper}>
            <Picker
              selectedValue={timeSlot}
              onValueChange={(value) => setTimeSlot(value)}
              style={ButtonAndInputStyles.picker}
              accessibilityLabel="Time slot"
              accessibilityHint="Select a preferred time slot"
              accessibilityRole="adjustable"
              accessibilityState={{ busy: loadingSlots }}
            >
              <Picker.Item label={loadingSlots ? 'Loading time slots...' : 'Select a time slot'} value="" />
              {availableSlots.map((slot) => (
                <Picker.Item key={slot} label={slot} value={slot} />
              ))}
            </Picker>
          </View>
          {slotsMessage ? (
            <ThemedText
              type="small"
              accessibilityLiveRegion="polite"
              accessible
            >
              {slotsMessage}
            </ThemedText>
          ) : null}

          <ThemedText maxFontSizeMultiplier={2}>Comments</ThemedText>
          <TextInput
            style={[ButtonAndInputStyles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={comments}
            onChangeText={(text) => setComments(text)}
            placeholder="Add any special requirements or comments"
            multiline={true}
            numberOfLines={4}
            maxLength={150}
            autoCorrect={false}
            spellCheck={false}
            scrollEnabled={false}
            accessibilityLabel="Comments"
            accessibilityHint="Add any special requirements or comments. This field is optional"
            maxFontSizeMultiplier={2}
          />

          <Pressable
            style={ButtonAndInputStyles.button}
            onPress={handleValidateBooking}
            accessibilityRole="button"
            accessibilityLabel="Make booking"
            accessibilityHint="Submit booking details to proceed"
            accessibilityState={{ busy: isSubmittingBooking }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ThemedText type="defaultSemiBold">Make Booking</ThemedText>
          </Pressable>
        </ThemedView>

        <Footer />
      </ParallaxScrollView>

      {/* Loading overlay */}
      {isSubmittingBooking && (
        <Modal transparent animationType="fade" visible={isSubmittingBooking}>
          <View style={[ContainerStyles.loadingOverlay]}>
            <ActivityIndicator size="large" color="#ffffff" />
            <ThemedText type="defaultSemiBold">
              Submitting your booking...
            </ThemedText>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

