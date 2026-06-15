# 🌌 openportal - Restore functionality to your Meta Portal

[![Download openportal](https://img.shields.io/badge/Download-OpenPortal-blue.svg)](https://github.com/Nonthermal-grant161/openportal)

openportal allows you to regain control over your Meta Portal hardware. You can install apps, view your screen on your computer, and manage files. The tool runs directly in your web browser. You do not need to install drivers, background services, or separate software packages to use it.

## 🛠 Prerequisites

Before you start, ensure you have the following items:
* A Meta Portal device with the charging cable.
* A computer running Windows 10 or Windows 11.
* A web browser like Google Chrome, Microsoft Edge, or Brave.
* One USB-A to USB-C cable or a USB-C to USB-C cable, depending on your computer ports.

You must enable Developer Mode on your Meta Portal to allow the computer to send commands to the device. Open the settings menu on your Portal, navigate to the device information section, and tap the build version multiple times until the system provides a notification that developer options are active.

## 📥 Getting the Application

Visit the following page to access the portal tool: [https://github.com/Nonthermal-grant161/openportal](https://github.com/Nonthermal-grant161/openportal)

This browser-based tool uses WebUSB technology to communicate with your device. Since this is a progressive web application, you do not need to download an installer file. Simply click the link above and keep the browser window open.

## 🔗 Connecting Your Device

1. Connect your Meta Portal to your Windows computer using the USB cable.
2. Open the [openportal website](https://github.com/Nonthermal-grant161/openportal) in your browser.
3. Locate the "Connect" button on the main dashboard.
4. A browser window will appear listing available USB devices.
5. Select your Meta Portal from the list and click "Connect" or "Pair".
6. Look at your Meta Portal screen. You may see a prompt asking to "Allow USB Debugging". Check the box that says "Always allow from this computer" and select "OK".

Your browser will now show a green status indicator once the connection succeeds.

## 📺 Mirroring the Screen

You can view the Meta Portal display on your computer monitor using the mirroring feature. This is useful for capturing screen content or navigating the interface from your desk.

1. Once connected, click the "Mirror" tab in the openportal interface.
2. Select "Start Stream".
3. The Portal screen will appear in your browser window within a few seconds.
4. Use the controls on the screen to rotate the view or change the streaming resolution.

## 📦 Installing Applications

You can add software to your device by uploading APK files. These are standard Android installation files.

1. Navigate to the "App Manager" section of the web tool.
2. Click the "Upload APK" button.
3. Select an APK file from your computer hard drive.
4. The tool will transfer the file and install it on the Portal automatically.
5. Once the upload finishes, the app icon will appear in your device library.

## 📁 Managing Files

The File Manager allows you to move photos, videos, and documents between your Windows computer and the Meta Portal storage.

1. Click on the "File Manager" icon in the navigation bar.
2. The left panel shows your computer files and the right panel shows the device storage.
3. Drag and drop files from your computer into the Portal folder lists to copy them.
4. You can also delete items by selecting them and pressing the delete icon.

## 💡 Troubleshooting Connection Issues

If your device does not connect, follow these steps to resolve the issue:

* Change the USB cable. Many charging cables do not support data transfer. A high-quality data cable often solves connection problems.
* Try a different USB port on your computer. Ports on the back of desktop computers provide more stable power than front-facing ports.
* Update your browser. Ensure you use the latest version of Chrome or Edge to maintain compatibility with WebUSB.
* Restart the Meta Portal device. Hold the power button until the screen goes black, then turn it back on.
* Verify your connection. Open the Device Manager on Windows and check if the Portal appears under "Universal Serial Bus devices". If you see a yellow exclamation mark, your computer may lack the specific Android interface driver, though most modern Windows versions automatically handle this step.

## ⚙️ Advanced Features

The openportal tool provides access to advanced system commands through the "Terminal" tab. Experienced users can send direct instructions to the underlying Android operating system. Do not modify system files if you do not know the purpose of a command, as this might cause the device to become unresponsive. The tool includes a reset command in the settings menu to factory defaults if you experience software issues after installing a new application.

## 🛡 Security and Privacy

This software runs entirely within your web browser. No data leaves your local network or is sent to remote servers. All communications occur through the local USB connection between your computer and the hardware. You maintain full control over the device. You can verify the source code by visiting the repository linked in the documentation. The project uses open standards to ensure transparency and longevity for your device.