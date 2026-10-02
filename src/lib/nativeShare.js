import { Capacitor, registerPlugin } from "@capacitor/core";

const NativeShare = registerPlugin("NativeShare");

export const isNativeAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
};

export const getInstalledApps = async () => {
  if (!isNativeAndroid()) {
    return [];
  }
  try {
    const res = await NativeShare.getInstalledApps();
    return res?.apps || [];
  } catch (err) {
    console.warn("Could not list installed apps:", err);
    return [];
  }
};

export const getSelfApk = async () => {
  if (!isNativeAndroid()) {
    return null;
  }
  try {
    const res = await NativeShare.getSelfApk();
    return res || null;
  } catch (err) {
    console.warn("Could not get Conduit APK info:", err);
    return null;
  }
};

export const shareViaBluetooth = async (filePathOrPaths) => {
  if (isNativeAndroid()) {
    try {
      if (Array.isArray(filePathOrPaths)) {
        await NativeShare.shareViaBluetooth({ filePaths: filePathOrPaths });
      } else {
        await NativeShare.shareViaBluetooth({ filePath: filePathOrPaths });
      }
      return true;
    } catch (err) {
      console.error("Bluetooth share error:", err);
      throw err;
    }
  }

  // Web Fallback
  if (navigator.share) {
    await navigator.share({
      title: "Share file",
      text: "Sending file via Bluetooth / Share",
    });
    return true;
  }
  throw new Error("Native Bluetooth share is supported on the Android Conduit APK.");
};

export const shareViaWifiDirect = async (filePathOrPaths) => {
  if (isNativeAndroid()) {
    try {
      if (Array.isArray(filePathOrPaths)) {
        await NativeShare.shareViaWifiDirect({ filePaths: filePathOrPaths });
      } else {
        await NativeShare.shareViaWifiDirect({ filePath: filePathOrPaths });
      }
      return true;
    } catch (err) {
      console.error("Wi-Fi Direct share error:", err);
      throw err;
    }
  }

  // Web Fallback
  if (navigator.share) {
    await navigator.share({
      title: "Share file",
      text: "Sending file via Wi-Fi Direct / Quick Share",
    });
    return true;
  }
  throw new Error("Native Wi-Fi Direct share is supported on the Android Conduit APK.");
};
