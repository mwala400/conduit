package com.conduit.fileshare;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@CapacitorPlugin(name = "NativeDownloads")
public class NativeDownloadsPlugin extends Plugin {
    private static final class DownloadTarget {
        final Uri uri;
        final OutputStream stream;

        DownloadTarget(Uri uri, OutputStream stream) {
            this.uri = uri;
            this.stream = stream;
        }
    }

    private final Map<String, DownloadTarget> downloads = new ConcurrentHashMap<>();

    @PluginMethod
    public void startFile(PluginCall call) {
        String name = call.getString("name", "download");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        name = new File(name).getName().replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        if (name.isEmpty() || name.equals(".") || name.equals("..")) name = "download";

        try {
            Uri uri;
            OutputStream stream;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Conduit");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("Could not create the Downloads file.");
                stream = getContext().getContentResolver().openOutputStream(uri, "w");
                if (stream == null) throw new IllegalStateException("Could not write the Downloads file.");
            } else {
                File directory = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Conduit");
                if (!directory.exists() && !directory.mkdirs()) {
                    throw new IllegalStateException("Could not create the Downloads folder.");
                }
                File file = new File(directory, name);
                uri = Uri.fromFile(file);
                stream = new FileOutputStream(file, false);
            }

            String id = UUID.randomUUID().toString();
            downloads.put(id, new DownloadTarget(uri, stream));
            JSObject result = new JSObject();
            result.put("id", id);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not create the download: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void appendFile(PluginCall call) {
        String id = call.getString("id");
        String data = call.getString("data");
        DownloadTarget target = downloads.get(id);
        if (target == null || data == null) {
            call.reject("The download is no longer available.");
            return;
        }

        try {
            target.stream.write(Base64.decode(data, Base64.DEFAULT));
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not write the downloaded data: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void finishFile(PluginCall call) {
        String id = call.getString("id");
        DownloadTarget target = downloads.remove(id);
        if (target == null) {
            call.reject("The download is no longer available.");
            return;
        }

        try {
            target.stream.close();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(target.uri, values, null, null);
            }
            JSObject result = new JSObject();
            result.put("uri", target.uri.toString());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Could not finish the downloaded file: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void cancelFile(PluginCall call) {
        DownloadTarget target = downloads.remove(call.getString("id"));
        if (target != null) {
            try {
                target.stream.close();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    getContext().getContentResolver().delete(target.uri, null, null);
                } else {
                    new File(target.uri.getPath()).delete();
                }
            } catch (Exception error) {
                call.reject("Could not cancel the download: " + error.getMessage(), error);
                return;
            }
        }
        call.resolve();
    }
}
