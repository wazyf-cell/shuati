package com.shuati.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "ShuatiUpdater")
public class ShuatiUpdaterPlugin extends Plugin {
    private static final String TAG = "ShuatiUpdater";
    private final AtomicBoolean cancelled = new AtomicBoolean(false);
    private final AtomicBoolean downloading = new AtomicBoolean(false);

    @PluginMethod
    public void download(PluginCall call) {
        String urlText = call.getString("url");
        String fileName = call.getString("fileName");
        String expectedSha256 = call.getString("expectedSha256");

        if (urlText == null || urlText.isEmpty() || fileName == null || fileName.isEmpty()) {
            call.reject("缺少下载地址或文件名");
            return;
        }
        if (expectedSha256 == null || expectedSha256.isEmpty()) {
            call.reject("缺少 SHA256 校验值");
            return;
        }
        if (fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
            call.reject("非法文件名");
            return;
        }
        if (!downloading.compareAndSet(false, true)) {
            call.reject("已有下载任务正在进行");
            return;
        }

        call.setKeepAlive(true);
        if (cancelled.getAndSet(false)) {
            downloading.set(false);
            call.setKeepAlive(false);
            call.reject("CANCELLED");
            return;
        }
        final File target = new File(getContext().getCacheDir(), fileName);

        new Thread(() -> {
            try {
                if (target.exists() && !target.delete()) {
                    throw new IOException("无法删除旧文件");
                }
                HttpURLConnection connection = (HttpURLConnection) new URL(urlText).openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(60000);
                connection.setRequestProperty("User-Agent", "shuati-updater/1.0");
                connection.setRequestProperty("Accept", "application/octet-stream,*/*");
                connection.setRequestProperty("Accept-Encoding", "identity");

                int code = connection.getResponseCode();
                if (code < 200 || code >= 300) {
                    throw new IOException("HTTP " + code);
                }

                long total = connection.getContentLengthLong();
                long downloaded = 0;
                long lastEmit = 0;
                byte[] buffer = new byte[16 * 1024];

                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(target)) {
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        if (cancelled.get()) {
                            throw new CancelledException();
                        }
                        output.write(buffer, 0, read);
                        downloaded += read;
                        long now = System.currentTimeMillis();
                        if (now - lastEmit >= 150 || (total > 0 && downloaded >= total)) {
                            lastEmit = now;
                            emitProgress(downloaded, total);
                        }
                    }
                }

                emitProgress(downloaded, total > 0 ? total : downloaded);
                String actual = sha256(target);
                if (!actual.equalsIgnoreCase(expectedSha256.trim())) {
                    target.delete();
                    JSObject data = new JSObject();
                    data.put("code", "CHECKSUM_MISMATCH");
                    data.put("actualSha256", actual);
                    call.reject("SHA256 校验失败", data);
                    return;
                }

                JSObject result = new JSObject();
                result.put("path", target.getAbsolutePath());
                result.put("sha256", actual);
                call.resolve(result);
            } catch (CancelledException e) {
                target.delete();
                call.reject("CANCELLED");
            } catch (Exception e) {
                Log.e(TAG, "download failed", e);
                target.delete();
                call.reject("下载失败: " + e.getMessage());
            } finally {
                downloading.set(false);
                cancelled.set(false);
                call.setKeepAlive(false);
            }
        }, "shuati-update-download").start();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        if (downloading.get()) {
            cancelled.set(true);
        }
        call.resolve();
    }

    @PluginMethod
    public void install(PluginCall call) {
        String fileName = call.getString("fileName");
        String expectedSha256 = call.getString("expectedSha256");
        if (fileName == null || fileName.isEmpty()) {
            call.reject("缺少文件名");
            return;
        }
        if (expectedSha256 == null || expectedSha256.isEmpty()) {
            call.reject("缺少 SHA256 校验值");
            return;
        }

        File file = new File(getContext().getCacheDir(), fileName);
        if (!file.exists()) {
            call.reject("安装文件不存在，请重新下载");
            return;
        }

        try {
            String actual = sha256(file);
            if (!actual.equalsIgnoreCase(expectedSha256.trim())) {
                file.delete();
                JSObject data = new JSObject();
                data.put("code", "CHECKSUM_MISMATCH");
                data.put("actualSha256", actual);
                call.reject("SHA256 校验失败，文件已删除", data);
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    && !getContext().getPackageManager().canRequestPackageInstalls()) {
                JSObject result = new JSObject();
                result.put("needsPermission", true);
                call.resolve(result);
                return;
            }

            Uri uri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    file
            );
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("needsPermission", false);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "install failed", e);
            call.reject("打开安装程序失败: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    private void emitProgress(long downloaded, long total) {
        int percent = total > 0
                ? (int) Math.min(100, Math.round(downloaded * 100.0 / total))
                : 0;
        JSObject data = new JSObject();
        data.put("downloaded", downloaded);
        data.put("total", total);
        data.put("percent", percent);
        notifyListeners("progress", data);
    }

    private static String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[16 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
        }
        byte[] bytes = digest.digest();
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }

    private static class CancelledException extends Exception {
    }
}
