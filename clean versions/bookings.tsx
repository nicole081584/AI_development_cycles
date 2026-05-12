// app/(tabs)/menu/bookings.tsx
import { Image } from 'expo-image';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import  Footer  from '@/components/Footer';
import ContainerStyles from '@/components/ContainerStyles';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function BookingsScreen() {

  return (
   
    <SafeAreaView style={{ flex: 1, backgroundColor: '#560324'}}>
    <ParallaxScrollView>
       
          <Image
            source={require('@/assets/images/bookings.png')}
            style={ContainerStyles.titleImage}
            />    

      <Footer />
    </ParallaxScrollView>
    </SafeAreaView>
  );
}
