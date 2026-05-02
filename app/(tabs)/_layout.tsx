import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props}/>} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"/>
      <Tabs.Screen name="battle-log"/>
      <Tabs.Screen name="prayer"/>
      <Tabs.Screen name="blocker"/>
      <Tabs.Screen name="brotherhood"/>
      <Tabs.Screen name="profile"/>
    </Tabs>
  );
}
