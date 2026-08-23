import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { colours } from '@/theme/colours';

export default function StrengthTrainingScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return (
    <Screen>
      <Brand /><BackButton />
      <Text style={styles.title}>Strength Training</Text>
      {date ? <Text style={styles.subtitle}>Adding workout to {formatDate(date)}</Text> : null}
      <Pressable style={styles.quickStart} onPress={() => router.push({ pathname: '/(app)/workout', params: date ? { date } : {} })}>
        <View style={styles.plusCircle}><Text style={styles.plus}>+</Text></View>
        <View style={styles.copy}><Text style={styles.label}>QUICK START</Text><Text style={styles.text}>Start an empty workout</Text></View><Text style={styles.arrow}>›</Text>
      </Pressable>
    </Screen>
  );
}
function formatDate(value: string) { const [y,m,d] = value.split('-'); return `${d}/${m}/${y}`; }
const styles = StyleSheet.create({
  title:{color:colours.white,fontSize:30,lineHeight:34,fontWeight:'900',marginBottom:6},subtitle:{color:colours.gold,fontSize:9,fontWeight:'900',marginBottom:14},quickStart:{borderWidth:1,borderColor:colours.gold,borderRadius:16,backgroundColor:colours.card,minHeight:86,flexDirection:'row',alignItems:'center',paddingHorizontal:15},plusCircle:{width:45,height:45,borderRadius:23,backgroundColor:colours.gold,alignItems:'center',justifyContent:'center',marginRight:13},plus:{color:colours.background,fontSize:29,lineHeight:31,fontWeight:'500'},copy:{flex:1},label:{color:colours.gold,fontSize:10,fontWeight:'900',letterSpacing:1},text:{color:colours.white,fontSize:12,fontWeight:'700',marginTop:4},arrow:{color:colours.gold,fontSize:30,fontWeight:'300'}
});
