// app/(tabs)/menu/vouchers.tsx
import { Image } from 'expo-image';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';

import  Footer  from '@/components/Footer';
import ContainerStyles from '@/components/ContainerStyles';


export default function VouchersScreen() {


  return (
    
      <SafeAreaView style={{ flex: 1, backgroundColor: '#560324'}}>
    <ParallaxScrollView>
       
          <Image
            source={require('@/assets/images/Vouchers.jpg')}
            style={ContainerStyles.titleImage}
            />    

      <Footer />

      </ParallaxScrollView>
      </SafeAreaView>
  );
}



