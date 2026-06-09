// app/(tabs)/menu/vouchers.tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator,
         ImageBackground, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';

import Footer from '@/components/Footer';
import ContainerStyles from '@/components/ContainerStyles';
import ButtonAndInputStyles from '@/components/ButtonAndInputStyles';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { isValidEmail, isValidPhoneNumber } from '@/libraries/validationServices';
import { orderVoucher } from '@/libraries/backendService';
import { giftVoucher } from '@/libraries/giftVoucher';
import { createVoucherDownload } from '@/libraries/createVoucherDownload';

// Title options for the dropdown
const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev'];

// Voucher value options: £10 to £150 in £10 increments
const VOUCHER_VALUES = Array.from({ length: 15 }, (_, i) => (i + 1) * 10);

export default function VouchersScreen() {

  const [title, setTitle]                       = useState<string>(TITLE_OPTIONS[0]);
  const [firstName, setFirstName]               = useState<string>('');
  const [lastName, setLastName]                 = useState<string>('');
  const [email, setEmail]                       = useState<string>('');
  const [phoneNumber, setPhoneNumber]           = useState<string>('');
  const [value, setValue]                       = useState<number>(VOUCHER_VALUES[0]);
  const [isLoading, setIsLoading]               = useState<boolean>(false);
  const [purchasedVoucher, setPurchasedVoucher] = useState<giftVoucher | null>(null);

  /**
   * Validates all user input fields before proceeding with the purchase workflow.
   * Checks for empty fields, valid email format, and valid UK phone number format.
   * Displays an Alert describing the first issue found if validation fails.
   *
   * @returns true if all validation passes, false otherwise
   */
  const validateInputs = (): boolean => {

    if (!firstName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first name.');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter your last name.');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return false;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g. name@example.com).');
      return false;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number.');
      return false;
    }

    if (!isValidPhoneNumber(phoneNumber.trim())) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid UK phone number (e.g. 07700 900000).');
      return false;
    }

    return true;
  };

  /**
   * Submits the voucher purchase request to the backend service.
   * Shows a loading overlay while awaiting the response.
   * On success, stores the returned voucher to trigger the result view.
   * On failure, displays the specific error message received from the server.
   */
  const submitPurchase = async () => {
    console.log("Submitting voucher purchase:", { title, firstName, lastName, email, phoneNumber, value });

    setIsLoading(true);

    try {
      const result = await orderVoucher(
        title,
        firstName,
        lastName,
        phoneNumber,
        email,
        value
      );

      console.log("Voucher purchase successful:", JSON.stringify(result, null, 2));

      // Store the returned voucher — triggers the result view
      setPurchasedVoucher(result[0]);

    } catch (error: any) {
      const errorMessage = typeof error === 'string'
        ? error
        : (error?.message ?? 'An unexpected error occurred. Please try again.');

      console.error("Voucher purchase failed:", errorMessage);
      Alert.alert('Purchase Failed', errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Called when the Purchase Voucher button is pressed.
   * Runs validation first, then prompts the user to confirm their details
   * before submitting to the backend.
   */
  const handlePurchase = () => {
    if (!validateInputs()) return;

    console.log("Validation passed. Showing confirmation to user.");

    Alert.alert(
      'Confirm Your Details',
      `Please check your details before purchasing:\n\n` +
      `Name:   ${title} ${firstName} ${lastName}\n` +
      `Email:  ${email}\n` +
      `Phone:  ${phoneNumber}\n` +
      `Value:  £${value}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log("User cancelled purchase at confirmation step."),
        },
        {
          text: 'Confirm',
          onPress: () => submitPurchase(),
        },
      ]
    );
  };

  /**
   * Generates a PDF from the purchased voucher using the createVoucherDownload
   * service and opens the system share sheet so the user can save or send it.
   *
   * @param voucher     the purchased giftVoucher to include in the PDF
   * @param qrCodeUrl   the QR code image URL to embed in the PDF
   */
  const handleDownload = async (voucher: giftVoucher, qrCodeUrl: string) => {
    console.log("Generating voucher PDF for:", voucher.voucherNumber);

    try {
      const html = createVoucherDownload(voucher, qrCodeUrl);
      const { uri } = await Print.printToFileAsync({ html });

      console.log("Voucher PDF generated at:", uri);

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Voucher',
        UTI: 'com.adobe.pdf',
      });

    } catch (error: any) {
      console.error("Voucher PDF generation failed:", error);
      Alert.alert('Download Failed', 'Could not generate the voucher PDF. Please try again.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Result view — rendered after a successful purchase response is received
  // ─────────────────────────────────────────────────────────────────────────
  if (purchasedVoucher) {

    // QR code image URL used by both the in-app display and the download service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(purchasedVoucher.voucherNumber)}`;

    console.log("Rendering result view for voucher:", purchasedVoucher.voucherNumber);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>
        <ParallaxScrollView>

          {/* Decorative header image — hidden from screen readers */}
          <Image
            source={require('@/assets/images/Vouchers.jpg')}
            style={ContainerStyles.titleImage}
            accessible={false}
          />

          <ThemedView style={ContainerStyles.stepContainer}>

            {/* ── Voucher card with background image ── */}
            {/* Background is decorative; accessible content is in child elements */}
            <ImageBackground
              source={require('@/assets/images/voucher_background.png')}
              style={ContainerStyles.voucherBackground}
              resizeMode="cover"
              accessible={false}
            >
              <ThemedText
                type="voucherTitle"
                accessibilityRole="header"
              >
                Voucher
              </ThemedText>

              <ThemedText
                type="voucherValue"
                accessibilityLabel={`Voucher value: £${purchasedVoucher.value}`}
              >
                £{purchasedVoucher.value}
              </ThemedText>

              {/* QR code — described for screen readers; sighted users scan it */}
              <View
                style={ContainerStyles.qrContainer}
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel={`QR code for voucher number ${purchasedVoucher.voucherNumber}`}
              >
                <QRCode
                  value={purchasedVoucher.voucherNumber}
                  size={192}
                />
              </View>

              <ThemedText
                type="voucher"
                accessibilityLabel={`Voucher number: ${purchasedVoucher.voucherNumber}`}
              >
                {purchasedVoucher.voucherNumber}
              </ThemedText>

              <ThemedText
                type="voucher"
                accessibilityLabel={`Date of issue: ${purchasedVoucher.date}`}
              >
                Date of Issue: {purchasedVoucher.date}
              </ThemedText>

              <ThemedText
                type="voucherFineprint"
                accessibilityRole="text"
              >
                Vouchers are valid for 6 months from the date of issue.{' '}
                We accept no responsibility for lost or misplaced vouchers.{' '}
                Under no circumstances can these be replaced or redeemed.
              </ThemedText>

            </ImageBackground>

            {/* ── Download button ── */}
            <TouchableOpacity
              style={ButtonAndInputStyles.button}
              onPress={() => handleDownload(purchasedVoucher, qrCodeUrl)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Download voucher"
              accessibilityHint="Generates and downloads a PDF copy of your voucher"
            >
              <ThemedText type="defaultSemiBold" style={{ color: '#ffffff' }}>
                Download
              </ThemedText>
            </TouchableOpacity>

            {/* ── Back button – returns to the purchase form ── */}
            <TouchableOpacity
              style={ButtonAndInputStyles.button}
              onPress={() => {
                console.log("User navigating back to purchase form.");
                setPurchasedVoucher(null);
              }}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Back"
              accessibilityHint="Returns to the voucher purchase form"
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

  // ─────────────────────────────────────────────────────────────────────────
  // Purchase form — rendered until a voucher is successfully returned
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>

      {/* ── Loading overlay ── */}
      <Modal
        transparent
        animationType="fade"
        visible={isLoading}
        accessibilityViewIsModal={true}
      >
        <View
          style={ContainerStyles.loadingOverlay}
          accessible={true}
          accessibilityLiveRegion="assertive"
          accessibilityLabel="Purchasing voucher, please wait"
        >
          <ActivityIndicator
            size="large"
            color="#ffffff"
            accessibilityElementsHidden={true}
          />
          <ThemedText
            type="defaultSemiBold"
            style={{ color: '#ffffff', marginTop: 16 }}
            accessibilityElementsHidden={true}
          >
            Purchasing Voucher...
          </ThemedText>
        </View>
      </Modal>

      <ParallaxScrollView>

        {/* Decorative header image — hidden from screen readers */}
        <Image
          source={require('@/assets/images/Vouchers.jpg')}
          style={ContainerStyles.titleImage}
          accessible={false}
        />

        {/* ── Purchase form ── */}
        <ThemedView style={ContainerStyles.stepContainer}>

          <ThemedText
            type="title"
            accessibilityRole="header"
          >
            Purchase a Gift Voucher
          </ThemedText>

          {/* Title */}
          <ThemedText
            type="defaultSemiBold"
            accessibilityElementsHidden={true}
          >
            Title
          </ThemedText>
          <View
            style={ButtonAndInputStyles.pickerWrapper}
            accessible={true}
            accessibilityLabel="Title"
            accessibilityHint="Select your title from the dropdown"
          >
            <Picker
              selectedValue={title}
              onValueChange={(itemValue) => setTitle(itemValue)}
              style={ButtonAndInputStyles.picker}
            >
              {TITLE_OPTIONS.map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>

          {/* First Name */}
          <ThemedText
            type="defaultSemiBold"
            accessibilityElementsHidden={true}
          >
            First Name
          </ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            autoCapitalize="words"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="First name"
            accessibilityHint="Enter your first name"
          />

          {/* Last Name */}
          <ThemedText
            type="defaultSemiBold"
            accessibilityElementsHidden={true}
          >
            Last Name
          </ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            autoCapitalize="words"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Last name"
            accessibilityHint="Enter your last name"
          />

          {/* Email */}
          <ThemedText
            type="defaultSemiBold"
            accessibilityElementsHidden={true}
          >
            Email Address
          </ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address"
          />

          {/* Phone Number */}
          <ThemedText
            type="defaultSemiBold"
            accessibilityElementsHidden={true}
          >
            Phone Number
          </ThemedText>
          <TextInput
            style={ButtonAndInputStyles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="07700 900000"
            keyboardType="phone-pad"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Phone number"
            accessibilityHint="Enter your UK phone number"
          />

          {/* Voucher Value */}
          <ThemedText
            type="defaultSemiBold"
            accessibilityElementsHidden={true}
          >
            Voucher Value
          </ThemedText>
          <View
            style={ButtonAndInputStyles.pickerWrapper}
            accessible={true}
            accessibilityLabel={`Voucher value, currently £${value}`}
            accessibilityHint="Select the value of your voucher from the dropdown"
          >
            <Picker
              selectedValue={value}
              onValueChange={(itemValue) => setValue(itemValue)}
              style={ButtonAndInputStyles.picker}
            >
              {VOUCHER_VALUES.map((v) => (
                <Picker.Item key={v} label={`£${v}`} value={v} />
              ))}
            </Picker>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={isLoading ? ButtonAndInputStyles.buttonInUse : ButtonAndInputStyles.button}
            onPress={handlePurchase}
            activeOpacity={0.8}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Purchase Voucher"
            accessibilityHint="Validates your details and proceeds to purchase the voucher"
            accessibilityState={{ disabled: isLoading }}
          >
            <ThemedText type="defaultSemiBold" style={{ color: '#ffffff' }}>
              Purchase Voucher
            </ThemedText>
          </TouchableOpacity>

        </ThemedView>

        {/* ── Footer – preserved from original ── */}
        <Footer />

      </ParallaxScrollView>
    </SafeAreaView>
  );
}