package com.conduit.fileshare;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "NativeShare")
public class NativeSharePlugin extends Plugin {

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            JSArray appList = new JSArray();

            for (ApplicationInfo appInfo : packages) {
                // Filter out system apps if requested or include user installed apps
                boolean isSystem = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                boolean isUpdatedSystem = (appInfo.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0;

                if (!isSystem || isUpdatedSystem || "com.conduit.fileshare".equals(appInfo.packageName)) {
                    File apkFile = new File(appInfo.sourceDir);
                    if (apkFile.exists()) {
                        JSObject appObj = new JSObject();
                        String label = pm.getApplicationLabel(appInfo).toString();
                        appObj.put("name", label);
                        appObj.put("packageName", appInfo.packageName);
                        appObj.put("apkPath", appInfo.sourceDir);
                        appObj.put("size", apkFile.length());
                        appObj.put("isSystem", isSystem);

                        try {
                            PackageInfo pInfo = pm.getPackageInfo(appInfo.packageName, 0);
                            appObj.put("version", pInfo.versionName != null ? pInfo.versionName : "1.0");
                        } catch (Exception ignored) {
                            appObj.put("version", "1.0");
                        }

                        appList.put(appObj);
                    }
                }
            }

            JSObject result = new JSObject();
            result.put("apps", appList);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to retrieve installed applications: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void getSelfApk(PluginCall call) {
        try {
            ApplicationInfo appInfo = getContext().getApplicationInfo();
            File apkFile = new File(appInfo.sourceDir);

            JSObject result = new JSObject();
            result.put("name", "Conduit File Share");
            result.put("packageName", appInfo.packageName);
            result.put("apkPath", appInfo.sourceDir);
            result.put("size", apkFile.exists() ? apkFile.length() : 0);

            call.resolve(result);
        } catch (Exception e) {
            call.reject("Could not get Conduit APK path: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void shareViaBluetooth(PluginCall call) {
        String filePath = call.getString("filePath");
        JSArray filePaths = call.getArray("filePaths");

        try {
            List<String> paths = new ArrayList<>();
            if (filePath != null && !filePath.isEmpty()) {
                paths.add(filePath);
            } else if (filePaths != null) {
                for (int i = 0; i < filePaths.length(); i++) {
                    paths.add(filePaths.getString(i));
                }
            }

            if (paths.isEmpty()) {
                call.reject("No file paths provided to share.");
                return;
            }

            String authority = getContext().getPackageName() + ".fileprovider";
            ArrayList<Uri> uriList = new ArrayList<>();

            for (String p : paths) {
                File file = new File(p);
                if (file.exists()) {
                    Uri uri = FileProvider.getUriForFile(getContext(), authority, file);
                    uriList.add(uri);
                }
            }

            if (uriList.isEmpty()) {
                call.reject("Target files do not exist.");
                return;
            }

            Intent intent = new Intent();
            if (uriList.size() == 1) {
                intent.setAction(Intent.ACTION_SEND);
                intent.putExtra(Intent.EXTRA_STREAM, uriList.get(0));
            } else {
                intent.setAction(Intent.ACTION_SEND_MULTIPLE);
                intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uriList);
            }

            intent.setType("*/*");
            intent.setPackage("com.android.bluetooth");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Check if Bluetooth share handler exists directly
            PackageManager pm = getContext().getPackageManager();
            if (intent.resolveActivity(pm) != null) {
                getContext().startActivity(Intent.createChooser(intent, "Share via Bluetooth"));
            } else {
                // Fallback to general system share if com.android.bluetooth target is customized by OEM
                intent.setPackage(null);
                Intent chooser = Intent.createChooser(intent, "Share via Bluetooth / Nearby");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(chooser);
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Bluetooth share failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void shareViaWifiDirect(PluginCall call) {
        String filePath = call.getString("filePath");
        JSArray filePaths = call.getArray("filePaths");

        try {
            List<String> paths = new ArrayList<>();
            if (filePath != null && !filePath.isEmpty()) {
                paths.add(filePath);
            } else if (filePaths != null) {
                for (int i = 0; i < filePaths.length(); i++) {
                    paths.add(filePaths.getString(i));
                }
            }

            if (paths.isEmpty()) {
                call.reject("No file paths provided to share.");
                return;
            }

            String authority = getContext().getPackageName() + ".fileprovider";
            ArrayList<Uri> uriList = new ArrayList<>();

            for (String p : paths) {
                File file = new File(p);
                if (file.exists()) {
                    Uri uri = FileProvider.getUriForFile(getContext(), authority, file);
                    uriList.add(uri);
                }
            }

            if (uriList.isEmpty()) {
                call.reject("Target files do not exist.");
                return;
            }

            Intent intent = new Intent();
            if (uriList.size() == 1) {
                intent.setAction(Intent.ACTION_SEND);
                intent.putExtra(Intent.EXTRA_STREAM, uriList.get(0));
            } else {
                intent.setAction(Intent.ACTION_SEND_MULTIPLE);
                intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uriList);
            }

            intent.setType("*/*");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(intent, "Share via Wi-Fi Direct / Quick Share");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);

            call.resolve();
        } catch (Exception e) {
            call.reject("Wi-Fi Direct share failed: " + e.getMessage(), e);
        }
    }
}
