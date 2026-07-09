import React from 'react';
import { TextField } from './TextField';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  label?: string;
}

export function HubUrlInput({ value, onChangeText, label = 'Hub URL' }: Props) {
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder="http://192.168.1.5:4000"
      autoCapitalize="none"
      keyboardType="url"
      hint="The teacher laptop's IP on the same Wi-Fi / hotspot — shown when the hub starts."
    />
  );
}
