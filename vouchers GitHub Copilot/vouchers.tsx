// app/(tabs)/menu/vouchers.tsx
import { useState, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Footer from '@/components/Footer';
import ContainerStyles from '@/components/ContainerStyles';
import ButtonAndInputStyles from '@/components/ButtonAndInputStyles';
import { isValidEmail, isValidPhoneNumber } from '@/libraries/validationServices';
import { purchaseVoucher } from '@/libraries/backendService';
import { giftVoucher } from '@/libraries/giftVoucher';
import { createVoucherDownload } from '@/libraries/createVoucherDownload';

const titleOptions = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Mx'];
const voucherValues = Array.from({ length: 15 }, (_, index) => (index + 1) * 10);

export default function VouchersScreen() {
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [voucherValue, setVoucherValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [purchasedVoucher, setPurchasedVoucher] = useState<giftVoucher | null>(null);
  const [screenStage, setScreenStage] = useState('form'); // 'form' | 'success'

  const qrCodeRef = useRef<any>(null);

  const validatePurchaseFields = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation error', 'Please select a title.');
      return false;
    }

    if (!firstName.trim()) {
      Alert.alert('Validation error', 'Please enter your first name.');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Validation error', 'Please enter your last name.');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Validation error', 'Please enter your email address.');
      return false;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Validation error', 'Please enter a valid email address.');
      return false;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Validation error', 'Please enter your phone number.');
      return false;
    }

    if (!isValidPhoneNumber(phoneNumber.trim())) {
      Alert.alert('Validation error', 'Please enter a valid UK phone number.');
      return false;
    }

    if (voucherValue <= 0) {
      Alert.alert('Validation error', 'Please select a voucher value.');
      return false;
    }

    return true;
  };

  const submitVoucher = async () => {
    setIsLoading(true);
    console.log('Submitting voucher purchase:', {
      title,
      firstName,
      lastName,
      email,
      phoneNumber,
      voucherValue,
    });

    try {
      const voucher = await purchaseVoucher(
        title.trim(),
        firstName.trim(),
        lastName.trim(),
        phoneNumber.trim(),
        email.trim(),
        voucherValue,
      );

      console.log('Voucher purchase successful, received:', {
        voucherNumber: voucher.voucherNumber,
        value: voucher.value,
        purchaseDate: voucher.date,
      });

      setPurchasedVoucher(voucher);
      setScreenStage('success');
    } catch (error: any) {
      console.error('Voucher purchase failed:', error);
      Alert.alert('Purchase failed', error?.message || 'Unable to submit voucher purchase.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    console.log('Resetting form to purchase another voucher');
    setScreenStage('form');
    setTitle('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setVoucherValue(0);
    setPurchasedVoucher(null);
  };

  const handleDownload = async () => {
    if (!purchasedVoucher) {
      Alert.alert('No voucher found', 'There is no voucher available to download.');
      return;
    }

    console.log('Preparing voucher download:', purchasedVoucher);

    try {
      qrCodeRef.current?.toDataURL(async (data: string) => {
        const qrCodeUrl = `data:image/png;base64,${data}`;

        console.log('QR code URL generated for download.');

        const html = createVoucherDownload(purchasedVoucher, qrCodeUrl);

        console.log('Voucher download HTML created.');

        const file = await Print.printToFileAsync({
          html,
          base64: false,
        });

        console.log('Voucher PDF generated:', file.uri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri);
          console.log('Voucher PDF shared/downloaded.');
        } else {
          Alert.alert(
            'Download created',
            `Voucher PDF has been created at: ${file.uri}`
          );
        }
      });
    } catch (error: any) {
      console.error('Voucher download failed:', error);
      Alert.alert(
        'Download failed',
        error.message || String(error) || 'The voucher PDF could not be created.'
      );
    }
  };

  const handlePurchase = () => {
    if (!validatePurchaseFields()) {
      return;
    }

    const message = `Please confirm the voucher details:\n\nTitle: ${title}\nFirst name: ${firstName}\nLast name: ${lastName}\nEmail: ${email}\nPhone: ${phoneNumber}\nValue: £${voucherValue}`;

    Alert.alert('Confirm voucher details', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: submitVoucher },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>
      <ParallaxScrollView>
        <Image
          source={require('@/assets/images/Vouchers.jpg')}
          style={ContainerStyles.titleImage}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="Voucher purchase hero image"
        />

        {screenStage === 'form' && (
          <ThemedView style={ContainerStyles.stepContainer}>
            <ThemedText type="title" accessibilityRole="header">
              Purchase a Voucher
            </ThemedText>

            <View accessible>
              <ThemedText>Title</ThemedText>
              <View style={ButtonAndInputStyles.pickerWrapper}>
                <Picker
                  selectedValue={title}
                  onValueChange={(value) => setTitle(value)}
                  style={ButtonAndInputStyles.picker}
                  accessibilityLabel="Voucher title"
                  accessibilityHint="Choose the recipient title for the voucher"
                >
                  {titleOptions.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <View accessible>
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
                accessibilityHint="Enter the recipient's first name"
              />
            </View>

            <View accessible>
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
                accessibilityHint="Enter the recipient's last name"
              />
            </View>

            <View accessible>
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
                accessibilityHint="Enter the email address to send the voucher to"
              />
            </View>

            <View accessible>
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
                accessibilityHint="Enter the recipient's UK phone number"
              />
            </View>

            <View accessible>
              <ThemedText>Voucher value</ThemedText>
              <View style={ButtonAndInputStyles.pickerWrapper}>
                <Picker
                  selectedValue={voucherValue}
                  onValueChange={(value) => setVoucherValue(value)}
                  style={ButtonAndInputStyles.picker}
                  accessibilityLabel="Voucher value"
                  accessibilityHint="Select the amount for the voucher"
                >
                  {voucherValues.map((value) => (
                    <Picker.Item key={value} label={`£${value}`} value={value} />
                  ))}
                </Picker>
              </View>
            </View>

            <Pressable
              style={ButtonAndInputStyles.button}
              onPress={handlePurchase}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Purchase voucher"
              accessibilityHint="Submit the voucher purchase form"
              accessibilityState={{ disabled: isLoading }}
            >
              <ThemedText type="defaultSemiBold">Purchase Voucher</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {screenStage === 'success' && purchasedVoucher && (
          <ThemedView style={ContainerStyles.stepContainer}>
            <ImageBackground
              source={require('@/assets/images/voucher_background.png')}
              style={ContainerStyles.voucherBackground}
              imageStyle={{ borderRadius: 10 }}
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel="Purchased voucher preview card"
            >
              <ThemedView style={{ marginBottom: 40, backgroundColor: 'transparent' }}>
                <ThemedText type="voucherTitle" accessibilityRole="header">
                  Voucher
                </ThemedText>

                <ThemedText type="voucherValue" accessibilityLabel={`Voucher value £${purchasedVoucher.value}`}>
                  £{purchasedVoucher.value}
                </ThemedText>

                <ThemedView
                  style={ContainerStyles.qrContainer}
                  accessible={true}
                  accessibilityLabel="Voucher QR code"
                  accessibilityHint="Contains the voucher number for scanning"
                >
                  <QRCode
                    value={purchasedVoucher.voucherNumber}
                    size={160}
                    getRef={(ref) => {
                      qrCodeRef.current = ref;
                    }}
                  />
                </ThemedView>

                <ThemedText type="voucher" accessibilityLabel={`Voucher number ${purchasedVoucher.voucherNumber}`}>
                  Voucher number:
                </ThemedText>
                <ThemedText type="voucher" selectable accessibilityLabel={`Voucher number ${purchasedVoucher.voucherNumber}`}>
                  {purchasedVoucher.voucherNumber}
                </ThemedText>

                <ThemedText type="voucher" accessibilityLabel={`Purchase date ${purchasedVoucher.date}`}>
                  Purchase date:
                </ThemedText>
                <ThemedText type="voucher" accessibilityLabel={`Purchase date ${purchasedVoucher.date}`}>
                  {purchasedVoucher.date}
                </ThemedText>

                <ThemedText type="voucherFineprint" accessibilityRole="text">
                  Vouchers are valid for 6 months from the date of issue. We accept no
                  responsibility for lost or misplaced vouchers. Under no circumstances
                  can these be replaced or redeemed.
                </ThemedText>
              </ThemedView>
            </ImageBackground>

            <Pressable
              style={ButtonAndInputStyles.button}
              onPress={handleDownload}
              accessibilityRole="button"
              accessibilityLabel="Download voucher"
              accessibilityHint="Generate a PDF of the purchased voucher"
            >
              <ThemedText type="defaultSemiBold">Download</ThemedText>
            </Pressable>

            <Pressable
              style={ButtonAndInputStyles.button}
              onPress={handleStartOver}
              accessibilityRole="button"
              accessibilityLabel="Back to voucher purchase"
              accessibilityHint="Return to the voucher purchase form"
            >
              <ThemedText type="defaultSemiBold">Back</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <Footer />
      </ParallaxScrollView>

      {isLoading && (
        <View
          style={[
            ContainerStyles.loadingOverlay,
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              zIndex: 10,
            },
          ]}
          accessible={true}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          accessibilityLabel="Submitting voucher"
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <ThemedText type="defaultSemiBold">Submitting voucher...</ThemedText>
        </View>
      )}
    </SafeAreaView>
  );
}