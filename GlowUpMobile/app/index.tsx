import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, SafeAreaView, BackHandler, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Camera from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useCameraPermissions } from 'expo-camera';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Add these two new required properties:
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

export default function App() {
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const [notifPermission, setNotifPermission] = useState<boolean | null>(null);
  const webviewRef = useRef<WebView>(null);

  // CHANGE THIS: Your live Vercel/Netlify URL
  const WEB_APP_URL = 'https://glow-up-gules.vercel.app/'; 

  useEffect(() => {
    // 2. Request permissions inside useEffect
    (async () => {
      // Handle Camera
      if (cameraPermission && !cameraPermission.granted) {
        await requestCameraPermission();
      }
      // Handle Notifications
      await Notifications.requestPermissionsAsync();
    })();

    // Handle Android hardware back button
    const onBackPress = () => {
      if (webviewRef.current) {
        webviewRef.current.goBack();
        return true; 
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [cameraPermission, requestCameraPermission]);

  // --- LOCAL NOTIFICATION SCHEDULER ---
  const scheduleReminders = async () => {
    try {
      // 1. Clear any previously scheduled GlowUp notifications to prevent overlapping
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 2. Schedule Morning Ritual (8:00 AM Daily)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Morning Glow ✨",
          body: "Time for your morning ritual. Let's start the day with self-love.",
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: 8,
          minute: 0,
        },
      });

      // 3. Schedule Evening Ritual (7:00 PM Daily)
      // Note: We use 19 for 7:00 PM in 24-hour format
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Evening Zen 🌙",
          body: "Your evening ritual is ready. Time to wind down and glow.",
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });

      console.log("Daily rituals scheduled for 8:00 AM and 7:00 PM local time.");
    } catch (error) {
      console.error("Failed to schedule daily reminders:", error);
    }
  };

  // --- WEB-TO-NATIVE BRIDGE ---
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SCHEDULE_REMINDERS') {
        scheduleReminders();
      }
    } catch (e) {
      console.error("Bridge Error:", e);
    }
  };

  const androidProps = Platform.OS === 'android' ? {
    onPermissionRequest: (event: any) => {
      event.request.grant();
    }
  } : {};

  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        ref={webviewRef}
        source={{ uri: WEB_APP_URL }}
        onMessage={onMessage} 
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        {...androidProps}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#AF905B" size="large" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF2F2', 
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
  }
});