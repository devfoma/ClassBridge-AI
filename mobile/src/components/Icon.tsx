import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * Centralised icon set so screens reference semantic names (e.g. "lessons")
 * instead of raw glyph strings. Maps to Material Symbols equivalents used in the
 * design mockups.
 */
const GLYPHS = {
  // navigation / tabs
  dashboard: { set: 'mi', glyph: 'space-dashboard' },
  library: { set: 'mi', glyph: 'menu-book' },
  submissions: { set: 'mi', glyph: 'fact-check' },
  settings: { set: 'mi', glyph: 'settings' },
  lessons: { set: 'mi', glyph: 'auto-stories' },
  sync: { set: 'mi', glyph: 'sync' },
  feedback: { set: 'mi', glyph: 'reviews' },
  classroom: { set: 'mi', glyph: 'groups' },
  insight: { set: 'mc', glyph: 'lightbulb-on-outline' },

  // status
  offline: { set: 'mi', glyph: 'wifi-off' },
  online: { set: 'mi', glyph: 'wifi' },
  cloudSync: { set: 'mi', glyph: 'cloud-sync' },
  cloudDone: { set: 'mi', glyph: 'cloud-done' },
  cloudOff: { set: 'mi', glyph: 'cloud-off' },
  check: { set: 'mi', glyph: 'check-circle' },
  pending: { set: 'mi', glyph: 'schedule' },
  warning: { set: 'mi', glyph: 'warning-amber' },
  error: { set: 'mi', glyph: 'error-outline' },

  // actions
  add: { set: 'mi', glyph: 'add' },
  back: { set: 'mi', glyph: 'arrow-back' },
  chevron: { set: 'mi', glyph: 'chevron-right' },
  download: { set: 'mi', glyph: 'download-for-offline' },
  play: { set: 'mi', glyph: 'play-circle-filled' },
  send: { set: 'mi', glyph: 'send' },
  save: { set: 'mi', glyph: 'save' },
  publish: { set: 'mi', glyph: 'publish' },
  edit: { set: 'mi', glyph: 'edit' },
  refresh: { set: 'mi', glyph: 'refresh' },
  test: { set: 'mi', glyph: 'wifi-tethering' },
  clear: { set: 'mi', glyph: 'cleaning-services' },
  reset: { set: 'mi', glyph: 'restart-alt' },
  logout: { set: 'mi', glyph: 'logout' },

  // objects / content
  ai: { set: 'mi', glyph: 'auto-awesome' },
  resource: { set: 'mi', glyph: 'description' },
  quiz: { set: 'mi', glyph: 'quiz' },
  upload: { set: 'mi', glyph: 'upload-file' },
  qr: { set: 'mi', glyph: 'qr-code-2' },
  scan: { set: 'mi', glyph: 'qr-code-scanner' },
  person: { set: 'mi', glyph: 'person' },
  school: { set: 'mi', glyph: 'school' },
  offlinePin: { set: 'mi', glyph: 'offline-pin' },
  rocket: { set: 'mc', glyph: 'rocket-launch-outline' },
  star: { set: 'mi', glyph: 'star' },
  key: { set: 'mi', glyph: 'vpn-key' },
  link: { set: 'mi', glyph: 'link' },
  info: { set: 'mi', glyph: 'info-outline' },
} as const;

export type IconName = keyof typeof GLYPHS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 24, color = colors.text, style }: Props) {
  const entry = GLYPHS[name];
  const Comp = (entry.set === 'mc' ? MaterialCommunityIcons : MaterialIcons) as typeof MaterialIcons;
  return <Comp name={entry.glyph as never} size={size} color={color} style={style} />;
}
