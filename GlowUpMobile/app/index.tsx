import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, SafeAreaView, BackHandler, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Camera from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

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
    (async () => {
      // Request Camera
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      // Request Notifications
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifPermission(status === 'granted');
    })();

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

  // Handle Logic for scheduling daily reminders
  const scheduleReminders = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const IS_TEST_MODE = true; 

      // 1. Morning Ritual
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Morning Glow ✨",
          body: "Time for your morning ritual. Let's start the day with self-love.",
        },
        trigger: IS_TEST_MODE 
          ? { 
              type: SchedulableTriggerInputTypes.TIME_INTERVAL, 
              seconds: 10, 
              repeats: false 
            } 
          : { 
              type: SchedulableTriggerInputTypes.DAILY, 
              hour: 8, 
              minute: 30 
            },
      });

      // 2. Evening Ritual
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Evening Zen 🌙",
          body: "Your evening ritual is ready. Time to wind down and glow.",
        },
        trigger: IS_TEST_MODE 
          ? { 
              type: SchedulableTriggerInputTypes.TIME_INTERVAL, 
              seconds: 20, 
              repeats: false 
            } 
          : { 
              type: SchedulableTriggerInputTypes.DAILY, 
              hour: 20, 
              minute: 30 
            },
      });

      console.log(IS_TEST_MODE ? "Test Reminders Set" : "Daily Reminders Set");
    } catch (error) {
      console.error("Notification Error:", error);
    }
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SCHEDULE_REMINDERS') {
        scheduleReminders();
      }
    } catch (e) {
      console.error("Message Error", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        ref={webviewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        onMessage={onMessage}
        
        // Settings for high-end web apps
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        
        // Android specific permission granting
        {...(Platform.OS === 'android' ? {
          onPermissionRequest: (event: any) => event.request.grant()
        } : {})}

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
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
  }
});