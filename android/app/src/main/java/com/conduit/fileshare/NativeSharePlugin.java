package com.conduit.fileshare;

import android.content.ClipData;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.os.Build;
import android.os.Environment;
import android.net.Uri;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@CapacitorPlugin(name = "NativeShare")
public class NativeSharePlugin extends Plugin {
    private static final class OutgoingShareFile {
        final File file;
        final FileOutputStream stream;

        OutgoingShareFile(File file, FileOutputStream stream) {
            this.file = file;
            this.stream = stream;
        }
    }

    private final Map<String, OutgoingShareFile> outgoingFiles = new ConcurrentHashMap<>();

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (isShareIntent(intent)) {
            notifyListeners("shareReceived", new JSObject(), true);
        }
    }

    private boolean isShareIntent(Intent intent) {
        if (intent == null) return false;
        String action = intent.getAction();
        return Intent.ACTION_SEND.equals(action) || Intent.ACTION_SEND_MULTIPLE.equals(action);
    }

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
    public void startOutgoingFile(PluginCall call) {
        String name = sanitizeFileName(call.getString("name", "shared-file"));
        File directory = new File(getContext().getCacheDir(), "outgoing-shares");
        removeExpiredOutgoingFiles(directory);
        if (!directory.exists() && !directory.mkdirs()) {
            call.reject("Could not prepare the file for sharing.");
            return;
        }

        try {
            File file = File.createTempFile("conduit-", "-" + name, directory);
            String id = UUID.randomUUID().toString();
            outgoingFiles.put(id, new OutgoingShareFile(file, new FileOutputStream(file)));
            JSObject result = new JSObject();
            result.put("id", id);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not prepare the file for sharing: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void appendOutgoingFile(PluginCall call) {
        String id = call.getString("id");
        String data = call.getString("data");
        OutgoingShareFile target = outgoingFiles.get(id);
        if (target == null || data == null) {
            call.reject("The file being shared is no longer available.");
            return;
        }

        try {
            target.stream.write(android.util.Base64.decode(data, android.util.Base64.DEFAULT));
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not prepare the file for sharing: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void finishOutgoingFile(PluginCall call) {
        OutgoingShareFile target = outgoingFiles.remove(call.getString("id"));
        if (target == null) {
            call.reject("The file being shared is no longer available.");
            return;
        }

        try {
            target.stream.close();
            JSObject result = new JSObject();
            result.put("path", target.file.getAbsolutePath());
            call.resolve(result);
        } catch (Exception error) {
            target.file.delete();
            call.reject("Could not finish preparing the file: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void cancelOutgoingFile(PluginCall call) {
        OutgoingShareFile target = outgoingFiles.remove(call.getString("id"));
        if (target != null) {
            try {
                target.stream.close();
            } catch (Exception error) {
                call.reject("Could not clean up the prepared file: " + error.getMessage(), error);
                return;
            }
            if (target.file.exists() && !target.file.delete()) {
                call.reject("Could not clean up the prepared file.");
                return;
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void shareNearby(PluginCall call) {
        shareWithSystemChooser(call, "Share with a nearby device");
    }

    @PluginMethod
    public void receiveSharedFiles(PluginCall call) {
        Intent intent = getActivity().getIntent();
        if (!isShareIntent(intent)) {
            JSObject result = new JSObject();
            result.put("files", new JSArray());
            call.resolve(result);
            return;
        }

        LinkedHashSet<Uri> sources = getSharedUris(intent);
        if (sources.isEmpty()) {
            call.reject("The shared item did not include any files.");
            return;
        }

        getActivity().setIntent(new Intent(Intent.ACTION_MAIN));
        JSArray importedFiles = new JSArray();
        try {
            for (Uri source : sources) {
                importedFiles.put(saveIncomingFile(source));
            }
            JSObject result = new JSObject();
            result.put("files", importedFiles);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not save the shared file: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void shareViaBluetooth(PluginCall call) {
        shareWithSystemChooser(call, "Share via Bluetooth");
    }

    @PluginMethod
    public void shareViaWifiDirect(PluginCall call) {
        shareWithSystemChooser(call, "Share via Wi-Fi or Quick Share");
    }

    private void shareWithSystemChooser(PluginCall call, String chooserTitle) {
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
            ClipData clipData = ClipData.newUri(getContext().getContentResolver(), "Conduit files", uriList.get(0));
            for (int index = 1; index < uriList.size(); index++) {
                clipData.addItem(new ClipData.Item(uriList.get(index)));
            }
            intent.setClipData(clipData);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(intent, chooserTitle);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);

            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open Android sharing: " + e.getMessage(), e);
        }
    }

    private LinkedHashSet<Uri> getSharedUris(Intent intent) {
        LinkedHashSet<Uri> sources = new LinkedHashSet<>();
        ClipData clipData = intent.getClipData();
        if (clipData != null) {
            for (int index = 0; index < clipData.getItemCount(); index++) {
                Uri uri = clipData.getItemAt(index).getUri();
                if (uri != null) sources.add(uri);
            }
        }

        Object stream = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (stream instanceof Uri) sources.add((Uri) stream);
        if (stream instanceof ArrayList<?>) {
            for (Object item : (ArrayList<?>) stream) {
                if (item instanceof Uri) sources.add((Uri) item);
            }
        }
        return sources;
    }

    private JSObject saveIncomingFile(Uri source) throws Exception {
        String name = getDisplayName(source);
        String mimeType = getContext().getContentResolver().getType(source);
        if (mimeType == null || mimeType.trim().isEmpty()) mimeType = "application/octet-stream";
        name = sanitizeFileName(name);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, name);
            values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Conduit");
            values.put(MediaStore.Downloads.IS_PENDING, 1);
            Uri destination = getContext().getContentResolver().insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                values
            );
            if (destination == null) throw new IllegalStateException("Could not create a Downloads file.");
            try {
                copySharedContent(source, getContext().getContentResolver().openOutputStream(destination, "w"));
                ContentValues published = new ContentValues();
                published.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(destination, published, null, null);
                JSObject file = new JSObject();
                file.put("name", name);
                file.put("mimeType", mimeType);
                file.put("uri", destination.toString());
                return file;
            } catch (Exception error) {
                getContext().getContentResolver().delete(destination, null, null);
                throw error;
            }
        }

        File directory = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Conduit");
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IllegalStateException("Could not create the Conduit Downloads folder.");
        }
        File destination = new File(directory, name);
        copySharedContent(source, new FileOutputStream(destination, false));
        JSObject file = new JSObject();
        file.put("name", name);
        file.put("mimeType", mimeType);
        file.put("uri", Uri.fromFile(destination).toString());
        return file;
    }

    private String getDisplayName(Uri source) {
        try (Cursor cursor = getContext().getContentResolver().query(
            source,
            new String[] { OpenableColumns.DISPLAY_NAME },
            null,
            null,
            null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int column = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (column >= 0) return cursor.getString(column);
            }
        } catch (Exception ignored) {
            // Fall back to the URI name if the provider does not expose a display name.
        }
        String lastSegment = source.getLastPathSegment();
        return lastSegment == null ? "shared-file" : lastSegment;
    }

    private void copySharedContent(Uri source, OutputStream destination) throws Exception {
        if (destination == null) throw new IllegalStateException("Could not open the Downloads file.");
        try (InputStream input = getContext().getContentResolver().openInputStream(source);
             OutputStream output = destination) {
            if (input == null) throw new IllegalStateException("Android could not open the shared file.");
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        }
    }

    private String sanitizeFileName(String name) {
        String safeName = new File(name == null ? "" : name).getName()
            .replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return safeName.isEmpty() || safeName.equals(".") || safeName.equals("..")
            ? "shared-file"
            : safeName;
    }

    private void removeExpiredOutgoingFiles(File directory) {
        File[] files = directory.listFiles();
        if (files == null) return;
        long expiration = System.currentTimeMillis() - 24L * 60 * 60 * 1000;
        for (File file : files) {
            if (file.lastModified() < expiration) file.delete();
        }
    }
}
