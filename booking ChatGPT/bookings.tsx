// app/(tabs)/menu/bookings.tsx
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
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
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [slotFeedback, setSlotFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<booking | null>(null);

  useEffect(() => {
    const retrieveAvailableSlots = async () => {
      if (dateOfBooking === '' || numberOfGuests === 0) {
        console.log('Booking slots not requested yet:', {
          dateOfBooking,
          numberOfGuests,
        });
        setAvailableTimeSlots([]);
        setTime('');
        return;
      }

      console.log('Retrieving booking slots for selected date and guest number:', {
        dateOfBooking,
        numberOfGuests,
      });

      setTime('');
      setAvailableTimeSlots([]);
      setSlotFeedback('');

      const result = await getBookingSlots(dateOfBooking, numberOfGuests);

      console.log('Booking slot response received in bookings page:', result);

      if (result.success) {
        console.log('Available booking slots ready to display:', result.slots);
        setAvailableTimeSlots(result.slots);
        setSlotFeedback('');
      } else {
        console.log('Booking slots could not be retrieved:', result.message);
        setAvailableTimeSlots([]);
        setSlotFeedback(result.message);
        Alert.alert('Booking slots unavailable', result.message);
      }
    };

    retrieveAvailableSlots();
  }, [dateOfBooking, numberOfGuests]);

  const handleDateSelected = (selectedDate: string) => {
    if (numberOfGuests === 0) {
      Alert.alert(
        'Number of guests required',
        'Please select the number of guests before choosing a date.'
      );
      setDateOfBooking(selectedDate);
      return;
    }

    setDateOfBooking(selectedDate);
  };

  const validateBookingInput = () => {
    if (title === '') {
      Alert.alert('Missing title', 'Please select a title.');
      return false;
    }

    if (firstName.trim() === '') {
      Alert.alert('Missing first name', 'Please enter your first name.');
      return false;
    }

    if (lastName.trim() === '') {
      Alert.alert('Missing last name', 'Please enter your last name.');
      return false;
    }

    if (email.trim() === '') {
      Alert.alert('Missing email address', 'Please enter your email address.');
      return false;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid email address', 'Please enter a valid email address.');
      return false;
    }

    if (phoneNumber.trim() === '') {
      Alert.alert('Missing phone number', 'Please enter your phone number.');
      return false;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      Alert.alert('Invalid phone number', 'Please enter a valid UK phone number.');
      return false;
    }

    if (numberOfGuests === 0) {
      Alert.alert('Missing number of guests', 'Please select the number of guests.');
      return false;
    }

    if (dateOfBooking === '') {
      Alert.alert('Missing booking date', 'Please select a booking date.');
      return false;
    }

    if (time === '') {
      Alert.alert('Missing booking time', 'Please select a booking time.');
      return false;
    }

    return true;
  };

  const submitBooking = async () => {
    console.log('User confirmed booking details. Submitting booking.');

    setIsLoading(true);

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

    setIsLoading(false);

    console.log('Booking submission result received in bookings page:', result);

    if (result.success && result.data) {
      console.log('Booking confirmed and ready to display to customer:', result.data);
      setConfirmedBooking(result.data);
    } else {
      console.log('Booking failed. Feedback shown to customer:', result.message);

      Alert.alert(
        'Booking unsuccessful',
        result.message || 'Your booking could not be completed.'
      );
    }
  };

  const handleMakeBooking = () => {
    if (!validateBookingInput()) {
      return;
    }

    console.log('Booking details passed validation:', {
      title,
      firstName,
      lastName,
      email,
      phoneNumber,
      numberOfGuests,
      dateOfBooking,
      time,
      comment,
    });

    Alert.alert(
      'Confirm booking details',
      `Please confirm the following booking details:

Name: ${title} ${firstName} ${lastName}
Email: ${email}
Phone: ${phoneNumber}
Guests: ${numberOfGuests}
Date: ${dateOfBooking}
Time: ${time}
Comments: ${comment.trim() === '' ? 'None' : comment}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('User cancelled booking confirmation.'),
        },
        {
          text: 'Confirm',
          onPress: submitBooking,
        },
      ]
    );
  };

  const handleBackToBookingInput = () => {
    console.log('Returning from booking confirmation view to booking input screen.');
    setConfirmedBooking(null);
    setTitle('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setNumberOfGuests(0);
    setDateOfBooking('');
    setTime('');
    setComment('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>
      <ParallaxScrollView>
        <Image
          source={require('@/assets/images/bookings.png')}
          style={ContainerStyles.titleImage}
          accessible={false}
        />

        {confirmedBooking ? (
          <ThemedView
            style={ContainerStyles.stepContainer}
            accessible={false}
          >
            <ImageBackground
              source={require('@/assets/images/booking_background.png')}
              resizeMode="cover"
              style={{
                padding: 20,
                borderRadius: 10,
                overflow: 'hidden',
              }}
              accessible={false}
            >
              <ThemedText
                type="voucherTitle"
                accessibilityRole="header"
                maxFontSizeMultiplier={2}
              >
                Booking
              </ThemedText>

              <ThemedText type="voucherValue" maxFontSizeMultiplier={2}>
                Booking number: {confirmedBooking.bookingNumber}
              </ThemedText>
              <ThemedText type="voucherValue" maxFontSizeMultiplier={2}>
                Date of booking: {confirmedBooking.dateOfBooking}
              </ThemedText>
              <ThemedText type="voucherValue" maxFontSizeMultiplier={2}>
                Time: {confirmedBooking.time}
              </ThemedText>
              <ThemedText type="voucherValue" maxFontSizeMultiplier={2}>
                Number of guests: {confirmedBooking.numberOfGuests}
              </ThemedText>

              <ThemedText type="voucher" maxFontSizeMultiplier={2}>
                A confirmation email has been sent. Please check your spam folder if you cannot see it in your inbox. We are looking forward to welcoming you to our award-winning restaurant.
              </ThemedText>

              <ThemedText type="voucher" maxFontSizeMultiplier={2}>
                You can amend this booking by going to the Login page in the app and using your booking number and email address to log in, or by phoning us directly on 028 3883 2444.
              </ThemedText>
            </ImageBackground>

            <Pressable
              style={ButtonAndInputStyles.button}
              onPress={handleBackToBookingInput}
              accessibilityRole="button"
              accessibilityLabel="Back to booking form"
              accessibilityHint="Returns to the booking input screen"
            >
              <ThemedText lightColor="#ffffff" darkColor="#ffffff" maxFontSizeMultiplier={2}>
                Back
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <ThemedView
            style={ContainerStyles.stepContainer}
            accessible={false}
          >
            <ThemedText
              type="subtitle"
              accessibilityRole="header"
              maxFontSizeMultiplier={2}
            >
              Make a Booking
            </ThemedText>

            <ThemedText maxFontSizeMultiplier={2}>Title</ThemedText>
            <ThemedView style={ButtonAndInputStyles.pickerWrapper}>
              <Picker
                selectedValue={title}
                onValueChange={setTitle}
                style={ButtonAndInputStyles.picker}
                accessibilityLabel="Title"
                accessibilityHint="Select your title"
              >
                <Picker.Item label="Select title" value="" />
                <Picker.Item label="Mr" value="Mr" />
                <Picker.Item label="Mrs" value="Mrs" />
                <Picker.Item label="Miss" value="Miss" />
                <Picker.Item label="Ms" value="Ms" />
                <Picker.Item label="Mx" value="Mx" />
              </Picker>
            </ThemedView>

            <ThemedText maxFontSizeMultiplier={2}>First name</ThemedText>
            <TextInput
              style={ButtonAndInputStyles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              accessibilityLabel="First name"
              accessibilityHint="Enter your first name"
              textContentType="givenName"
              autoComplete="given-name"
              returnKeyType="next"
              maxFontSizeMultiplier={2}
            />

            <ThemedText maxFontSizeMultiplier={2}>Last name</ThemedText>
            <TextInput
              style={ButtonAndInputStyles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              accessibilityLabel="Last name"
              accessibilityHint="Enter your last name"
              textContentType="familyName"
              autoComplete="family-name"
              returnKeyType="next"
              maxFontSizeMultiplier={2}
            />

            <ThemedText maxFontSizeMultiplier={2}>Email address</ThemedText>
            <TextInput
              style={ButtonAndInputStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address for the booking confirmation"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              maxFontSizeMultiplier={2}
            />

            <ThemedText maxFontSizeMultiplier={2}>Phone number</ThemedText>
            <TextInput
              style={ButtonAndInputStyles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone number"
              keyboardType="phone-pad"
              accessibilityLabel="Phone number"
              accessibilityHint="Enter your UK phone number"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="next"
              maxFontSizeMultiplier={2}
            />

            <ThemedText maxFontSizeMultiplier={2}>Number of guests</ThemedText>
            <ThemedText type="small" maxFontSizeMultiplier={2}>
              Please count Children and Highchairs into your final number.
            </ThemedText>
            <ThemedText type="small" maxFontSizeMultiplier={2}>
              For bookings of 11 Guests and above please phone the Restuarant directly on: 028 3883 2444
            </ThemedText>

            <ThemedView style={ButtonAndInputStyles.pickerWrapper}>
              <Picker
                selectedValue={numberOfGuests}
                onValueChange={setNumberOfGuests}
                style={ButtonAndInputStyles.picker}
                accessibilityLabel="Number of guests"
                accessibilityHint="Select the total number of guests, including children and highchairs"
              >
                <Picker.Item label="Select number of guests" value={0} />
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((guestNumber) => (
                  <Picker.Item key={guestNumber} label={guestNumber.toString()} value={guestNumber} />
                ))}
              </Picker>
            </ThemedView>

            <ThemedText maxFontSizeMultiplier={2}>Date</ThemedText>
            <ThemedText type="small" maxFontSizeMultiplier={2}>
              🔴 Closed
            </ThemedText>
            <ThemedText type="small" maxFontSizeMultiplier={2}>
              🟢 Online booking unavailable, please phone 028 3883 2444 to book a table
            </ThemedText>

            <View
              accessible={false}
              accessibilityLabel="Booking date calendar"
            >
              <BookingCalendar onDateSelected={handleDateSelected} />
            </View>

            <ThemedText maxFontSizeMultiplier={2}>Time</ThemedText>
            {slotFeedback !== '' && (
              <ThemedText
                type="small"
                accessibilityLiveRegion="polite"
                maxFontSizeMultiplier={2}
              >
                {slotFeedback}
              </ThemedText>
            )}

            <ThemedView style={ButtonAndInputStyles.pickerWrapper}>
              <Picker
                selectedValue={time}
                onValueChange={setTime}
                style={ButtonAndInputStyles.picker}
                accessibilityLabel="Time"
                accessibilityHint="Select an available booking time"
                enabled={availableTimeSlots.length > 0}
              >
                <Picker.Item label="Select time" value="" />
                {availableTimeSlots.map((slot) => (
                  <Picker.Item key={slot} label={slot} value={slot} />
                ))}
              </Picker>
            </ThemedView>

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

            <Pressable
              style={ButtonAndInputStyles.button}
              onPress={handleMakeBooking}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Make booking"
              accessibilityHint="Validates your booking details and asks you to confirm before submitting"
              accessibilityState={{ disabled: isLoading }}
            >
              <ThemedText lightColor="#ffffff" darkColor="#ffffff" maxFontSizeMultiplier={2}>
                Make Booking
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <Footer />
      </ParallaxScrollView>

      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          accessible
          accessibilityRole="alert"
          accessibilityLabel="Making booking. Please wait."
        >
          <ActivityIndicator
            size="large"
            accessibilityLabel="Loading"
          />
          <ThemedText lightColor="#ffffff" darkColor="#ffffff" maxFontSizeMultiplier={2}>
            Making booking...
          </ThemedText>
        </View>
      )}
    </SafeAreaView>
  );
}