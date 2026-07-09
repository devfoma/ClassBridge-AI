import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppBar } from '../../src/components/AppBar';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAuthStore } from '../../src/state/useAuthStore';

export default function UploadResource() {
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('JSS2');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'text/*', 'application/octet-stream'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setFile(asset);
      if (!title) setTitle(asset.name.replace(/\.[^.]+$/, ''));
    }
  };

  const upload = async () => {
    if (!user?.hubUrl) {
      Alert.alert('Set hub URL first', 'Open Settings and enter the hub URL.');
      return;
    }
    if (!file) {
      Alert.alert('Pick a file', 'Choose a .txt lesson file to upload.');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'text/plain',
      } as unknown as Blob);
      form.append('title', title || file.name);
      form.append('subject', subject);
      form.append('level', level);

      const res = await fetch(`${user.hubUrl.replace(/\/+$/, '')}/resources/upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }
      Alert.alert('Uploaded', 'Resource added to the hub library.');
      router.back();
    } catch (err) {
      Alert.alert('Upload failed', (err as Error).message);
    }
    setUploading(false);
  };

  return (
    <Screen header={<AppBar title="Upload Resource" role="teacher" back />}>
      <AppCard>
        <Text style={styles.title}>Upload a text lesson</Text>
        <Text style={styles.hint}>For the MVP, plain text (.txt) files work best. PDF/video are planned.</Text>

        <AppButton
          title={file ? file.name : 'Choose File'}
          icon={file ? 'check' : 'resource'}
          variant="secondary"
          accent={colors.navy}
          onPress={pick}
        />

        <View style={{ height: spacing.lg }} />
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Photosynthesis Notes" accent={colors.navy} />
        <TextField label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Basic Science" accent={colors.navy} />
        <TextField
          label="Level"
          value={level}
          onChangeText={setLevel}
          placeholder="e.g. JSS2"
          autoCapitalize="characters"
          accent={colors.navy}
        />

        <AppButton
          title="Upload to Hub"
          icon="upload"
          accent={colors.navy}
          onPress={upload}
          loading={uploading}
          style={{ marginTop: spacing.sm }}
        />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: spacing.xs },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
});
