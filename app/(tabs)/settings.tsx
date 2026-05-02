import { Redirect } from 'expo-router';

// Settings merged into Profile tab
export default function SettingsRedirect() {
  return <Redirect href="/(tabs)/profile" />;
}
