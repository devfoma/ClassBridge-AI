import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppButton } from '../../src/components/AppButton';
import { Icon } from '../../src/components/Icon';
import { parseJoinPayload } from '../../src/utils/joinQr';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function ScanJoin() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const insets = useSafeAreaInsets();

  const handleScan = (result: BarcodeScanningResult) => {
    if (scanned) return;
    const payload = parseJoinPayload(result.data);
    if (!payload) return; // Not a ClassBridge join code: keep scanning.
    setScanned(true);
    // Hand the scanned details to the join form, which confirms the name and joins.
    router.replace({
      pathname: '/student/join-class',
      params: { hubUrl: payload.hubUrl, code: payload.classCode },
    });
  };

  // Permission still loading.
  if (!permission) {
    return (
      <Screen header={<AppBar title="Scan to Join" role="student" back />}>
        <View style={styles.centered}>
          <Text style={styles.info}>Preparing camera…</Text>
        </View>
      </Screen>
    );
  }

  // Permission not granted yet.
  if (!permission.granted) {
    return (
      <Screen header={<AppBar title="Scan to Join" role="student" back />}>
        <View style={styles.centered}>
          <Text style={styles.title}>Camera access needed</Text>
          <Text style={styles.info}>
            ClassBridge uses the camera only to scan your teacher's class join code.
          </Text>
          <AppButton
            title="Allow Camera"
            icon="scan"
            onPress={requestPermission}
            style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          />
          <AppButton
            title="Enter code manually"
            variant="ghost"
            onPress={() => router.replace('/student/join-class')}
            style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="back" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.frame} pointerEvents="none" />
        <Text style={styles.overlayText} pointerEvents="none">
          Point at your teacher's class QR code
        </Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <AppButton
          title="Enter code manually"
          variant="secondary"
          onPress={() => router.replace('/student/join-class')}
        />
      </View>
    </View>
  );
}

const FRAME = 240;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  info: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  frame: {
    width: FRAME,
    height: FRAME,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
