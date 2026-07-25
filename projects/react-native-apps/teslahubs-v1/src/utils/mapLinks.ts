import { Linking } from 'react-native';

export function openGoogleMaps(lat: number, lng: number) {
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
}

export function openAppleMaps(lat: number, lng: number) {
  Linking.openURL(`https://maps.apple.com/?daddr=${lat},${lng}`);
}

export function openWaze(lat: number, lng: number) {
  Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
}
