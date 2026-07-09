import React from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { fontForWeight } from './typography';

/**
 * Applies the correct Inter family to every <Text>/<TextInput> based on its
 * fontWeight, so the whole app renders in Inter without every style needing an
 * explicit `fontFamily`. Any style that already sets `fontFamily` is respected.
 *
 * Call once, before the first render (see app/_layout.tsx).
 */
let patched = false;

export function applyInterFont(): void {
  if (patched) return;
  patched = true;

  [RNText, RNTextInput].forEach((Component: any) => {
    const original = Component.render;
    if (typeof original !== 'function') return;

    Component.render = function patchedRender(...args: any[]) {
      const element = original.apply(this, args);
      if (!element || !element.props) return element;

      const flat = StyleSheet.flatten(element.props.style) || {};
      if (flat.fontFamily) return element; // explicit family wins

      return React.cloneElement(element, {
        style: [{ fontFamily: fontForWeight(flat.fontWeight) }, element.props.style],
      });
    };
  });
}
