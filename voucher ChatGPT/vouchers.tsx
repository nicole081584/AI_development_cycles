// app/(tabs)/menu/vouchers.tsx
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import Footer from '@/components/Footer';
import ContainerStyles from '@/components/ContainerStyles';
import ButtonAndInputStyles from '@/components/ButtonAndInputStyles';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { isValidEmail, isValidPhoneNumber } from '@/libraries/validationServices';
import { purchaseVoucher } from '@/libraries/backendService';
import { giftVoucher } from '@/libraries/giftVoucher';
import { createVoucherDownload } from '@/libraries/createVoucherDownload';

export default function VouchersScreen() {
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [voucherValue, setVoucherValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [purchasedVoucher, setPurchasedVoucher] = useState<giftVoucher | null>(null);
  const qrCodeRef = useRef<any>(null);

  const voucherValues = Array.from({ length: 15 }, (_, index) =>
    String((index + 1) * 10)
  );

  const submitVoucherPurchase = async () => {
    const voucherPurchaseDetails = {
      title,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      value: voucherValue,
    };

    console.log('Submitting voucher purchase:', voucherPurchaseDetails);

    try {
      setIsLoading(true);

      const purchasedVoucherResult = await purchaseVoucher(voucherPurchaseDetails);

      console.log('Voucher purchase returned to page:', purchasedVoucherResult);

      if (purchasedVoucherResult) {
        setPurchasedVoucher(purchasedVoucherResult);

        Alert.alert(
          'Voucher purchased',
          'Your voucher has been purchased successfully.'
        );

        setTitle('');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhoneNumber('');
        setVoucherValue('');
      } else {
        Alert.alert(
          'Purchase failed',
          'The voucher could not be purchased. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Voucher purchase failed on page:', error);
      Alert.alert(
        'Purchase failed',
        error.message || String(error) || 'An error occurred while purchasing the voucher.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseVoucher = () => {
    if (!title) {
      Alert.alert('Missing title', 'Please select a title.');
      return;
    }

    if (!firstName.trim()) {
      Alert.alert('Missing first name', 'Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Missing last name', 'Please enter your last name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Missing email address', 'Please enter your email address.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('Invalid email address', 'Please enter a valid email address.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Missing phone number', 'Please enter your phone number.');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber.trim())) {
      Alert.alert('Invalid phone number', 'Please enter a valid UK phone number.');
      return;
    }

    if (!voucherValue) {
      Alert.alert('Missing voucher value', 'Please select a voucher value.');
      return;
    }

    console.log('Voucher details validated successfully.');

    Alert.alert(
      'Confirm voucher details',
      `Please confirm the voucher details:\n\nTitle: ${title}\nFirst name: ${firstName.trim()}\nLast name: ${lastName.trim()}\nEmail: ${email.trim()}\nPhone: ${phoneNumber.trim()}\nVoucher value: £${voucherValue}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Voucher purchase cancelled by user.'),
        },
        {
          text: 'Confirm',
          onPress: submitVoucherPurchase,
        },
      ]
    );
  };

  const handleDownloadVoucher = async () => {
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

  const handleBackToPurchase = () => {
    console.log('Returning to voucher purchase input screen.');
    setPurchasedVoucher(null);
  };

  const renderPurchaseForm = () => (
    <ThemedView
      accessible={false}
      accessibilityLabel="Voucher purchase form"
    >
      <ThemedView
        style={ContainerStyles.titleContainer}
        accessible
        accessibilityRole="header"
      >
        <ThemedText type="title">
          Purchase a Gift Voucher
        </ThemedText>
      </ThemedView>

      <ThemedText type="defaultSemiBold">Title</ThemedText>
      <ThemedView style={ButtonAndInputStyles.pickerWrapper}>
        <Picker
          selectedValue={title}
          onValueChange={(selectedTitle) => setTitle(selectedTitle)}
          style={ButtonAndInputStyles.picker}
          accessibilityLabel="Title"
          accessibilityHint="Select your title from the list"
        >
          <Picker.Item label="Please select" value="" />
          <Picker.Item label="Mr" value="Mr" />
          <Picker.Item label="Mrs" value="Mrs" />
          <Picker.Item label="Miss" value="Miss" />
          <Picker.Item label="Ms" value="Ms" />
          <Picker.Item label="Dr" value="Dr" />
        </Picker>
      </ThemedView>

      <ThemedText type="defaultSemiBold">First name</ThemedText>
      <TextInput
        style={ButtonAndInputStyles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Enter first name"
        accessibilityLabel="First name"
        accessibilityHint="Enter the first name for the voucher purchase"
        textContentType="givenName"
        autoComplete="given-name"
        returnKeyType="next"
      />

      <ThemedText type="defaultSemiBold">Last name</ThemedText>
      <TextInput
        style={ButtonAndInputStyles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Enter last name"
        accessibilityLabel="Last name"
        accessibilityHint="Enter the last name for the voucher purchase"
        textContentType="familyName"
        autoComplete="family-name"
        returnKeyType="next"
      />

      <ThemedText type="defaultSemiBold">Email address</ThemedText>
      <TextInput
        style={ButtonAndInputStyles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email address"
        accessibilityHint="Enter the email address where the voucher will be sent"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
      />

      <ThemedText type="defaultSemiBold">Phone number</ThemedText>
      <TextInput
        style={ButtonAndInputStyles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        accessibilityLabel="Phone number"
        accessibilityHint="Enter a valid UK phone number"
        textContentType="telephoneNumber"
        autoComplete="tel"
        returnKeyType="next"
      />

      <ThemedText type="defaultSemiBold">Voucher value</ThemedText>
      <ThemedView style={ButtonAndInputStyles.pickerWrapper}>
        <Picker
          selectedValue={voucherValue}
          onValueChange={(selectedValue) => setVoucherValue(selectedValue)}
          style={ButtonAndInputStyles.picker}
          accessibilityLabel="Voucher value"
          accessibilityHint="Select a voucher value between 10 and 150 pounds"
        >
          <Picker.Item label="Please select a voucher value" value="" />

          {voucherValues.map((value) => (
            <Picker.Item
              key={value}
              label={`£${value}`}
              value={value}
            />
          ))}
        </Picker>
      </ThemedView>

      <Pressable
        style={ButtonAndInputStyles.button}
        onPress={handlePurchaseVoucher}
        accessibilityRole="button"
        accessibilityLabel="Purchase voucher"
        accessibilityHint="Checks the voucher details and asks you to confirm before purchase"
        disabled={isLoading}
      >
        <ThemedText type="defaultSemiBold">
          Purchase Voucher
        </ThemedText>
      </Pressable>
    </ThemedView>
  );

  const renderVoucherResult = () => {
    if (!purchasedVoucher) {
      return null;
    }

    return (
      <ThemedView
        accessible={false}
        accessibilityLabel="Voucher purchase confirmation"
      >
        <ImageBackground
          source={require('@/assets/images/voucher_background.png')}
          style={ContainerStyles.voucherBackground}
          imageStyle={{ borderRadius: 10 }}
          accessible={false}
          accessibilityIgnoresInvertColors
        >
          <ThemedView
            style={{ marginBottom: 40, backgroundColor: 'transparent' }}
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
              accessibilityLabel={`Voucher value £${purchasedVoucher.value}`}
            >
              £{purchasedVoucher.value}
            </ThemedText>

            <ThemedView
              style={ContainerStyles.qrContainer}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`QR code for voucher number ${purchasedVoucher.voucherNumber}`}
            >
              <QRCode
                value={purchasedVoucher.voucherNumber}
                size={160}
                getRef={(ref) => {
                  qrCodeRef.current = ref;
                }}
              />
            </ThemedView>

            <ThemedText type="voucher">
              Voucher number:
            </ThemedText>
            <ThemedText
              type="voucher"
              selectable
              accessibilityLabel={`Voucher number ${purchasedVoucher.voucherNumber}`}
            >
              {purchasedVoucher.voucherNumber}
            </ThemedText>

            <ThemedText type="voucher">
              Purchase date:
            </ThemedText>
            <ThemedText
              type="voucher"
              accessibilityLabel={`Purchase date ${purchasedVoucher.date}`}
            >
              {purchasedVoucher.date}
            </ThemedText>

            <ThemedText
              type="voucherFineprint"
              accessibilityLabel="Terms of use. Vouchers are valid for 6 months from the date of issue. We accept no responsibility for lost or misplaced vouchers. Under no circumstances can these be replaced or redeemed."
            >
              Vouchers are valid for 6 months from the date of issue. We accept no
              responsibility for lost or misplaced vouchers. Under no circumstances
              can these be replaced or redeemed.
            </ThemedText>
          </ThemedView>
        </ImageBackground>

        <Pressable
          style={ButtonAndInputStyles.button}
          onPress={handleDownloadVoucher}
          accessibilityRole="button"
          accessibilityLabel="Download voucher"
          accessibilityHint="Creates a downloadable PDF copy of this voucher"
        >
          <ThemedText type="defaultSemiBold">
            Download
          </ThemedText>
        </Pressable>

        <Pressable
          style={ButtonAndInputStyles.button}
          onPress={handleBackToPurchase}
          accessibilityRole="button"
          accessibilityLabel="Back to voucher purchase form"
          accessibilityHint="Returns to the voucher purchase input screen"
        >
          <ThemedText type="defaultSemiBold">
            Back
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#560324' }}>
      <ParallaxScrollView>
        <Image
          source={require('@/assets/images/Vouchers.jpg')}
          style={ContainerStyles.titleImage}
          accessibilityLabel="Gift voucher image"
          accessibilityHint="Decorative image for the gift voucher purchase screen"
        />

        {purchasedVoucher ? renderVoucherResult() : renderPurchaseForm()}

        <Footer />
      </ParallaxScrollView>

      <Modal
        visible={isLoading}
        transparent
        animationType="fade"
        accessibilityViewIsModal
        onRequestClose={() => {}}
      >
        <ThemedView
          style={ContainerStyles.loadingOverlay}
          accessible
          accessibilityRole="alert"
          accessibilityLabel="Processing voucher purchase. Please wait."
          accessibilityLiveRegion="polite"
        >
          <ActivityIndicator
            size="large"
            accessibilityLabel="Loading"
          />
          <ThemedText type="defaultSemiBold">
            Processing voucher purchase...
          </ThemedText>
        </ThemedView>
      </Modal>
    </SafeAreaView>
  );
}