import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCodeBase, { type QRCodeProps } from 'react-native-qrcode-svg';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { Icon } from '../../src/components/Icon';
import { useAuthStore } from '../../src/state/useAuthStore';
import { encodeJoinPayload } from '../../src/utils/joinQr';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing, radius, shadow } from '../../src/theme/spacing';

// react-native-qrcode-svg's bundled types predate React 19's stricter JSX
// typing, so its default export isn't recognized as a valid JSX component.
const QRCode = QRCodeBase as unknown as React.ComponentType<QRCodeProps>;

export default function ClassQr() {
  const params = useLocalSearchParams<{ name?: string; code?: string }>();
  const user = useAuthStore((s) => s.user);
  const hubUrl = user?.hubUrl ?? '';
  const code = params.code ?? '';

  return (
    <Screen header={<AppBar title="Join QR" role="teacher" back />} contentStyle={styles.center}>
      <Text style={styles.className}>{params.name ?? 'Class'}</Text>
      <Text style={styles.subtitle}>Students scan this to join</Text>

      <View style={styles.qrWrap}>
        {code ? (
          <QRCode value={encodeJoinPayload(hubUrl, code)} size={248} backgroundColor="white" color={colors.navy} />
        ) : (
          <Text style={styles.muted}>No class code available</Text>
        )}
      </View>

      <View style={styles.codePill}>
        <Icon name="key" size={18} color={colors.navy} />
        <Text style={styles.codeText}>{code || '—'}</Text>
      </View>
      <Text style={styles.hub}>{hubUrl || 'Set the hub URL in Settings'}</Text>

      <Text style={styles.hint}>
        On the student device: Join a Class → Scan QR Code. Keep both devices on the same Wi-Fi / hotspot as the hub.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  className: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  qrWrap: {
    backgroundColor: 'white',
    padding: spacing.xl,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  muted: { width: 248, height: 248, textAlign: 'center', textAlignVertical: 'center', color: colors.textMuted },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    backgroundColor: colors.navySoft,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  codeText: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.navy, letterSpacing: 3 },
  hub: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 19,
    paddingHorizontal: spacing.md,
  },
});
