import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BackButton } from '@/components/BackButton';
import { Brand } from '@/components/Brand';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ActivityLog, getActivityLogs } from '@/features/activities/activity.service';
import { colours } from '@/theme/colours';

const DAILY_TARGET = 30;
const COMEBACK_RATE = 0.5;
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function ComebackScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const today = useMemo(() => new Date(), []);

  useFocusEffect(useCallback(() => {
    let live = true;
    getActivityLogs().then((items) => { if (live) setLogs(items); }).catch(() => { if (live) setLogs([]); });
    return () => { live = false; };
  }, []));

  const comeback = getRollingComeback(logs, today);
  const comebackMinutes = comeback.totalExtra * COMEBACK_RATE;
  const rollingDays = Array.from({ length: 7 }, (_, index) => addDays(today, -index));

  return <Screen>
    <Brand /><BackButton /><Text style={styles.title}>Comeback Minutes</Text><Text style={styles.subtitle}>Extra training can repair missed minutes inside your rolling 7-day window.</Text>
    <Text style={styles.sectionTitle}>LAST 7 DAYS</Text>
    <View style={styles.dayList}>{rollingDays.map((date) => {
      const key=dateKey(date),normal=normalCreditForDate(logs,date),recovered=comeback.recoveredByDate[key]||0,effective=Math.min(DAILY_TARGET,normal+recovered),doneNormally=normal>=DAILY_TARGET,doneWithComeback=!doneNormally&&effective>=DAILY_TARGET&&recovered>0,partialComeback=recovered>0&&effective<DAILY_TARGET,isToday=sameDate(date,today);
      return <Card key={key} style={[styles.dayCard,doneNormally&&styles.normalDone,(doneWithComeback||partialComeback)&&styles.comebackDay,isToday&&styles.todayCard]}><View style={styles.dayHeading}><View><Text style={styles.dayName}>{DAYS[date.getDay()]} {date.getDate()}{isToday?' • TODAY':''}</Text><Text style={styles.dayMeta}>{formatMinutes(normal)} normal{recovered>0?` + ${formatMinutes(recovered)} comeback`:''} min</Text></View><View style={styles.fireArea}><Text style={[styles.fire,!(doneNormally||doneWithComeback)&&styles.fireOff]}>🔥</Text><Text style={styles.dayTotal}>{formatMinutes(effective)} / {DAILY_TARGET}</Text></View></View>{partialComeback?<Text style={styles.partial}>+{formatMinutes(recovered)} comeback min applied — not enough to light the fire yet.</Text>:null}{doneWithComeback?<Text style={styles.repaired}>Completed using comeback minutes.</Text>:null}</Card>;
    })}</View>
    <Card style={styles.howCard}><Text style={styles.howLabel}>HOW IT WORKS</Text><Text style={styles.bodyLead}>Your first {DAILY_TARGET} credit minutes cover today. Anything above that becomes comeback credit at {Math.round(COMEBACK_RATE*100)}% and is applied backwards, starting with yesterday. Once a day falls outside the last 7 days it locks and cannot be repaired.</Text><View style={styles.summaryRow}><View style={styles.summaryBlock}><Text style={styles.summaryLabel}>EXCESS • LAST 7D</Text><Text style={styles.summaryValue}>{formatMinutes(comeback.totalExtra)}</Text><Text style={styles.summaryUnit}>raw min</Text></View><View style={styles.summaryBlock}><Text style={styles.summaryLabel}>COMEBACK RATE</Text><Text style={styles.summaryValue}>{Math.round(COMEBACK_RATE*100)}%</Text><Text style={styles.summaryUnit}>setting</Text></View><View style={styles.summaryBlock}><Text style={styles.summaryLabel}>COMEBACK MIN</Text><Text style={[styles.summaryValue,styles.purple]}>{formatMinutes(comebackMinutes)}</Text><Text style={styles.summaryUnit}>generated</Text></View></View><View style={styles.consistencyBlock}><Text style={styles.purpleLabel}>CONSISTENCY</Text><Text style={styles.body}>A repaired day counts as complete for your fire score from today forward. Comeback never awards XP retroactively. Anything older than 7 days is locked and cannot be repaired, no matter how much extra training you do later.</Text></View></Card>
  </Screen>;
}
function sameDate(a:Date,b:Date){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()} function dateKey(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`} function addDays(date:Date,amount:number){const copy=new Date(date);copy.setDate(copy.getDate()+amount);copy.setHours(12,0,0,0);return copy} function rawCreditForDate(logs:ActivityLog[],date:Date){return logs.filter((log)=>sameDate(new Date(log.performed_at),date)).reduce((sum,log)=>sum+Number(log.credit_minutes||0),0)} function normalCreditForDate(logs:ActivityLog[],date:Date){return Math.min(DAILY_TARGET,rawCreditForDate(logs,date))} function extraCreditForDate(logs:ActivityLog[],date:Date){return Math.max(0,rawCreditForDate(logs,date)-DAILY_TARGET)}
function getRollingComeback(logs:ActivityLog[],today:Date){const windowStart=addDays(today,-6),deficits:{key:string;remaining:number}[]=[],recoveredByDate:Record<string,number>={};let totalExtra=0,recovered=0;for(let index=0;index<7;index+=1){const date=addDays(windowStart,index),normal=normalCreditForDate(logs,date),missing=Math.max(0,DAILY_TARGET-normal),extra=extraCreditForDate(logs,date);totalExtra+=extra;let available=extra*COMEBACK_RATE;for(let deficitIndex=deficits.length-1;deficitIndex>=0&&available>0;deficitIndex-=1){const deficit=deficits[deficitIndex];if(deficit.remaining<=0)continue;const applied=Math.min(available,deficit.remaining);deficit.remaining-=applied;available-=applied;recovered+=applied;recoveredByDate[deficit.key]=(recoveredByDate[deficit.key]||0)+applied}if(missing>0)deficits.push({key:dateKey(date),remaining:missing})}return{recoveredByDate,totalExtra,recovered,missing:deficits.reduce((sum,item)=>sum+item.remaining,0)}}
function formatMinutes(value:number){return Number.isInteger(value)?String(value):value.toFixed(1)}
const styles=StyleSheet.create({title:{color:colours.white,fontSize:30,lineHeight:34,fontWeight:'900'},subtitle:{color:colours.muted,fontSize:11,lineHeight:16,marginTop:5,marginBottom:14},sectionTitle:{color:colours.white,fontSize:11,fontWeight:'900',letterSpacing:.5,marginBottom:8},dayList:{gap:7},dayCard:{paddingVertical:10,paddingHorizontal:12},normalDone:{borderColor:colours.green},comebackDay:{borderColor:colours.purple},todayCard:{borderWidth:2},dayHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dayName:{color:colours.white,fontSize:11,fontWeight:'900',letterSpacing:.5},dayMeta:{color:colours.muted,fontSize:8,marginTop:3},fireArea:{alignItems:'center',minWidth:54},fire:{fontSize:24},fireOff:{opacity:.18},dayTotal:{color:colours.muted,fontSize:7,fontWeight:'900',marginTop:1},partial:{color:colours.purple,fontSize:8,fontWeight:'800',marginTop:6},repaired:{color:colours.purple,fontSize:8,fontWeight:'900',marginTop:6},howCard:{borderColor:colours.purple,marginTop:14,marginBottom:10},howLabel:{color:colours.white,fontSize:13,fontWeight:'900',letterSpacing:1,marginBottom:7},bodyLead:{color:colours.white,fontSize:12,lineHeight:18},purpleLabel:{color:colours.purple,fontSize:9,fontWeight:'900',letterSpacing:1},body:{color:colours.white,fontSize:10,lineHeight:15,marginTop:6},summaryRow:{flexDirection:'row',gap:7,marginTop:12},summaryBlock:{flex:1,minHeight:82,backgroundColor:colours.card2,borderRadius:10,padding:9,justifyContent:'center'},summaryLabel:{color:colours.muted,fontSize:7,lineHeight:10,fontWeight:'900',letterSpacing:.6},summaryValue:{color:colours.white,fontSize:22,fontWeight:'900',marginTop:4},summaryUnit:{color:colours.muted,fontSize:7,fontWeight:'800',marginTop:1},purple:{color:colours.purple},consistencyBlock:{borderTopWidth:1,borderTopColor:colours.border,marginTop:12,paddingTop:10}});