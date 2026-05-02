import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../lib/gameData';
import { useGame } from '../lib/gameStore';

export default function GameLayout() {
  const { character } = useGame();

  useEffect(() => {
    if (!character) router.replace('/');
  }, [character]);

  if (!character) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgDeep,
          borderTopColor: 'rgba(212,175,55,0.25)',
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 14,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: 'rgba(192,199,209,0.5)',
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HERO',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'SKILLS',
          tabBarIcon: ({ color, size }) => <Ionicons name="git-branch-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'QUESTS',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'PACK',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="world"
        options={{
          title: 'REALM',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
